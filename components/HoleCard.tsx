import type { Hole } from '@/lib/types'
import TileRule from '@/components/decorations/TileRule'
import HostNote from '@/components/HostNote'

interface Props {
  hole: Hole
  showMapLink?: boolean
  currentPlayerName?: string
}

export default function HoleCard({ hole, showMapLink = true, currentPlayerName = '' }: Props) {
  return (
    <article className="space-y-4 fade-up">
      {/* District + multiplier badge row */}
      <div className="flex items-baseline justify-between">
        <span className="smallcaps">{hole.district ?? hole.address}</span>
        {hole.score_multiplier > 1 && !hole.is_practice && (
          <span className="smallcaps-terra">× {hole.score_multiplier} multiplier</span>
        )}
      </div>

      {/* Stop name */}
      <h2 className="display-lg" style={{ marginBottom: 4 }}>{hole.name}</h2>

      {/* Address */}
      <p className="font-sans italic text-ink-secondary" style={{ fontSize: '1rem', marginBottom: 8 }}>
        {hole.address}
      </p>

      {/* Drink pill */}
      <div className="inline-flex items-center gap-2" style={{ background: 'var(--cobalt)', padding: '5px 14px' }}>
        <span style={{ fontSize: '1rem' }}>{hole.drink_emoji}</span>
        <span className="font-sans italic" style={{ color: 'var(--limestone-light)', fontSize: '0.9rem', letterSpacing: '0.04em' }}>
          {hole.drink}
        </span>
      </div>

      <TileRule />

      {/* Fun fact quote */}
      <p className="field-quote">
        &ldquo;{hole.fun_fact}&rdquo;
      </p>
      <p className="smallcaps">— Feltnote · Stop {hole.id}</p>

      {/* Practice banner */}
      {hole.is_practice && (
        <div style={{ border: `1px solid rgb(var(--gold-rgb) / 0.5)`, background: `rgb(var(--gold-rgb) / 0.06)`, padding: '12px 16px' }}>
          <p className="smallcaps-gold" style={{ marginBottom: 4 }}>Prøverunde</p>
          <p className="font-sans italic text-ink-secondary" style={{ fontSize: '0.9rem' }}>
            Point tæller ikke. Lær reglerne undervejs.
          </p>
        </div>
      )}

      {/* Maps link */}
      {showMapLink && (
        <a
          href={hole.maps_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 font-sans text-ink-secondary underline underline-offset-4 decoration-gold decoration-1"
          style={{ fontSize: '0.9rem' }}
        >
          Åbn i Google Maps
        </a>
      )}

      {/* Host notes — only shown to Emil */}
      <HostNote text={hole.host_notes} currentPlayerName={currentPlayerName} />
    </article>
  )
}
