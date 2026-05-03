'use client'

import type { Player, Score, Hole } from '@/lib/types'
import { computeLeaderboard } from '@/lib/scoring'
import { formatDateHeader } from '@/lib/format'
import ArchDivider from '@/components/decorations/ArchDivider'

interface Props {
  players: Player[]
  scores: Score[]
  holes: Hole[]
  currentPlayer: Player
}

export default function FinalScoreboard({ players, scores, holes, currentPlayer }: Props) {
  const board = computeLeaderboard(players, scores, holes)
  const winner = board[0]
  const { date } = formatDateHeader()

  const totalSips = scores
    .filter((s) => {
      const h = holes.find((x) => x.id === s.hole_id)
      return s.committed_sips != null && !h?.is_practice
    })
    .reduce((sum, s) => sum + (s.committed_sips ?? 0), 0)

  const playedStops = new Set(
    scores.filter((s) => s.committed_sips != null).map((s) => s.hole_id)
  ).size

  return (
    <div className="min-h-screen bg-parchment">
      {/* Cobalt hero */}
      <div
        className="azulejo-bg"
        style={{ padding: '40px 24px 32px', position: 'relative', overflow: 'hidden' }}
      >
        <div style={{ position: 'relative', zIndex: 2, textAlign: 'center' }}>
          <p className="smallcaps" style={{ color: 'rgba(240,234,214,0.6)', marginBottom: 20 }}>
            Final · {date}
          </p>

          {/* Moorish arch watermark */}
          <svg
            viewBox="0 0 200 100"
            width={140}
            style={{ display: 'block', margin: '0 auto', opacity: 0.2 }}
          >
            <path
              d="M20 100 L20 50 Q20 5 100 5 Q180 5 180 50 L180 100"
              fill="none"
              stroke="#F0EAD6"
              strokeWidth="2"
            />
          </svg>

          {/* Winner overlay */}
          <div style={{ marginTop: -70, position: 'relative', zIndex: 3 }}>
            <p
              className="font-serif"
              style={{
                fontWeight: 900,
                fontSize: '3rem',
                color: '#F0EAD6',
                lineHeight: 1,
                textShadow: '0 2px 12px rgba(0,0,0,0.3)',
              }}
            >
              {winner?.player.name ?? ''}
            </p>
            <p
              className="smallcaps"
              style={{ marginTop: 10, color: '#F5C860', letterSpacing: '0.22em' }}
            >
              Winner · {winner?.total ?? 0} points
            </p>
          </div>
        </div>
      </div>

      {/* Arch divider */}
      <ArchDivider color="rgba(26,74,122,0.35)" bg="#FBE8C8" />

      <div style={{ padding: '16px 24px 32px' }}>
        {/* Title */}
        <h1 className="font-serif" style={{ fontWeight: 900, fontSize: '2.6rem', color: '#2A0A06', lineHeight: 1, marginBottom: 2 }}>
          The route
        </h1>
        <h1 className="font-serif italic" style={{ fontWeight: 900, fontSize: '2.6rem', color: '#C8381A', lineHeight: 1, marginBottom: 24 }}>
          is complete.
        </h1>

        {/* Leaderboard */}
        <div style={{ borderTop: '1px solid #D8B888', marginBottom: 24 }}>
          {board.map((entry, i) => (
            <div
              key={entry.player.id}
              className="flex items-center justify-between"
              style={{ padding: '16px 0', borderBottom: '1px solid #D8B888' }}
            >
              <div className="flex items-center gap-3">
                <span className="font-mono text-ink-muted" style={{ fontSize: '0.65rem', width: 20 }}>
                  {i + 1}
                </span>
                <div>
                  <p className="font-serif" style={{ fontWeight: 600, fontSize: '1.2rem', color: '#2A0A06' }}>
                    {entry.player.name}
                    {entry.player.id === currentPlayer.id && (
                      <span className="font-sans italic text-ink-muted" style={{ fontSize: '0.9rem', marginLeft: 8 }}>
                        (dig)
                      </span>
                    )}
                  </p>
                  <p className="font-mono text-ink-muted" style={{ fontSize: '0.65rem', marginTop: 3, letterSpacing: '0.06em' }}>
                    {entry.spotOns} spot-on
                    {entry.commitmentFails > 0 && ` · ${entry.commitmentFails} fejl`}
                    {entry.penaltyShots > 0 && ` · ${entry.penaltyShots} shots`}
                  </p>
                </div>
              </div>
              <span className="font-serif" style={{ fontWeight: 900, fontSize: '2rem', color: '#2A0A06' }}>
                {entry.total}
              </span>
            </div>
          ))}
        </div>

        {/* Stats grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            border: '1px solid #D8B888',
            marginBottom: 24,
          }}
        >
          {[
            { label: 'Stops', value: playedStops },
            { label: 'Sips', value: totalSips },
            { label: 'End', value: '🌅' },
          ].map((stat, i) => (
            <div
              key={stat.label}
              style={{
                padding: '16px 8px',
                textAlign: 'center',
                borderRight: i < 2 ? '1px solid #D8B888' : 'none',
              }}
            >
              <p className="smallcaps" style={{ marginBottom: 6 }}>{stat.label}</p>
              <p className="font-serif" style={{ fontWeight: 700, fontSize: '1.5rem', color: '#2A0A06', lineHeight: 1 }}>
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        {/* Bottom tile border */}
        <div className="tile-border" style={{ marginBottom: 20 }} />
        <p className="text-center smallcaps" style={{ marginBottom: 20 }}>Round complete</p>

        <button onClick={() => window.location.href = '/'} className="btn-ghost">
          Back to start
        </button>
      </div>
    </div>
  )
}
