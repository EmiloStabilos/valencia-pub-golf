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
  const [sipsTaken, setSipsTaken] = useState(0)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [])

  const sipKey = myScore ? `sip-count-${hole.id}-${myScore.player_id}` : null
  useEffect(() => {
    if (!sipKey) return
    const stored = sessionStorage.getItem(sipKey)
    setSipsTaken(stored ? parseInt(stored, 10) || 0 : 0)
  }, [sipKey])
  useEffect(() => {
    if (!sipKey) return
    sessionStorage.setItem(sipKey, String(sipsTaken))
  }, [sipKey, sipsTaken])

  const deadlineMs = deadlineAt ? new Date(deadlineAt).getTime() : null
  const remainingMs = deadlineMs != null ? Math.max(0, deadlineMs - now) : null
  const remainingSec = remainingMs != null ? Math.ceil(remainingMs / 1000) : null
  const remainingMin = remainingSec != null ? Math.floor(remainingSec / 60) : null
  const remainingSecPart = remainingSec != null ? remainingSec % 60 : null
  const isUrgent = remainingMs != null && remainingMs <= 60_000 && remainingMs > 0
  const isExpired = remainingMs === 0

  const hasAnswered = myScore?.completed !== null && myScore?.completed !== undefined
  const committed = myScore?.committed_sips ?? 0
  const wentOver = committed > 0 && sipsTaken > committed

  async function handleResult(completed: boolean) {
    setSubmitting(true)
    try {
      await onDrinkResult(completed)
    } finally {
      setSubmitting(false)
    }
  }

  const countdownBorderColor = isExpired
    ? `rgb(var(--wine-rgb) / 0.6)`
    : isUrgent
    ? `rgb(var(--wine-rgb) / 0.4)`
    : `rgb(var(--cobalt-rgb) / 0.25)`
  const countdownBg = isExpired
    ? `rgb(var(--wine-rgb) / 0.1)`
    : isUrgent
    ? `rgb(var(--wine-rgb) / 0.05)`
    : `rgb(var(--cobalt-rgb) / 0.04)`
  const timeColor = isExpired || isUrgent ? 'var(--wine)' : 'var(--ink)'

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
        style={{ borderColor: countdownBorderColor, background: countdownBg }}
      >
        <p className="smallcaps" style={{ marginBottom: 4 }}>
          {isExpired ? 'Tid udløbet' : 'Tid tilbage'}
        </p>
        <p
          className="font-mono leading-none"
          style={{ fontSize: '3rem', fontWeight: 600, letterSpacing: '0.04em', color: timeColor }}
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

      {/* Sip counter */}
      {myScore && !hasAnswered && (
        <div
          className="text-center fade-up-2"
          style={{
            border: wentOver
              ? `1px solid rgb(var(--wine-rgb) / 0.5)`
              : sipsTaken === committed && committed > 0
              ? `1px solid rgb(var(--gold-rgb) / 0.5)`
              : '1px solid var(--rule)',
            background: wentOver
              ? `rgb(var(--wine-rgb) / 0.05)`
              : sipsTaken === committed && committed > 0
              ? `rgb(var(--gold-rgb) / 0.05)`
              : 'var(--limestone-light)',
            padding: 16,
            transition: 'border-color 0.3s, background 0.3s',
          }}
        >
          <p className="smallcaps" style={{ marginBottom: 10 }}>Slurketæller</p>
          <button
            type="button"
            onClick={() => setSipsTaken((n) => n + 1)}
            style={{ width: '100%', padding: '12px 0', background: 'none', border: 'none', cursor: 'pointer' }}
            aria-label="Tilføj én slurk"
          >
            <p
              className="font-serif leading-none"
              style={{ fontWeight: 900, fontSize: '3rem', color: wentOver ? 'var(--wine)' : 'var(--ink)', lineHeight: 1 }}
            >
              {sipsTaken === 0 ? '·' : sipsTaken}
              <span className="font-sans italic text-ink-muted" style={{ fontSize: '1.4rem' }}> / </span>
              {committed}
            </p>
            <p className="font-sans italic text-ink-muted" style={{ fontSize: '0.8rem', marginTop: 4 }}>
              {wentOver ? 'For mange slurke — fejlede!' : `${sipsTaken} af ${committed} slurke`}
            </p>
          </button>
          {sipsTaken > 0 && (
            <button
              type="button"
              onClick={() => setSipsTaken((n) => Math.max(0, n - 1))}
              className="font-mono text-ink-muted underline underline-offset-4"
              style={{ fontSize: '0.7rem', background: 'none', border: 'none', cursor: 'pointer', marginTop: 6 }}
            >
              Trin tilbage
            </button>
          )}
        </div>
      )}

      {/* Done/fail buttons or result */}
      {!hasAnswered ? (
        <div className="fade-up-3 space-y-3">
          <button onClick={() => handleResult(true)} disabled={submitting || isExpired} className="btn-success">
            Klarede det
          </button>
          <button onClick={() => handleResult(false)} disabled={submitting || isExpired} className="btn-danger">
            Fejlede (+III)
          </button>
        </div>
      ) : (
        <div className="field-card text-center" style={{ padding: '24px 20px' }}>
          {myScore?.completed === true ? (
            <>
              <p className="smallcaps" style={{ color: 'var(--olive)', marginBottom: 6 }}>Klaret</p>
              <p className="font-serif italic text-ink" style={{ fontSize: '1.1rem' }}>Æren intakt.</p>
            </>
          ) : (
            <>
              <p className="smallcaps" style={{ color: 'var(--wine)', marginBottom: 6 }}>Fejlede</p>
              <p className="font-serif italic text-ink" style={{ fontSize: '1.1rem' }}>+III strafpoint registreret.</p>
            </>
          )}
        </div>
      )}

      {/* Player status list */}
      <div style={{ borderTop: '1px solid var(--rule)' }}>
        {players.map((player) => {
          const score = scores.find((s) => s.player_id === player.id)
          const done = score?.completed !== null && score?.completed !== undefined
          const status = !done ? 'Venter' : score?.completed ? 'Klaret' : 'Fejlede'
          const statusColor = !done ? 'var(--ink-muted)' : score?.completed ? 'var(--olive)' : 'var(--wine)'
          return (
            <div
              key={player.id}
              className="flex items-center justify-between"
              style={{ padding: '12px 0', borderBottom: '1px solid var(--rule)' }}
            >
              <div className="flex items-center gap-3">
                <span className="font-mono text-ink-muted" style={{ fontSize: '0.65rem', width: 20, letterSpacing: '0.1em' }}>
                  {player.display_order}
                </span>
                <span className="font-serif" style={{ fontWeight: 500, fontSize: '1.05rem', color: 'var(--ink)' }}>
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
