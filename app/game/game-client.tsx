'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { Player, Score, GameState, Hole, Waypoint } from '@/lib/types'
import { checkPenaltyShot } from '@/lib/scoring'

import CommitPhase from '@/components/game/CommitPhase'
import RevealPhase from '@/components/game/RevealPhase'
import DrinkPhase from '@/components/game/DrinkPhase'
import ScoringPhase from '@/components/game/ScoringPhase'
import FinalScoreboard from '@/components/game/FinalScoreboard'
import InfoSheet from '@/components/InfoSheet'
import RouteStrip from '@/components/RouteStrip'
import RouteTimeline from '@/components/RouteTimeline'

const TOTAL_PLAYERS = 4
const DRINK_DEADLINE_MS = 15 * 60 * 1000 // 15-min timer starts when all players commit

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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Initial data load
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

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('game-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'scores' },
        (payload) => {
          setScores((prev) => [...prev, payload.new as Score])
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'scores' },
        (payload) => {
          setScores((prev) =>
            prev.map((s) => (s.id === (payload.new as Score).id ? (payload.new as Score) : s))
          )
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'game_state' },
        (payload) => {
          setGameState(payload.new as GameState)
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'holes' },
        (payload) => {
          setHoles((prev) =>
            prev.map((h) => (h.id === (payload.new as Hole).id ? (payload.new as Hole) : h))
          )
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // Auto-transition: committing → reveal (when all players committed)
  // Also sets the 15-min drink timer so it starts running from commit time.
  useEffect(() => {
    if (!gameState || gameState.phase !== 'committing') return
    const committedThisHole = scores.filter(
      (s) => s.hole_id === gameState.current_hole && s.committed_sips != null
    )
    if (committedThisHole.length >= TOTAL_PLAYERS) {
      const deadline = new Date(Date.now() + DRINK_DEADLINE_MS).toISOString()
      supabase
        .from('game_state')
        .update({ phase: 'reveal', drink_deadline_at: deadline })
        .eq('id', 1)
        .eq('phase', 'committing')
        .then()
    }
  }, [scores, gameState])

  // Auto-transition: drinking → scoring when all answered OR 15-min timer expires.
  useEffect(() => {
    if (!gameState || gameState.phase !== 'drinking') return
    const answeredThisHole = scores.filter(
      (s) => s.hole_id === gameState.current_hole && s.completed !== null
    )
    if (answeredThisHole.length >= TOTAL_PLAYERS) {
      supabase
        .from('game_state')
        .update({ phase: 'scoring', drink_deadline_at: null })
        .eq('id', 1)
        .eq('phase', 'drinking')
        .then()
    }
  }, [scores, gameState])

  // Auto-fail anyone who hasn't answered when the 15-min deadline expires,
  // then advance to scoring. Idempotent: .is('completed', null) guard.
  useEffect(() => {
    if (!gameState || gameState.phase !== 'drinking' || !gameState.drink_deadline_at) return
    const deadline = new Date(gameState.drink_deadline_at).getTime()
    const currentHole = gameState.current_hole
    function expireSlackers() {
      if (Date.now() < deadline) return
      const stillNull = scores.filter(
        (s) => s.hole_id === currentHole && s.completed === null
      )
      for (const s of stillNull) {
        supabase
          .from('scores')
          .update({ completed: false })
          .eq('id', s.id)
          .is('completed', null)
          .then()
      }
    }
    expireSlackers()
    const interval = setInterval(expireSlackers, 2000)
    return () => clearInterval(interval)
  }, [gameState, scores])

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

      await supabase.from('scores').insert({
        player_id: currentPlayer.id,
        hole_id: gameState.current_hole,
        committed_sips: sips,
        penalty_shot: reasons.length > 0,
        penalty_shot_reason: reasons[0] ?? null, // primary reason for backward compat
        penalty_shot_reasons: reasons,
      })
    },
    [currentPlayer, gameState, scores, holes]
  )

  const handleRevealComplete = useCallback(async () => {
    // Timer was already set when everyone committed — just advance the phase.
    await supabase
      .from('game_state')
      .update({ phase: 'drinking' })
      .eq('id', 1)
      .eq('phase', 'reveal')
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
    },
    [currentPlayer, gameState]
  )

  const handleNextHole = useCallback(async () => {
    if (!gameState || holes.length === 0) return
    // Find next existing hole id (handles gaps + added stops dynamically)
    const sortedIds = holes.map((h) => h.id).sort((a, b) => a - b)
    const idx = sortedIds.indexOf(gameState.current_hole)
    const nextHole = sortedIds[idx + 1]
    if (nextHole == null) return // No more holes — game over
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

  // Loading state
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
        <button onClick={() => router.push('/')} className="btn-ghost w-auto px-6">
          Tilbage
        </button>
      </div>
    )
  }

  const currentHole = holes.find((h) => h.id === gameState.current_hole)
  const currentHoleScores = scores.filter((s) => s.hole_id === gameState.current_hole)
  const myCurrentScore = currentHoleScores.find((s) => s.player_id === currentPlayer.id)
  const canSwitchPlayer = !myCurrentScore || myCurrentScore.committed_sips == null

  // Sorted hole ids — handles non-contiguous IDs (added/removed stops)
  const sortedHoleIds = holes.map((h) => h.id).sort((a, b) => a - b)
  const totalHoles = sortedHoleIds.length
  const lastHoleId = sortedHoleIds[sortedHoleIds.length - 1]
  const currentHolePosition = sortedHoleIds.indexOf(gameState.current_hole) + 1
  const isLastHole = gameState.current_hole === lastHoleId

  // Defensive: if current hole was deleted from DB, show error
  if (!currentHole) {
    return (
      <div className="min-h-screen bg-parchment flex flex-col items-center justify-center gap-4 px-6">
        <p className="font-serif italic text-wine text-lg text-center">
          Stop {gameState.current_hole} findes ikke længere. Få Lukas til at fixe det.
        </p>
      </div>
    )
  }

  // Final scoreboard — when on the last hole's scoring phase
  if (gameState.phase === 'scoring' && isLastHole) {
    return (
      <FinalScoreboard
        players={players}
        scores={scores}
        holes={holes}
        currentPlayer={currentPlayer}
      />
    )
  }

  return (
    <div className="min-h-screen bg-parchment">
      {/* Sticky header — Valencia style */}
      <header
        className="sticky top-0 z-40 backdrop-blur-sm"
        style={{ background: 'rgba(251,232,200,0.97)', borderBottom: '1px solid #D8B888' }}
      >
        <div className="max-w-md mx-auto flex items-center justify-between px-5 gap-2" style={{ padding: '10px 20px' }}>
          {canSwitchPlayer ? (
            <button
              onClick={handleSwitchPlayer}
              className="flex items-center gap-1.5 min-w-0"
              aria-label="Skift spiller"
            >
              <span className="font-sans text-ink-muted" style={{ fontSize: '0.9rem' }}>‹</span>
              <span className="font-serif text-ink truncate" style={{ fontWeight: 600, fontSize: '1.05rem' }}>
                {currentPlayer.name}
              </span>
            </button>
          ) : (
            <span className="font-serif text-ink truncate min-w-0" style={{ fontWeight: 600, fontSize: '1.05rem' }}>
              {currentPlayer.name}
            </span>
          )}

          <div className="text-center flex-shrink-0">
            <p className="smallcaps">
              Stop {currentHolePosition}
              <span style={{ color: '#C8381A' }}> · </span>
              {totalHoles}
            </p>
          </div>

          {/* Arch icon */}
          <button
            onClick={() => setShowInfo(true)}
            className="flex items-center justify-center"
            aria-label="Vis info"
            style={{ width: 30, display: 'flex', justifyContent: 'flex-end' }}
          >
            <svg viewBox="0 0 24 24" width={22} height={22} fill="none">
              <path d="M4 20 L4 10 Q4 4 12 4 Q20 4 20 10 L20 20" stroke="#C8381A" strokeWidth="1.5" />
              <line x1="2" y1="20" x2="22" y2="20" stroke="#C8381A" strokeWidth="1.5" />
              <line x1="8" y1="20" x2="8" y2="14" stroke="#C8381A" strokeWidth="1" />
              <line x1="16" y1="20" x2="16" y2="14" stroke="#C8381A" strokeWidth="1" />
            </svg>
          </button>
        </div>

        {/* Route progress strip — tap to open timeline */}
        <div className="max-w-md mx-auto" style={{ borderTop: '1px solid rgba(216,205,176,0.5)' }}>
          <RouteStrip
            holes={holes}
            currentHoleId={gameState.current_hole}
            onClick={() => setShowRoute(true)}
          />
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-md mx-auto px-4 py-5 pb-10">
        {gameState.phase === 'committing' && (() => {
          const prevHoleId = sortedHoleIds[sortedHoleIds.indexOf(gameState.current_hole) - 1]
          const myPrev = scores.find(
            (s) => s.player_id === currentPlayer.id && s.hole_id === prevHoleId
          )
          return (
            <CommitPhase
              hole={currentHole}
              myScore={myCurrentScore}
              myPreviousSips={myPrev?.committed_sips ?? null}
              committedCount={currentHoleScores.filter((s) => s.committed_sips != null).length}
              totalPlayers={TOTAL_PLAYERS}
              currentPlayerName={currentPlayer.name}
              onCommit={handleCommit}
            />
          )
        })()}

        {gameState.phase === 'reveal' && (
          <RevealPhase
            hole={currentHole}
            scores={currentHoleScores}
            players={players}
            myScore={myCurrentScore}
            onRevealComplete={handleRevealComplete}
          />
        )}

        {gameState.phase === 'drinking' && (
          <DrinkPhase
            hole={currentHole}
            scores={currentHoleScores}
            players={players}
            myScore={myCurrentScore}
            deadlineAt={gameState.drink_deadline_at}
            onDrinkResult={handleDrinkResult}
          />
        )}

        {gameState.phase === 'scoring' && (
          <ScoringPhase
            hole={currentHole}
            scores={currentHoleScores}
            players={players}
            allScores={scores}
            holes={holes}
            onNextHole={handleNextHole}
          />
        )}
      </main>

      {/* Info sheet — Stilling | Historik | Regler */}
      {showInfo && (
        <InfoSheet
          players={players}
          scores={scores}
          holes={holes}
          gameState={gameState}
          currentPlayerId={currentPlayer.id}
          onClose={() => setShowInfo(false)}
        />
      )}

      {/* Route timeline overlay */}
      {showRoute && (
        <RouteTimeline
          holes={holes}
          waypoints={waypoints}
          scores={scores}
          players={players}
          currentHoleId={gameState.current_hole}
          currentPlayerName={currentPlayer.name}
          onClose={() => setShowRoute(false)}
        />
      )}
    </div>
  )
}
