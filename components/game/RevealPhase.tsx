'use client'

import { useEffect, useState } from 'react'
import type { Hole, Player, Score } from '@/lib/types'
import { calculateGroupAverage } from '@/lib/scoring'
import TileRule from '@/components/decorations/TileRule'

interface Props {
  hole: Hole
  scores: Score[]
  players: Player[]
  myScore: Score | undefined
  onRevealComplete: () => Promise<void>
}

interface RevealedPlayer {
  player: Player
  score: Score | undefined
  sips: number
  distance: number
  position: number
}

function penaltyReasonText(reason: string | null, maxSips: number): string {
  switch (reason) {
    case 'max':
      return `meldt ${maxSips} (max)`
    case 'min':
      return 'meldt 1 (min)'
    case 'same_as_last':
      return 'samme tal som forrige'
    case '8':
      return 'meldt 8'
    default:
      return 'straf-shot'
  }
}

function distanceLabel(sips: number, avg: number): { text: string; tone: 'good' | 'neutral' | 'bad' } {
  const diff = +(sips - avg).toFixed(1)
  if (Math.abs(diff) <= 0.5) return { text: 'Spot on', tone: 'good' }
  if (diff < 0) return { text: `${diff.toFixed(1)} under`, tone: Math.abs(diff) <= 1.0 ? 'good' : 'neutral' }
  return { text: `+${diff.toFixed(1)} over`, tone: diff <= 1.0 ? 'neutral' : 'bad' }
}

export default function RevealPhase({ hole, scores, players, onRevealComplete }: Props) {
  const [revealed, setRevealed] = useState(false)
  const [advancing, setAdvancing] = useState(false)

  const committed = scores.filter((s) => s.committed_sips != null)
  const allSips = committed.map((s) => s.committed_sips as number)
  const avg = calculateGroupAverage(allSips)

  const revealedPlayers: RevealedPlayer[] = players.map((p) => {
    const score = committed.find((s) => s.player_id === p.id)
    const sips = (score?.committed_sips as number) ?? 0
    return { player: p, score, sips, distance: Math.abs(sips - avg), position: 0 }
  })

  const sorted = [...revealedPlayers].sort(
    (a, b) => a.distance - b.distance || a.sips - b.sips
  )
  sorted.forEach((p, i) => (p.position = i + 1))

  useEffect(() => {
    const t = setTimeout(() => setRevealed(true), 200)
    return () => clearTimeout(t)
  }, [])

  async function handleAdvance() {
    setAdvancing(true)
    await onRevealComplete()
  }

  return (
    <div className="space-y-7">
      {/* Header */}
      <div className="text-center fade-up">
        <p className="smallcaps">
          {hole.name} · Max {hole.max_sips}
        </p>
        <h2 className="display-lg mt-3 fade-up">The numbers,</h2>
        <h2 className="display-lg fade-up-1" style={{ fontStyle: 'italic' }}>revealed.</h2>
        <TileRule wide />
      </div>

      {/* 2×2 player grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 1,
          background: '#D8B888',
          border: '1px solid #D8B888',
        }}
      >
        {revealedPlayers.map((rp, i) => {
          const isLeader = rp.position === 1 && !hole.is_practice
          const label = distanceLabel(rp.sips, avg)
          const numberColor =
            label.tone === 'good' ? '#3A6820' : label.tone === 'bad' ? '#8B1A1A' : '#2A0A06'
          const distColor =
            label.tone === 'good' ? '#3A6820' : label.tone === 'bad' ? '#8B1A1A' : '#8A5030'
          return (
            <div
              key={rp.player.id}
              style={{
                background: '#FEFDFB',
                padding: '16px 14px',
                borderLeft: isLeader ? '3px solid #E8A020' : undefined,
                opacity: revealed ? 1 : 0,
                transition: `opacity 0.4s cubic-bezier(0.34,1.56,0.64,1)`,
                transitionDelay: `${i * 0.08}s`,
              }}
            >
              <div className="flex items-baseline justify-between" style={{ marginBottom: 4 }}>
                <span className="font-mono text-ink-muted" style={{ fontSize: '0.65rem', letterSpacing: '0.1em' }}>
                  {rp.player.display_order}
                </span>
                {isLeader && <span className="smallcaps-gold">Leader</span>}
              </div>
              <p className="font-serif" style={{ fontWeight: 600, fontSize: '1.05rem', color: '#2A0A06', marginBottom: 8 }}>
                {rp.player.name}
              </p>
              <p className="font-serif leading-none" style={{ fontWeight: 900, fontSize: '2.8rem', color: numberColor, lineHeight: 1, marginBottom: 4 }}>
                {revealed ? rp.sips : '·'}
              </p>
              <p className="smallcaps" style={{ color: distColor }}>{label.text}</p>
            </div>
          )
        })}
      </div>

      {/* Average row */}
      <div className="flex items-center justify-between py-3" style={{ borderTop: '1px solid #D8B888', borderBottom: '1px solid #D8B888' }}>
        <span className="smallcaps">Gennemsnit</span>
        <span className="font-mono text-ink" style={{ fontSize: '1.1rem', fontWeight: 600, letterSpacing: '0.05em' }}>
          {avg.toFixed(1)} slurke
        </span>
      </div>

      {/* Penalty shots */}
      {committed.some((s) => s.penalty_shot) && (
        <div style={{ borderLeft: '3px solid #8B1A1A', paddingLeft: 16, paddingTop: 8, paddingBottom: 8 }}>
          <p className="smallcaps text-wine" style={{ marginBottom: 8 }}>Straf-shots</p>
          {committed
            .filter((s) => s.penalty_shot)
            .map((s) => {
              const player = players.find((p) => p.id === s.player_id)
              const reasons = s.penalty_shot_reasons?.length > 0
                ? s.penalty_shot_reasons
                : (s.penalty_shot_reason ? [s.penalty_shot_reason] : [])
              const shotCount = reasons.length || 1
              return (
                <div key={s.id} style={{ marginBottom: 6 }}>
                  <p className="font-serif italic text-ink" style={{ fontSize: '1rem' }}>
                    {player?.name}
                    {shotCount > 1 && (
                      <span className="font-mono text-wine font-semibold" style={{ marginLeft: 6 }}>
                        × {shotCount}
                      </span>
                    )}
                  </p>
                  <ul style={{ marginLeft: 10, marginTop: 2 }}>
                    {reasons.map((r, i) => (
                      <li key={i} className="font-sans text-ink-secondary" style={{ fontSize: '0.82rem', marginTop: 2 }}>
                        — {penaltyReasonText(r, hole.max_sips)}
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })}
        </div>
      )}

      {/* Drink instruction */}
      <div className="text-center py-3">
        <p className="smallcaps" style={{ marginBottom: 6 }}>Drik nu</p>
        <p className="font-sans italic text-ink-secondary" style={{ fontSize: '1rem' }}>
          Tøm din drink på dit meldte antal slurke.
        </p>
      </div>

      <button onClick={handleAdvance} disabled={advancing} className="btn-primary">
        {advancing ? 'Venter...' : 'Fortsæt'}
      </button>
    </div>
  )
}
