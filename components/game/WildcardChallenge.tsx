'use client'

import { useEffect, useState } from 'react'
import type { Player } from '@/lib/types'
import TileRule from '@/components/decorations/TileRule'

const WILDCARDS: Record<number, string> = {
  1: 'Få en tilfældig person i parken til at tage et gruppefoto',
  2: 'Bestil næste drink på spansk — ingen hjælp fra de andre',
  3: 'Bed bartenderen om at forklare drinken, og gentag den på dansk til gruppen',
  4: "Tag en video fra taget, hvor hele gruppen råber 'Valencia!' — og post den i gruppe-chatten",
  5: 'Find en lokal og spørg om deres yndlingsbar — skriv den ned til næste gang',
  6: 'Kun spansk i 10 minutter',
  7: 'Bund drinken i ét hug',
  8: "Skål med en fremmed med cavaen — de skal sige 'salud' tilbage",
  9: "Bed DJ'en om at spille en sang",
  10: 'Sørg for at hele gruppen danser i mindst 2 minutter — æressystem',
}

export function selectWildcardPlayer(players: Player[], holeId: number): Player {
  const sorted = [...players].sort((a, b) => a.display_order - b.display_order)
  return sorted[Math.abs(holeId * 3 + 1) % sorted.length]
}

interface Props {
  holeId: number
  players: Player[]
  currentPlayerId: string
  onFail: () => void
  onDone: () => void
}

type Stage = 'rolling' | 'revealed'

export default function WildcardChallenge({ holeId, players, currentPlayerId, onFail, onDone }: Props) {
  const [stage, setStage] = useState<Stage>('rolling')
  const [rollingName, setRollingName] = useState('·')

  const sorted = [...players].sort((a, b) => a.display_order - b.display_order)
  const selectedPlayer = selectWildcardPlayer(players, holeId)
  const isSelected = selectedPlayer.id === currentPlayerId
  const challenge = WILDCARDS[holeId] ?? 'Lav noget sjovt'

  useEffect(() => {
    let count = 0
    const total = 16 + Math.floor(Math.random() * 8)
    let delay = 70

    function roll() {
      const rnd = sorted[Math.floor(Math.random() * sorted.length)]
      setRollingName(rnd.name)
      count++
      if (count < total) {
        delay = delay * 1.13
        setTimeout(roll, delay)
      } else {
        setRollingName(selectedPlayer.name)
        setTimeout(() => setStage('revealed'), 500)
      }
    }

    setTimeout(roll, 100)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function handleFail() {
    sessionStorage.setItem(`wildcard_fail_${holeId}`, 'true')
    onFail()
    onDone()
  }

  return (
    <div className="fixed inset-0 z-50 bg-parchment flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm text-center space-y-6">
        <div>
          <p className="smallcaps mb-1">Stop {holeId} · Challenge</p>
          <h2 className="display-lg">
            {stage === 'rolling' ? 'Hvem får challengen?' : selectedPlayer.name}
          </h2>
          <TileRule wide />
        </div>

        {stage === 'rolling' ? (
          <div
            className="border border-gold px-8 py-8 mx-auto"
            style={{ background: 'rgb(var(--gold-rgb) / 0.05)', minWidth: 220 }}
          >
            <p
              className="font-serif text-ink leading-none"
              style={{ fontSize: '2rem', fontWeight: 600, minHeight: '2.5rem' }}
            >
              {rollingName}
            </p>
          </div>
        ) : (
          <div className="fade-up space-y-6">
            <div
              className="border border-rule px-6 py-5"
              style={{ background: 'var(--limestone-light)' }}
            >
              <p className="font-serif italic text-ink text-lg leading-snug">{challenge}</p>
            </div>

            <p className="font-sans text-ink-muted text-sm">
              Fejler eller nægter du — challenge-shot.
            </p>

            {isSelected ? (
              <div className="space-y-3">
                <button onClick={onDone} className="btn-success">
                  Jeg gør det
                </button>
                <button onClick={handleFail} className="btn-danger">
                  Jeg tager straf shot
                </button>
              </div>
            ) : (
              <button onClick={onDone} className="btn-ghost">
                Forstået
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}