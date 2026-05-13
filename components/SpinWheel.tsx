'use client'

import { useState } from 'react'

const PUNISHMENTS = [
  { emoji: '🥃', text: '1 shot vodka' },
  { emoji: '🍶', text: '1 shot Fernet Branca' },
  { emoji: '🌶️', text: 'Spis 1 chili' },
  { emoji: '✍️', text: 'Bed en fremmed om autograf' },
  { emoji: '📞', text: 'Ring til din mor' },
  { emoji: '🎤', text: 'Syng 10 sek. af en sang' },
  { emoji: '🍺', text: 'Drik et ekstra slurk' },
  { emoji: '🔄', text: 'Byt drink med naboen' },
]

const COLORS = [
  '#8B2020',
  '#2C4A2E',
  '#1B3A5C',
  '#5C3A1B',
  '#2A2A5C',
  '#1B4A4A',
  '#6B4C11',
  '#3A1B4A',
]

const N = PUNISHMENTS.length
const SEG = 360 / N

export default function SpinWheel() {
  const [spinning, setSpinning] = useState(false)
  const [angle, setAngle] = useState(0)
  const [result, setResult] = useState<number | null>(null)

  function spin() {
    if (spinning) return
    const chosen = Math.floor(Math.random() * N)
    // Center of chosen segment in wheel coordinates (conic-gradient starts from top)
    const segCenter = chosen * SEG + SEG / 2
    // Current wheel position mod 360
    const currentPos = angle % 360
    // Target: wheel total angle mod 360 should equal (360 - segCenter) % 360
    const targetPos = (360 - segCenter + 360) % 360
    const diff = (targetPos - currentPos + 360) % 360 || 360
    const extra = (5 + Math.floor(Math.random() * 3)) * 360
    setResult(null)
    setSpinning(true)
    setAngle(angle + extra + diff)
    setTimeout(() => {
      setResult(chosen)
      setSpinning(false)
    }, 3200)
  }

  const gradient = PUNISHMENTS.map((_, i) => `${COLORS[i]} ${i * SEG}deg ${(i + 1) * SEG}deg`).join(', ')

  return (
    <div className="flex flex-col items-center gap-6 py-6 px-4">
      {/* Wheel + pointer */}
      <div className="relative" style={{ width: 260, height: 260 }}>
        {/* Pointer triangle at top */}
        <div
          className="absolute left-1/2 z-10"
          style={{
            top: -10,
            transform: 'translateX(-50%)',
            width: 0,
            height: 0,
            borderLeft: '10px solid transparent',
            borderRight: '10px solid transparent',
            borderTop: '22px solid var(--gold)',
            filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.4))',
          }}
        />
        {/* Spinning wheel */}
        <div
          style={{
            width: 260,
            height: 260,
            borderRadius: '50%',
            background: `conic-gradient(${gradient})`,
            transform: `rotate(${angle}deg)`,
            transition: spinning ? 'transform 3.2s cubic-bezier(0.17, 0.67, 0.12, 0.99)' : 'none',
            border: '3px solid var(--rule)',
            boxShadow: '0 4px 24px rgba(0,0,0,0.18)',
          }}
        />
        {/* Segment emoji labels */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            transform: `rotate(${angle}deg)`,
            transition: spinning ? 'transform 3.2s cubic-bezier(0.17, 0.67, 0.12, 0.99)' : 'none',
          }}
        >
          {PUNISHMENTS.map((p, i) => {
            const midAngle = (i * SEG + SEG / 2) * (Math.PI / 180)
            const r = 88
            const x = 130 + r * Math.sin(midAngle)
            const y = 130 - r * Math.cos(midAngle)
            return (
              <div
                key={i}
                className="absolute"
                style={{
                  left: x,
                  top: y,
                  transform: 'translate(-50%, -50%)',
                  fontSize: '1.3rem',
                  lineHeight: 1,
                }}
              >
                {p.emoji}
              </div>
            )
          })}
        </div>
        {/* Center hub */}
        <div
          className="absolute"
          style={{
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: 'var(--parchment)',
            border: '2px solid var(--rule)',
            zIndex: 10,
          }}
        />
      </div>

      {/* Result */}
      <div style={{ minHeight: 88, textAlign: 'center' }}>
        {result !== null && !spinning && (
          <div className="fade-up">
            <p className="font-sans uppercase text-ink-muted" style={{ fontSize: '0.72rem', letterSpacing: '0.18em', marginBottom: 6 }}>
              Straffen er
            </p>
            <p style={{ fontSize: '2.8rem', lineHeight: 1, marginBottom: 8 }}>{PUNISHMENTS[result].emoji}</p>
            <p className="font-serif text-ink" style={{ fontSize: '1.25rem', fontWeight: 500 }}>
              {PUNISHMENTS[result].text}
            </p>
          </div>
        )}
      </div>

      <button onClick={spin} disabled={spinning} className="btn-primary" style={{ opacity: spinning ? 0.5 : 1 }}>
        {spinning ? 'Snurrer...' : result !== null ? 'Snur igen' : 'Snur hjulet'}
      </button>
    </div>
  )
}
