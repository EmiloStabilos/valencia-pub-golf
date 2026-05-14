'use client'

import { useState } from 'react'

type State = 'idle' | 'playing' | 'correct' | 'wrong'

function randomNum() {
  return Math.floor(Math.random() * 100) + 1
}

export default function HigherOrLower() {
  const [current, setCurrent] = useState<number>(randomNum())
  const [next, setNext] = useState<number>(randomNum())
  const [state, setState] = useState<State>('idle')
  const [streak, setStreak] = useState(0)

  function start() {
    setCurrent(randomNum())
    setNext(randomNum())
    setState('playing')
    setStreak(0)
  }

  function guess(higher: boolean) {
    const correct = higher ? next > current : next < current
    setState(correct ? 'correct' : 'wrong')
    if (correct) setStreak((s) => s + 1)
    else setStreak(0)
  }

  function next_() {
    setCurrent(next)
    setNext(randomNum())
    setState('playing')
  }

  return (
    <div className="p-6 flex flex-col items-center gap-6 select-none">
      <p className="font-sans uppercase text-xs tracking-widest text-ink-muted">Higher or Lower</p>

      {state === 'idle' && (
        <button
          onClick={start}
          className="px-8 py-3 bg-gold text-ink font-sans font-semibold uppercase tracking-widest text-sm rounded"
        >
          Start
        </button>
      )}

      {state !== 'idle' && (
        <>
          <div className="flex flex-col items-center gap-1">
            <span className="text-xs font-sans text-ink-muted uppercase tracking-widest">Nuværende tal</span>
            <span className="text-7xl font-serif font-bold text-ink">{current}</span>
          </div>

          {streak > 0 && (
            <span className="text-xs font-sans text-ink-muted">
              {streak} rigtige i træk 🔥
            </span>
          )}

          {state === 'playing' && (
            <div className="flex gap-4">
              <button
                onClick={() => guess(false)}
                className="flex-1 px-6 py-4 bg-parchment border border-rule rounded font-sans font-semibold uppercase tracking-widest text-sm text-ink"
              >
                ↓ Lavere
              </button>
              <button
                onClick={() => guess(true)}
                className="flex-1 px-6 py-4 bg-gold text-ink rounded font-sans font-semibold uppercase tracking-widest text-sm"
              >
                ↑ Højere
              </button>
            </div>
          )}

          {state === 'correct' && (
            <div className="flex flex-col items-center gap-4">
              <div className="flex flex-col items-center gap-1">
                <span className="text-xs font-sans text-ink-muted uppercase tracking-widest">Næste tal var</span>
                <span className="text-5xl font-serif font-bold text-green-600">{next}</span>
                <span className="text-sm font-sans text-green-600">Rigtigt!</span>
              </div>
              <button
                onClick={next_}
                className="px-8 py-3 bg-gold text-ink font-sans font-semibold uppercase tracking-widest text-sm rounded"
              >
                Næste
              </button>
            </div>
          )}

          {state === 'wrong' && (
            <div className="flex flex-col items-center gap-4">
              <div className="flex flex-col items-center gap-1">
                <span className="text-xs font-sans text-ink-muted uppercase tracking-widest">Næste tal var</span>
                <span className="text-5xl font-serif font-bold text-red-500">{next}</span>
                <span className="text-sm font-sans text-red-500">Forkert — drik!</span>
              </div>
              <button
                onClick={start}
                className="px-8 py-3 bg-gold text-ink font-sans font-semibold uppercase tracking-widest text-sm rounded"
              >
                Prøv igen
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
