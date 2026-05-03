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
  const [confirmFail, setConfirmFail] = useState(false)
  const [sipsTaken, setSipsTaken] = useState(0)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!deadlineAt) return
    const interval = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [deadlineAt])

  const deadlineMs = deadlineAt ? new Date(deadlineAt).getTime() : null
  const remainingMs = deadlineMs != null ? Math.max(0, deadlineMs - now) : null
  const remainingSec = remainingMs != null ? Math.ceil(remainingMs / 1000) : null
  const remainingMin = remainingSec != null ? Math.floor(remainingSec / 60) : null
  const remainingSecPart = remainingSec != null ? remainingSec % 60 : null
  const isUrgent = remainingMs != null && remainingMs <= 30_000 && remainingMs > 0
  const isExpired = remainingMs === 0

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

  const hasAnswered = myScore?.completed !== null && myScore?.completed !== undefined
  const confirmedCount = scores.filter((s) => s.completed !== null).length
  const committed = myScore?.committed_sips ?? 0
  const reachedTarget = committed > 0 && sipsTaken >= committed

  async function handleResult(completed: boolean) {
    setSubmitting(true)
    setConfirmFail(false)
    try {
      await onDrinkResult(completed)
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
        <h2 className="display-lg mt-3 fade-up">A question</h2>
        <h2 className="display-lg fade-up-1" style={{ fontStyle: 'italic' }}>of honour.</h2>
        <TileRule wide />
      </div>

      {/* 2-min countdown */}
      {remainingMs != null && !hasAnswered && (
        <div
          className="border px-5 py-4 text-center transition-colors"
          style={{
            borderColor: isExpired ? 'rgba(139,26,26,0.6)' : isUrgent ? 'rgba(139,26,26,0.4)' : 'rgba(232,160,32,0.4)',
            background: isExpired ? 'rgba(139,26,26,0.1)' : isUrgent ? 'rgba(139,26,26,0.05)' : 'rgba(232,160,32,0.05)',
          }}
        >
          <p className="smallcaps" style={{ marginBottom: 4 }}>
            {isExpired ? 'Tid udløbet' : 'Tid tilbage'}
          </p>
          <p className="font-mono leading-none" style={{ fontSize: '2.4rem', fontWeight: 600, letterSpacing: '0.04em', color: isExpired || isUrgent ? '#8B1A1A' : '#2A0A06' }}>
            {isExpired
              ? '+III'
              : `${remainingMin}:${String(remainingSecPart).padStart(2, '0')}`}
          </p>
          <p className="font-sans italic text-ink-muted" style={{ fontSize: '0.9rem', marginTop: 8 }}>
            {isExpired
              ? 'Du fik tre strafpoint — gruppen er videre.'
              : 'Bunde drinken inden uret går — ellers +III strafpoint.'}
          </p>
        </div>
      )}

      {/* Committed card */}
      {myScore && (
        <div className="field-card text-center fade-up-2" style={{ padding: '28px 20px' }}>
          <p className="smallcaps" style={{ marginBottom: 10 }}>Du meldte</p>
          <p className="font-serif leading-none" style={{ fontWeight: 900, fontSize: '4.4rem', color: '#2A0A06', lineHeight: 1 }}>
            {myScore.committed_sips}
          </p>
          <p className="font-sans italic text-ink-muted" style={{ fontSize: '0.85rem', marginTop: 6 }}>
            {myScore.committed_sips} slurke
          </p>
          <div style={{ width: 40, height: 1, background: '#E8A020', margin: '16px auto', opacity: 0.6 }} />
          <p className="font-serif text-ink" style={{ fontSize: '1.1rem', lineHeight: 1.4 }}>
            Drak du den på {myScore.committed_sips} slurke?
          </p>
        </div>
      )}

      {/* Sip counter */}
      {myScore && !hasAnswered && (
        <div
          className="text-center fade-up-3"
          style={{
            border: reachedTarget ? '1px solid rgba(232,160,32,0.5)' : '1px solid #D8B888',
            background: reachedTarget ? 'rgba(232,160,32,0.05)' : '#FEF4E0',
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
            <p className="font-serif leading-none" style={{ fontWeight: 900, fontSize: '3rem', color: '#2A0A06', lineHeight: 1 }}>
              {sipsTaken === 0 ? '·' : sipsTaken}
              <span className="font-sans italic text-ink-muted" style={{ fontSize: '1.4rem' }}> / </span>
              {committed}
            </p>
            <p className="font-sans italic text-ink-muted" style={{ fontSize: '0.8rem', marginTop: 4 }}>
              {sipsTaken} af {committed} slurke
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

      {/* Answer buttons or result */}
      {!hasAnswered ? (
        <div className="space-y-3 fade-up-4">
          {!confirmFail ? (
            <>
              <button onClick={() => handleResult(true)} disabled={submitting} className="btn-success">
                Ja — Klarede det
              </button>
              <button onClick={() => setConfirmFail(true)} disabled={submitting} className="btn-ghost">
                Nej — Fejlede (+3)
              </button>
            </>
          ) : (
            <div
              style={{
                border: '1px solid rgba(139,26,26,0.4)',
                background: 'rgba(139,26,26,0.04)',
                padding: '24px 20px',
                textAlign: 'center',
              }}
            >
              <p className="font-serif text-ink" style={{ fontSize: '1.3rem', marginBottom: 6 }}>Sikker?</p>
              <p className="font-sans italic text-ink-secondary" style={{ fontSize: '0.9rem', marginBottom: 18 }}>
                +III strafpoint på dette stop.
              </p>
              <div className="space-y-3">
                <button onClick={() => handleResult(false)} disabled={submitting} className="btn-danger">
                  Ja, jeg fejlede
                </button>
                <button onClick={() => setConfirmFail(false)} disabled={submitting} className="btn-ghost">
                  Tilbage
                </button>
              </div>
            </div>
          )}
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
                <span className="font-mono text-ink-muted" style={{ fontSize: '0.65rem', width: 20, letterSpacing: '0.1em' }}>
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

      <p className="text-center smallcaps">
        {confirmedCount} af {players.length} har svaret
      </p>
    </div>
  )
}
