'use client'

import { useEffect, useState } from 'react'
import type { Hole, Player, Score } from '@/lib/types'
import TileRule from '@/components/decorations/TileRule'

interface Props {
  hole: Hole
  scores: Score[]
  players: Player[]
  myScore: Score | undefined
  deadlineAt: string | null
  onDrinkResult: (completed: boolean) => Promise<void>
}

export default function DrinkPhase({ hole, scores, players, myScore, deadlineAt, onDrinkResult }: Props) {
  const [submitting, setSubmitting] = useState(false)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [])

  const deadlineMs = deadlineAt ? new Date(deadlineAt).getTime() : null
  const remainingMs = deadlineMs != null ? Math.max(0, deadlineMs - now) : null
  const remainingSec = remainingMs != null ? Math.ceil(remainingMs / 1000) : null
  const remainingMin = remainingSec != null ? Math.floor(remainingSec / 60) : null
  const remainingSecPart = remainingSec != null ? remainingSec % 60 : null
  const isUrgent = remainingMs != null && remainingMs <= 60_000 && remainingMs > 0
  const isExpired = remainingMs === 0

  const hasAnswered = myScore?.completed !== null && myScore?.completed !== undefined

  async function handleDone() {
    setSubmitting(true)
    try {
      await onDrinkResult(true)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-7">
      {/* Header */}
      <div className="text-center fade-up">
        <p className="smallcaps">
          {hole.name} · Stop {hole.id}
        </p>
        <h2 className="display-lg mt-3 fade-up">Drik op.</h2>
        <TileRule wide />
      </div>

      {/* 15-min countdown */}
      <div
        className="border px-5 py-6 text-center transition-colors"
        style={{
          borderColor: isExpired ? 'rgba(139,26,26,0.6)' : isUrgent ? 'rgba(139,26,26,0.4)' : 'rgba(232,160,32,0.4)',
          background: isExpired ? 'rgba(139,26,26,0.1)' : isUrgent ? 'rgba(139,26,26,0.05)' : 'rgba(232,160,32,0.05)',
        }}
      >
        <p className="smallcaps" style={{ marginBottom: 4 }}>
          {isExpired ? 'Tid udløbet' : 'Tid tilbage'}
        </p>
        <p
          className="font-mono leading-none"
          style={{
            fontSize: '3rem',
            fontWeight: 600,
            letterSpacing: '0.04em',
            color: isExpired || isUrgent ? '#8B1A1A' : '#2A0A06',
          }}
        >
          {remainingMs == null
            ? '--:--'
            : isExpired
            ? '0:00'
            : `${remainingMin}:${String(remainingSecPart).padStart(2, '0')}`}
        </p>
        <p className="font-sans italic text-ink-muted" style={{ fontSize: '0.9rem', marginTop: 8 }}>
          {isExpired
            ? 'Fejlede automatisk — +III strafpoint.'
            : 'Bund drinken inden uret går — ellers +III strafpoint.'}
        </p>
      </div>

      {/* Committed card */}
      {myScore && (
        <div className="field-card text-center fade-up-2" style={{ padding: '28px 20px' }}>
          <p className="smallcaps" style={{ marginBottom: 10 }}>Du meldte</p>
          <p
            className="font-serif leading-none"
            style={{ fontWeight: 900, fontSize: '4.4rem', color: '#2A0A06', lineHeight: 1 }}
          >
            {myScore.committed_sips}
          </p>
          <p className="font-sans italic text-ink-muted" style={{ fontSize: '0.85rem', marginTop: 6 }}>
            {myScore.committed_sips} slurke
          </p>
        </div>
      )}

      {/* Done button or result */}
      {!hasAnswered ? (
        <div className="fade-up-3">
          <button onClick={handleDone} disabled={submitting || isExpired} className="btn-success">
            Klarede det
          </button>
        </div>
      ) : (
        <div className="field-card text-center" style={{ padding: '24px 20px' }}>
          {myScore?.completed === true ? (
            <>
              <p className="smallcaps" style={{ color: '#3A6820', marginBottom: 6 }}>Klaret</p>
              <p className="font-serif italic text-ink" style={{ fontSize: '1.1rem' }}>Æren intakt.</p>
            </>
          ) : (
            <>
              <p className="smallcaps" style={{ color: '#8B1A1A', marginBottom: 6 }}>Fejlede</p>
              <p className="font-serif italic text-ink" style={{ fontSize: '1.1rem' }}>+III strafpoint registreret.</p>
            </>
          )}
        </div>
      )}

      {/* Player status list */}
      <div style={{ borderTop: '1px solid #D8B888' }}>
        {players.map((player) => {
          const score = scores.find((s) => s.player_id === player.id)
          const done = score?.completed !== null && score?.completed !== undefined
          const status = !done ? 'Venter' : score?.completed ? 'Klaret' : 'Fejlede'
          const statusColor = !done ? '#8A5030' : score?.completed ? '#3A6820' : '#8B1A1A'
          return (
            <div
              key={player.id}
              className="flex items-center justify-between"
              style={{ padding: '12px 0', borderBottom: '1px solid #D8B888' }}
            >
              <div className="flex items-center gap-3">
                <span
                  className="font-mono text-ink-muted"
                  style={{ fontSize: '0.65rem', width: 20, letterSpacing: '0.1em' }}
                >
                  {player.display_order}
                </span>
                <span className="font-serif" style={{ fontWeight: 500, fontSize: '1.05rem', color: '#2A0A06' }}>
                  {player.name}
                </span>
              </div>
              <span className="smallcaps" style={{ color: statusColor }}>{status}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
