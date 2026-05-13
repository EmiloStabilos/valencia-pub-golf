'use client'

import { useState, useRef } from 'react'

const PIPS = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅']

function randomDie() {
  return Math.floor(Math.random() * 6) + 1
}

export default function DiceRoller() {
  const [count, setCount] = useState(2)
  const [values, setValues] = useState<number[]>([])
  const [rolling, setRolling] = useState(false)
  const [controlsVisible, setControlsVisible] = useState(true)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  function roll() {
    if (count === 0) return
    setRolling(true)

    let ticks = 0
    const total = 10
    intervalRef.current = setInterval(() => {
      setValues(Array.from({ length: count }, randomDie))
      ticks++
      if (ticks >= total) {
        clearInterval(intervalRef.current!)
        setValues(Array.from({ length: count }, randomDie))
        setRolling(false)
      }
    }, 60)
  }

  function add() {
    if (count >= 12) return
    setCount((c) => c + 1)
    setValues((v) => [...v, randomDie()])
  }

  function remove() {
    if (count <= 0) return
    setCount((c) => c - 1)
    setValues((v) => v.slice(0, -1))
  }

  return (
    <div className="px-6 py-6 space-y-7">
      <div className="flex items-center justify-between border-b border-rule pb-1.5">
        <p className="smallcaps-ink">Terninger</p>
        <button
          onClick={() => setControlsVisible((v) => !v)}
          className="font-sans text-ink-muted text-xs underline underline-offset-2"
          style={{ background: 'none', border: 'none', cursor: 'pointer' }}
        >
          {controlsVisible ? 'Skjul' : `Rediger (${count})`}
        </button>
      </div>

      {/* Count control */}
      {controlsVisible && <div className="flex items-center justify-center gap-8">
        <button
          onClick={remove}
          disabled={count === 0}
          className="font-mono text-ink-muted disabled:opacity-30 transition-opacity"
          style={{ fontSize: '2rem', lineHeight: 1, background: 'none', border: 'none', cursor: count === 0 ? 'default' : 'pointer', width: 44, height: 44 }}
          aria-label="Fjern terning"
        >
          −
        </button>
        <span className="font-mono text-ink font-semibold" style={{ fontSize: '2.2rem', minWidth: 32, textAlign: 'center' }}>
          {count}
        </span>
        <button
          onClick={add}
          disabled={count === 12}
          className="font-mono text-ink-muted disabled:opacity-30 transition-opacity"
          style={{ fontSize: '2rem', lineHeight: 1, background: 'none', border: 'none', cursor: count === 12 ? 'default' : 'pointer', width: 44, height: 44 }}
          aria-label="Tilføj terning"
        >
          +
        </button>
      </div>}

      {/* Dice display */}
      {count > 0 && values.length === count && (
        <div
          className="flex flex-wrap justify-center gap-2"
          style={{ minHeight: '3.5rem', transition: 'opacity 0.1s' }}
        >
          {values.map((v, i) => (
            <span
              key={i}
              style={{
                fontSize: !controlsVisible
                  ? (count <= 4 ? '6rem' : count <= 6 ? '4.5rem' : '3rem')
                  : (count <= 4 ? '4.5rem' : count <= 6 ? '3.5rem' : '2.5rem'),
                lineHeight: 1,
                opacity: rolling ? 0.5 : 1,
                transition: 'opacity 0.1s',
              }}
            >
              {PIPS[v - 1]}
            </span>
          ))}
        </div>
      )}

      {/* Roll button */}
      {count > 0 && (
        <button
          onClick={roll}
          disabled={rolling}
          className="btn-primary"
          style={{ width: '100%' }}
        >
          {rolling ? '···' : 'Rul'}
        </button>
      )}

      {count === 0 && (
        <p className="font-serif italic text-ink-muted text-center text-base">
          Tilføj terninger med +
        </p>
      )}
    </div>
  )
}
