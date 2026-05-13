'use client'

import { useState } from 'react'
import type { Player, Score, Hole, GameState, HoleScore } from '@/lib/types'
import { computeLeaderboard, computeHoleScores, calculateGroupAverage } from '@/lib/scoring'
import Rules from './Rules'
import SpinWheel from './SpinWheel'
import DiceRoller from './DiceRoller'

type Tab = 'standing' | 'history' | 'rules' | 'wheel' | 'dice'

interface Props {
  players: Player[]
  scores: Score[]
  holes: Hole[]
  gameState: GameState
  currentPlayerId: string
  onClose: () => void
  initialTab?: Tab
}

/** A hole's commits are public once we've moved past its committing phase. */
function isHoleRevealed(holeId: number, gameState: GameState): boolean {
  if (holeId < gameState.current_hole) return true
  if (holeId === gameState.current_hole) return gameState.phase !== 'committing'
  return false
}

/** Filter scores so only commits from publicly-revealed holes are visible. */
function getPublicScores(scores: Score[], gameState: GameState): Score[] {
  return scores.filter((s) => isHoleRevealed(s.hole_id, gameState))
}

export default function InfoSheet({ players, scores, holes, gameState, currentPlayerId, onClose, initialTab = 'standing' }: Props) {
  const [tab, setTab] = useState<Tab>(initialTab)
  const publicScores = getPublicScores(scores, gameState)

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
            {(
              [
                { key: 'standing', label: 'Stilling' },
                { key: 'history', label: 'Historik' },
                { key: 'rules', label: 'Regler' },
              ] as { key: Tab; label: string }[]
            ).map((t) => (
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
            <button
              onClick={() => setTab('wheel')}
              className={`px-4 py-4 transition-colors ${
                tab === 'wheel'
                  ? 'text-ink border-b-2 border-gold -mb-px'
                  : 'text-ink-muted'
              }`}
              aria-label="Lykkehjul"
            >
              <span style={{ fontSize: '1.1rem' }}>🎰</span>
            </button>
            <button
              onClick={() => setTab('dice')}
              className={`px-4 py-4 transition-colors ${
                tab === 'dice'
                  ? 'text-ink border-b-2 border-gold -mb-px'
                  : 'text-ink-muted'
              }`}
              aria-label="Terninger"
            >
              <span style={{ fontSize: '1.1rem' }}>🎲</span>
            </button>
          </div>

          {/* Close button absolute right */}
          <button
            onClick={onClose}
            className="absolute top-3 right-4 font-mono text-ink-muted text-base w-8 h-8 flex items-center justify-center"
            aria-label="Luk"
          >
            ✕
          </button>
        </div>

        {/* Tab content */}
        <div className="overflow-y-auto flex-1">
          {tab === 'standing' && (
            <StandingTab players={players} scores={publicScores} holes={holes} />
          )}
          {tab === 'history' && (
            <HistoryTab
              players={players}
              scores={scores}
              holes={holes}
              gameState={gameState}
              currentPlayerId={currentPlayerId}
            />
          )}
          {tab === 'rules' && <Rules />}
          {tab === 'wheel' && <SpinWheel />}
          {tab === 'dice' && <DiceRoller />}
        </div>
      </div>
    </div>
  )
}
