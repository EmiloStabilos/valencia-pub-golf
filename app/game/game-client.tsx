'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { Player, Score, GameState, Hole, Waypoint } from '@/lib/types'
import { checkPenaltyShot } from '@/lib/scoring'

import CommitPhase from '@/components/game/CommitPhase'
import WildcardChallenge from '@/components/game/WildcardChallenge'
import RevealPhase from '@/components/game/RevealPhase'
import DrinkPhase from '@/components/game/DrinkPhase'
import ScoringPhase from '@/components/game/ScoringPhase'
import FinalScoreboard from '@/components/game/FinalScoreboard'
import InfoSheet from '@/components/InfoSheet'
import RouteStrip from '@/components/RouteStrip'
import RouteTimeline from '@/components/RouteTimeline'

const DRINK_DEADLINE_MS = 10 * 60 * 1000

export default function GamePage() {
  const router = useRouter()
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null)
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [scores, setScores] = useState<Score[]>([])
  const [holes, setHoles] = useState<Hole[]>([])
  const [waypoints, setWaypoints] = useState<Waypoint[]>([])
  const [showInfo, setShowInfo] = useState(false)
  const [showRoute, setShowRoute] = useState(false)
  const [wildcardDone, setWildcardDone] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const playerId = localStorage.getItem('athens_player_id')
    if (!playerId) {
      router.push('/')
      return
    }

    async function initialize() {
      try {
        const [playerRes, playersRes, gameStateRes, scoresRes, holesRes, waypointsRes] = await Promise.all([
          supabase.from('players').select('*').eq('id', playerId).single(),
          supabase.from('players').select('*').order('display_order'),
          supabase.from('game_state').select('*').eq('id', 1).single(),
          supabase.from('scores').select('*'),
          supabase.from('holes').select('*').order('id'),
          supabase.from('waypoints').select('*').order('after_hole_id, display_order'),
        ])

        if (playerRes.error || !playerRes.data) {
          router.push('/')
          return
        }

        setCurrentPlayer(playerRes.data)
        setPlayers(playersRes.data || [])
        setGameState(gameStateRes.data)
        setScores(scoresRes.data || [])
        setHoles(holesRes.data || [])
        setWaypoints(waypointsRes.data || [])
      } catch {
        setError('Kunne ikke hente spildata. Tjek forbindelsen og prøv igen.')
      } finally {
        setLoading(false)
      }
    }

    initialize()
  }, [router])

  useEffect(() => {
    const channel = supabase
      .channel('game-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'scores' }, (payload) => {
        setScores((prev) => [...prev, payload.new as Score])
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'scores' }, (payload) => {
        setScores((prev) =>
          prev.map((s) => (s.id === (payload.new as Score).id ? (payload.new as Score) : s))
        )
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'game_state' }, (payload) => {
        setGameState(payload.new as GameState)
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'holes' }, (payload) => {
        setHoles((prev) =>
          prev.map((h) => (h.id === (payload.new as Hole).id ? (payload.new as Hole) : h))
        )
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  useEffect(() => {
    if (!gameState || gameState.phase !== 'committing') return
    const committedThisHole = scores.filter(
      (s) => s.hole_id === gameState.current_hole && s.committed_sips != null
    )
    if (committedThisHole.length >= activePlayers.length) {
      supabase
        .from('game_state')
        .update({ phase: 'reveal' })
        .eq('id', 1)
        .eq('phase', 'committing')
        .then()
    }
  }, [scores, gameState])

  useEffect(() => {
    if (!gameState || gameState.phase !== 'drinking') return
    const answeredThisHole = scores.filter(
      (s) => s.hole_id === gameState.current_hole && s.completed !== null
    )
    if (answeredThisHole.length >= activePlayers.length) {
      supabase
        .from('game_state')
        .update({ phase: 'scoring', drink_deadline_at: null })
        .eq('id', 1)
        .eq('phase', 'drinking')
        .then()
    }
  }, [scores, gameState])

  useEffect(() => {
    if (!gameState || gameState.phase !== 'drinking' || !gameState.drink_deadline_at) return
    const deadline = new Date(gameState.drink_deadline_at).getTime()
    const currentHole = gameState.current_hole
    function expireSlackers() {
      if (Date.now() < deadline) return
      const stillNull = scores.filter((s) => s.hole_id === currentHole && s.completed === null)
      for (const s of stillNull) {
        supabase.from('scores').update({ completed: false }).eq('id', s.id).is('completed', null).then()
      }
    }
    expireSlackers()
    const interval = setInterval(expireSlackers, 2000)
    return () => clearInterval(interval)
  }, [gameState, scores])

  useEffect(() => {
    if (!gameState) return
    const done = sessionStorage.getItem(`wildcard_done_${gameState.current_hole}`) === 'true'
    setWildcardDone(done)
  }, [gameState?.current_hole])

  const handleWildcardDone = useCallback(() => {
    if (!gameState) return
    sessionStorage.setItem(`wildcard_done_${gameState.current_hole}`, 'true')
    setWildcardDone(true)
  }, [gameState])

  const handleCommit = useCallback(
    async (sips: number) => {
      if (!currentPlayer || !gameState) return
      const prevScore = scores.find(
        (s) => s.player_id === currentPlayer.id && s.hole_id === gameState.current_hole - 1
      )
      const prevSips = prevScore?.committed_sips ?? null
      const currentHoleData = holes.find((h) => h.id === gameState.current_hole)
      const maxSips = currentHoleData?.max_sips ?? 8
      const { reasons } = checkPenaltyShot(sips, maxSips, prevSips, gameState.current_hole)

      const wildcardFail = sessionStorage.getItem(`wildcard_fail_${gameState.current_hole}`) === 'true'
      const allReasons = wildcardFail ? [...reasons, 'wildcard'] : reasons

      await supabase.from('scores').insert({
        player_id: currentPlayer.id,
        hole_id: gameState.current_hole,
        committed_sips: sips,
        penalty_shot: allReasons.length > 0,
        penalty_shot_reason: allReasons[0] ?? null,
        penalty_shot_reasons: allReasons,
      })

      if (wildcardFail) sessionStorage.removeItem(`wildcard_fail_${gameState.current_hole}`)
    },
    [currentPlayer, gameState, scores, holes]
  )

  const handleRevealComplete = useCallback(async () => {
    await supabase.from('game_state').update({ phase: 'drinking' }).eq('id', 1).eq('phase', 'reveal')
  }, [])

  const handleDrinkResult = useCallback(
    async (completed: boolean) => {
      if (!currentPlayer || !gameState) return
      await supabase
        .from('scores')
        .update({ completed })
        .eq('player_id', currentPlayer.id)
        .eq('hole_id', gameState.current_hole)
        .is('completed', null)
      if (!gameState.drink_deadline_at) {
        const deadline = new Date(Date.now() + DRINK_DEADLINE_MS).toISOString()
        await supabase
          .from('game_state')
          .update({ drink_deadline_at: deadline })
          .eq('id', 1)
          .is('drink_deadline_at', null)
      }
    },
    [currentPlayer, gameState]
  )

  const handleNextHole = useCallback(async () => {
    if (!gameState || holes.length === 0) return
    const sortedIds = holes.map((h) => h.id).sort((a, b) => a - b)
    const idx = sortedIds.indexOf(gameState.current_hole)
    const nextHole = sortedIds[idx + 1]
    if (nextHole == null) return
    await supabase
      .from('game_state')
      .update({ current_hole: nextHole, phase: 'committing', drink_deadline_at: null })
      .eq('id', 1)
      .eq('phase', 'scoring')
  }, [gameState, holes])

  const handleSwitchPlayer = useCallback(() => {
    localStorage.removeItem('athens_player_id')
    router.push('/')
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-parchment flex flex-col items-center justify-center gap-4">
        <div className="w-6 h-6 border border-ink border-t-transparent rounded-full animate-spin" />
        <p className="smallcaps">Henter spildata</p>
      </div>
    )
  }

  if (error || !gameState || !currentPlayer) {
    return (
      <div className="min-h-screen bg-parchment flex flex-col items-center justify-center gap-4 px-6">
        <p className="font-serif italic text-wine text-lg text-center">{error ?? 'Noget gik galt'}</p>
        <button onClick={() => router.push('/')} className="btn-ghost w-auto px-6">Tilbage</button>
      </div>
    )
  }

  const activePlayers = players.filter((p) => p.active)
  const currentHole = holes.find((h) => h.id === gameState.current_hole)
  const currentHoleScores = scores.filter((s) => s.hole_id === gameState.current_hole)
  const myCurrentScore = currentHoleScores.find((s) => s.player_id === currentPlayer.id)
  const canSwitchPlayer = !myCurrentScore || myCurrentScore.committed_sips == null

  const sortedHoleIds = holes.map((h) => h.id).sort((a, b) => a - b)
  const totalHoles = sortedHoleIds.length
  const lastHoleId = sortedHoleIds[sortedHoleIds.length - 1]
  const currentHolePosition = sortedHoleIds.indexOf(gameState.current_hole) + 1
  const isLastHole = gameState.current_hole === lastHoleId

  if (!currentHole) {
    return (
      <div className="min-h-screen bg-parchment flex flex-col items-center justify-center gap-4 px-6">
        <p className="font-serif italic text-wine text-lg text-center">
          Stop {gameState.current_hole} findes ikke længere. Få Lukas til at fixe det.
        </p>
      </div>
    )
  }

  if (gameState.phase === 'scoring' && isLastHole) {
    return (
      <FinalScoreboard
        players={activePlayers}
        scores={scores}
        holes={holes}
        currentPlayer={currentPlayer}
      />
    )
  }

  return (
    <div className="min-h-screen bg-parchment">
      <header
        className="sticky top-0 z-40 backdrop-blur-sm"
        style={{ background: 'rgb(var(--cobalt-rgb) / 0.97)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}
      >
        <div className="max-w-md mx-auto flex items-center justify-between px-5 gap-2" style={{ padding: '10px 20px' }}>
          {canSwitchPlayer ? (
            <button onClick={handleSwitchPlayer} className="flex items-center gap-1.5 min-w-0" aria-label="Skift spiller">
              <span className="font-sans" style={{ fontSize: '0.9rem', color: 'rgb(var(--limestone-rgb) / 0.5)' }}>‹</span>
              <span className="font-serif truncate" style={{ fontWeight: 600, fontSize: '1.05rem', color: 'var(--limestone)' }}>
                {currentPlayer.name}
              </span>
            </button>
          ) : (
            <span className="font-serif truncate min-w-0" style={{ fontWeight: 600, fontSize: '1.05rem', color: 'var(--limestone)' }}>
              {currentPlayer.name}
            </span>
          )}

          <div className="text-center flex-shrink-0">
            <p className="smallcaps" style={{ color: 'rgb(var(--limestone-rgb) / 0.7)' }}>
              Stop {currentHolePosition}
              <span style={{ color: 'var(--gold)' }}> · </span>
              {totalHoles}
            </p>
          </div>

          <button
            onClick={() => setShowInfo(true)}
            className="flex items-center justify-center"
            aria-label="Vis info"
            style={{ width: 30, display: 'flex', justifyContent: 'flex-end' }}
          >
            <svg viewBox="0 0 24 24" width={22} height={22} fill="none" style={{ color: 'var(--limestone)' }}>
              <path d="M4 20 L4 10 Q4 4 12 4 Q20 4 20 10 L20 20" stroke="currentColor" strokeWidth="1.5" />
              <line x1="2" y1="20" x2="22" y2="20" stroke="currentColor" strokeWidth="1.5" />
              <line x1="8" y1="20" x2="8" y2="14" stroke="currentColor" strokeWidth="1" />
              <line x1="16" y1="20" x2="16" y2="14" stroke="currentColor" strokeWidth="1" />
            </svg>
          </button>
        </div>

        <div className="max-w-md mx-auto" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <RouteStrip holes={holes} currentHoleId={gameState.current_hole} onClick={() => setShowRoute(true)} />
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-5 pb-10">
        {gameState.phase === 'committing' && (() => {
          const prevHoleId = sortedHoleIds[sortedHoleIds.indexOf(gameState.current_hole) - 1]
          const myPrev = scores.find((s) => s.player_id === currentPlayer.id && s.hole_id === prevHoleId)
          return (
            <>
              {!wildcardDone && (
                <WildcardChallenge
                  holeId={gameState.current_hole}
                  players={activePlayers}
                  currentPlayerId={currentPlayer.id}
                  onFail={() => {}}
                  onDone={handleWildcardDone}
                />
              )}
              <CommitPhase
                hole={currentHole}
                myScore={myCurrentScore}
                myPreviousSips={myPrev?.committed_sips ?? null}
                committedCount={currentHoleScores.filter((s) => s.committed_sips != null).length}
                totalPlayers={activePlayers.length}
                currentPlayerName={currentPlayer.name}
                onCommit={handleCommit}
              />
            </>
          )
        })()}

        {gameState.phase === 'reveal' && (
          <RevealPhase
            hole={currentHole}
            scores={currentHoleScores}
            players={activePlayers}
            myScore={myCurrentScore}
            onRevealComplete={handleRevealComplete}
          />
        )}

        {gameState.phase === 'drinking' && (
          <DrinkPhase
            hole={currentHole}
            scores={currentHoleScores}
            players={activePlayers}
            myScore={myCurrentScore}
            deadlineAt={gameState.drink_deadline_at}
            onDrinkResult={handleDrinkResult}
          />
        )}

        {gameState.phase === 'scoring' && (
          <ScoringPhase
            hole={currentHole}
            scores={currentHoleScores}
            players={activePlayers}
            allScores={scores}
            holes={holes}
            onNextHole={handleNextHole}
          />
        )}
      </main>

      {showInfo && (
        <InfoSheet
          players={activePlayers}
          scores={scores}
          holes={holes}
          gameState={gameState}
          currentPlayerId={currentPlayer.id}
          onClose={() => setShowInfo(false)}
        />
      )}

      {showRoute && (
        <RouteTimeline
          holes={holes}
          waypoints={waypoints}
          scores={scores}
          players={activePlayers}
          currentHoleId={gameState.current_hole}
          currentPlayerName={currentPlayer.name}
          onClose={() => setShowRoute(false)}
        />
      )}
    </div>
  )
}
