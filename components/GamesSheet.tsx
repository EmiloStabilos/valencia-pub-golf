'use client'

import { useState } from 'react'
import SpinWheel from './SpinWheel'
import DiceRoller from './DiceRoller'

type Tab = 'dice' | 'wheel'

interface Props {
  onClose: () => void
}

export default function GamesSheet({ onClose }: Props) {
  const [tab, setTab] = useState<Tab>('dice')

  return (
    <div className="fixed inset-0 z-50 flex flex-col">
      <button
        className="absolute inset-0 bg-ink/50 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Luk"
      />

      <div className="relative mt-auto w-full max-w-md mx-auto bg-parchment max-h-[88vh] flex flex-col">
        {/* Drag handle */}
        <div className="flex-shrink-0 pt-3 pb-2 flex justify-center">
          <div className="w-10 h-0.5 bg-rule" />
        </div>

        {/* Tabs */}
        <div className="flex-shrink-0 border-b border-rule">
          <div className="flex">
            {([
              { key: 'dice', label: '🎲 Terninger' },
              { key: 'wheel', label: '🎰 Hjul' },
            ] as { key: Tab; label: string }[]).map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex-1 py-4 transition-colors ${
                  tab === t.key
                    ? 'text-ink border-b-2 border-gold -mb-px'
                    : 'text-ink-muted'
                }`}
              >
                <span
                  className="font-sans uppercase font-semibold"
                  style={{ fontSize: '0.78rem', letterSpacing: '0.18em' }}
                >
                  {t.label}
                </span>
              </button>
            ))}
          </div>

          <button
            onClick={onClose}
            className="absolute top-3 right-4 font-mono text-ink-muted text-base w-8 h-8 flex items-center justify-center"
            aria-label="Luk"
          >
            ✕
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          {tab === 'dice' && <DiceRoller />}
          {tab === 'wheel' && <SpinWheel />}
        </div>
      </div>
    </div>
  )
}
