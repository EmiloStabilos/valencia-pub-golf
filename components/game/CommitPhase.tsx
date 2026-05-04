'use client'

import { useState } from 'react'
import type { Hole, Score } from '@/lib/types'
import HoleCard from '@/components/HoleCard'
import TileRule from '@/components/decorations/TileRule'
import { checkPenaltyShot } from '@/lib/scoring'

function penaltyShotLabel(reason: string | null, maxSips: number): string {
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
      return ''
  }
}

interface Props {
  hole: Hole
  myScore: Score | undefined
  myPreviousSips: number | null
  committedCount: number
  totalPlayers: number
  currentPlayerName: string
  onCommit: (sips: number) => Promise<void>
}

export default function CommitPhase({ hole, myScore, myPreviousSips, committedCount, totalPlayers, currentPlayerName, onCommit }: Props) {
  const defaultSips = Math.ceil(hole.max_sips / 2)
  const [sips, setSips] = useState(defaultSips)
  const [submitting, setSubmitting] = useState(false)

  const hasCommitted = myScore?.committed_sips != null
  const previewReasons = checkPenaltyShot(sips, hole.max_sips, myPreviousSips, hole.id).reasons

  const decrement = () => setSips((s) => Math.max(1, s - 1))
  const increment = () => setSips((s) => Math.min(hole.max_sips, s + 1))

  async function handleLockIn() {
    setSubmitting(true)
    try {
      await onCommit(sips)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-8">
      <HoleCard hole={hole} currentPlayerName={currentPlayerName} />

      {!hasCommitted ? (
        <section className="space-y-5 fade-up-1">
          {/* Max sips reference card */}
          <div className="field-card flex items-center justify-between">
            <div>
              <p className="smallcaps" style={{ marginBottom: 4 }}>Maximum</p>
              <p className="font-serif" style={{ fontWeight: 700, fontSize: '2.2rem', color: 'var(--ink)', lineHeight: 1 }}>
                {hole.max_sips}
              </p>
            </div>
            {/* Dot indicators */}
            <div className="flex items-center gap-1.5">
              {Array.from({ length: Math.min(hole.max_sips, 8) }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: i < sips ? 'var(--cobalt)' : 'var(--limestone-stepper)',
                    border: '1px solid var(--rule)',
                    transition: 'background 0.15s',
                  }}
                />
              ))}
            </div>
          </div>

          {/* Stepper label row */}
          <div className="flex items-baseline justify-between">
            <span className="smallcaps-ink">Dit tal</span>
            {previewReasons.length > 0 && (
              <span className="smallcaps-terra">
                Straf-shot{previewReasons.length > 1 ? ` × ${previewReasons.length}` : ''}
              </span>
            )}
          </div>

          {/* Stepper */}
          <div className="flex items-stretch justify-between">
            <button
              onClick={decrement}
              disabled={sips <= 1}
              aria-label="Færre slurke"
              className="stepper-btn"
            >
              −
            </button>
            <div
              className="flex-1 flex flex-col items-center justify-center"
              style={{
                background: 'var(--limestone-light)',
                borderTop: '1px solid var(--rule)',
                borderBottom: '1px solid var(--rule)',
                height: 96,
                gap: 4,
              }}
            >
              <span className="font-serif select-none leading-none" style={{ fontWeight: 900, fontSize: '3.8rem', color: 'var(--ink)', lineHeight: 1 }}>
                {sips}
              </span>
              <span className="font-sans italic" style={{ color: 'var(--ink-muted)', fontSize: '0.78rem' }}>
                {hole.drink_emoji} {hole.drink}
              </span>
            </div>
            <button
              onClick={increment}
              disabled={sips >= hole.max_sips}
              aria-label="Flere slurke"
              className="stepper-btn"
            >
              +
            </button>
          </div>

          {/* Penalty preview */}
          {previewReasons.length > 0 && (
            <div style={{ borderLeft: '3px solid var(--wine)', paddingLeft: 14, paddingTop: 8, paddingBottom: 8, background: 'rgb(var(--wine-rgb) / 0.04)' }}>
              <p className="smallcaps" style={{ color: 'var(--wine)', marginBottom: 4 }}>
                ⚠ {previewReasons.length === 1 ? '1 straf-shot' : `${previewReasons.length} straf-shots`}
              </p>
              <ul className="space-y-0.5">
                {previewReasons.map((r, i) => (
                  <li key={i} className="font-sans text-ink-secondary" style={{ fontSize: '0.85rem', lineHeight: 1.5 }}>
                    — {penaltyShotLabel(r, hole.max_sips)}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <button onClick={handleLockIn} disabled={submitting} className="btn-primary">
            {submitting ? 'Sender...' : 'Lås Ind'}
          </button>
        </section>
      ) : (
        <section className="space-y-6 fade-up-1">
          {/* Committed confirmation */}
          <div className="field-card text-center" style={{ padding: '32px 20px' }}>
            <p className="smallcaps" style={{ marginBottom: 12 }}>Du meldte</p>
            <p className="font-serif leading-none" style={{ fontWeight: 900, fontSize: '5rem', color: 'var(--ink)', lineHeight: 1 }}>
              {myScore!.committed_sips}
            </p>
            <p className="font-sans italic text-ink-muted" style={{ fontSize: '0.9rem', marginTop: 8 }}>
              {myScore!.committed_sips} slurke
            </p>
            {myScore!.penalty_shot && (() => {
              const reasons = myScore!.penalty_shot_reasons?.length > 0
                ? myScore!.penalty_shot_reasons
                : (myScore!.penalty_shot_reason ? [myScore!.penalty_shot_reason] : [])
              return (
                <div className="mt-4 inline-block text-left" style={{ borderLeft: '2px solid var(--wine)', paddingLeft: 12, paddingTop: 4, paddingBottom: 4 }}>
                  <p className="smallcaps text-wine mb-1">
                    ⚠ {reasons.length === 1 ? 'Straf-shot' : `${reasons.length} straf-shots`}
                  </p>
                  <ul className="space-y-0.5">
                    {reasons.map((r, i) => (
                      <li key={i} className="font-sans text-ink-secondary text-sm leading-snug">
                        — {penaltyShotLabel(r, hole.max_sips)}
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })()}
          </div>

          {/* Waiting for others */}
          <div className="text-center">
            <TileRule />
            <p className="smallcaps" style={{ marginTop: 16, marginBottom: 10 }}>Venter på de andre</p>
            {/* Player dots */}
            <div className="flex items-center justify-center gap-2 mb-4">
              {Array.from({ length: totalPlayers }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: i < committedCount ? 'var(--cobalt)' : 'transparent',
                    border: i < committedCount ? 'none' : '1.5px solid var(--rule)',
                    transition: 'background 0.3s',
                  }}
                />
              ))}
            </div>
            <p className="font-serif text-ink" style={{ fontWeight: 700, fontSize: '2rem' }}>
              {committedCount} <span className="font-sans text-ink-muted" style={{ fontSize: '1rem' }}>af {totalPlayers}</span>
            </p>
          </div>
        </section>
      )}
    </div>
  )
}
