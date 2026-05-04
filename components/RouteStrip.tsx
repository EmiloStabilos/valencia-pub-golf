'use client'

import type { Hole } from '@/lib/types'

interface Props {
  holes: Hole[]
  currentHoleId: number
  onClick: () => void
}

export default function RouteStrip({ holes, currentHoleId, onClick }: Props) {
  const sortedHoles = [...holes].sort((a, b) => a.id - b.id)
  const currentIdx = sortedHoles.findIndex((h) => h.id === currentHoleId)

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-center gap-1.5 py-2.5 transition-colors active:bg-white/10"
      aria-label="Vis rute"
    >
      {sortedHoles.map((h, i) => {
        const isPast = i < currentIdx
        const isCurrent = i === currentIdx
        return (
          <span
            key={h.id}
            style={{
              display: 'block',
              width: isCurrent ? 10 : 6,
              height: isCurrent ? 10 : 6,
              borderRadius: '50%',
              background: isCurrent || isPast ? 'var(--gold)' : 'transparent',
              border: isCurrent || isPast ? 'none' : '1.5px solid rgba(245,241,235,0.35)',
              boxShadow: isCurrent ? '0 0 0 3px rgb(var(--gold-rgb) / 0.25)' : 'none',
              opacity: isPast ? 0.8 : 1,
              flexShrink: 0,
              transition: 'background 0.3s',
            }}
            aria-hidden
          />
        )
      })}
    </button>
  )
}
