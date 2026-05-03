'use client'

import { useState } from 'react'
import type { Hole, Player, Score } from '@/lib/types'
import { computeHoleScores, computeLeaderboard, calculateGroupAverage } from '@/lib/scoring'
import TileRule from '@/components/decorations/TileRule'

interface Props {
  hole: Hole
  scores: Score[]
  players: Player[]
  allScores: Score[]
  holes: Hole[]
  onNextHole: () => Promise<void>
}

export default function ScoringPhase({ hole, scores, players, allScores, holes, onNextHole }: Props) {
  const [advancing, setAdvancing] = useState(false)

  const multiplier = hole.score_multiplier ?? 1
  const holeScores = computeHoleScores(players, scores, hole.id, hole.is_practice, multiplier)
  const allSips = scores.filter((s) => s.committed_sips != null).map((s) => s.committed_sips as number)
  const avg = calculateGroupAverage(allSips)
  const leaderboard = computeLeaderboard(players, allScores, holes)

  const sorted = [...holeScores].sort((a, b) => a.rawTotal - b.rawTotal)
  const lastHoleId = Math.max(...holes.map((h) => h.id))
  const isLastHole = hole.id === lastHoleId
  const sortedIds = holes.map((h) => h.id).sort((a, b) => a - b)
  const nextHoleId = sortedIds[sortedIds.indexOf(hole.id) + 1]

  async function handleNext() {
    setAdvancing(true)
    try {
      await onNextHole()
    } finally {
      setAdvancing(false)
    }
  }

  return (
    <div className="space-y-7">
      {/* Header */}
      <div className="text-center fade-up">
        <p className="smallcaps">
          {hole.name} · Stop {hole.id}
        </p>
        <h2 className="display-lg mt-3">The standings</h2>
        <p className="font-sans italic text-ink-muted" style={{ fontSize: '0.9rem', marginTop: 6 }}>
          Average: {avg.toFixed(1)} sips
        </p>
        {multiplier > 1 && !hole.is_practice && (
          <p className="smallcaps-terra" style={{ marginTop: 8 }}>× {multiplier} multiplier</p>
        )}
        <TileRule wide />
      </div>

      {/* Hole scores */}
      <section>
        <p className="smallcaps" style={{ marginBottom: 10 }}>Points this stop</p>

        {hole.is_practice && (
          <p
            className="font-sans italic text-ink-muted text-center"
            style={{ fontSize: '0.9rem', padding: '10px 0', borderTop: '1px solid #D8B888', borderBottom: '1px solid #D8B888', marginBottom: 12 }}
          >
            Prøverunde — point tæller ikke
          </p>
        )}

        <div style={{ borderTop: '1px solid #D8B888' }}>
          {sorted.map(({ player, score, base, distancePenalty, commitmentPenalty, total }, i) => {
            const totalPenalty = distancePenalty + commitmentPenalty
            const scoreColor =
              totalPenalty === 0 ? '#3A6820' : totalPenalty >= 4 ? '#8B1A1A' : '#2A0A06'
            return (
              <div
                key={player.id}
                className="flex items-center justify-between"
                style={{ padding: '14px 0', borderBottom: '1px solid #D8B888' }}
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-ink-muted" style={{ fontSize: '0.65rem', width: 20, letterSpacing: '0.1em' }}>
                    {i + 1}
                  </span>
                  <div>
                    <p className="font-serif" style={{ fontWeight: 600, fontSize: '1.05rem', color: '#2A0A06' }}>
                      {player.name}
                    </p>
                    {score?.penalty_shot && (
                      <p className="font-mono text-ink-muted" style={{ fontSize: '0.65rem', marginTop: 2, letterSpacing: '0.06em' }}>
                        + straf-shot
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="font-mono text-ink-muted" style={{ fontSize: '0.75rem' }}>
                    {base != null && `${base}s`}
                    {distancePenalty > 0 && ` +${distancePenalty}`}
                    {commitmentPenalty > 0 && ` +${commitmentPenalty}`}
                    {!hole.is_practice && multiplier > 1 && ` ×${multiplier}`}
                  </span>
                  <span className="font-serif" style={{ fontWeight: 700, fontSize: '1.6rem', color: scoreColor }}>
                    {hole.is_practice ? distancePenalty + commitmentPenalty : total}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Total leaderboard */}
      {!hole.is_practice && (
        <section>
          <p className="smallcaps" style={{ marginBottom: 10 }}>Total standings</p>
          <div style={{ borderTop: '1px solid #D8B888' }}>
            {leaderboard.map((entry, i) => (
              <div
                key={entry.player.id}
                className="flex items-center justify-between"
                style={{ padding: '14px 0', borderBottom: '1px solid #D8B888' }}
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-ink-muted" style={{ fontSize: '0.65rem', width: 20, letterSpacing: '0.1em' }}>
                    {i + 1}
                  </span>
                  <div>
                    <p className="font-serif" style={{ fontWeight: 600, fontSize: '1.05rem', color: '#2A0A06' }}>
                      {entry.player.name}
                    </p>
                    {(entry.penaltyShots > 0 || entry.commitmentFails > 0) && (
                      <p className="font-mono text-ink-muted" style={{ fontSize: '0.65rem', marginTop: 2, letterSpacing: '0.06em' }}>
                        {entry.penaltyShots > 0 && `${entry.penaltyShots} shots`}
                        {entry.penaltyShots > 0 && entry.commitmentFails > 0 && ' · '}
                        {entry.commitmentFails > 0 && `${entry.commitmentFails} fejl`}
                      </p>
                    )}
                  </div>
                </div>
                <span className="font-serif" style={{ fontWeight: 700, fontSize: '1.6rem', color: '#2A0A06' }}>
                  {entry.total}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      <button onClick={handleNext} disabled={advancing} className="btn-primary">
        {advancing
          ? 'Går videre...'
          : isLastHole
          ? 'Final · See Results'
          : `Continue · Stop ${nextHoleId ?? ''}`}
      </button>
    </div>
  )
}
