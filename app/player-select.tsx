'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { Player } from '@/lib/types'
import { formatDateHeader } from '@/lib/format'
import ArchDivider from '@/components/decorations/ArchDivider'
import Rules from '@/components/Rules'

export default function PlayerSelectPage() {
  const router = useRouter()
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [selecting, setSelecting] = useState<string | null>(null)
  const [rulesOpen, setRulesOpen] = useState(false)

  const { day, date } = formatDateHeader()

  useEffect(() => {
    supabase
      .from('players')
      .select('*')
      .order('display_order')
      .then(({ data }) => {
        setPlayers(data || [])
        setLoading(false)
      })
  }, [])

  async function handleSelect(player: Player) {
    setSelecting(player.id)
    localStorage.setItem('athens_player_id', player.id)
    router.push('/game')
  }

  return (
    <div className="min-h-screen bg-parchment flex flex-col">
      {/* Hero — azulejo header */}
      <div className="azulejo-bg" style={{ padding: '40px 24px 0', textAlign: 'center', position: 'relative' }}>
        {/* Moorish arch watermark */}
        <svg
          viewBox="0 0 260 200"
          width={220}
          style={{ margin: '0 auto', display: 'block', opacity: 0.15 }}
        >
          <path
            d="M30 200 L30 100 Q30 20 130 20 Q230 20 230 100 L230 200"
            fill="none"
            stroke="#F0EAD6"
            strokeWidth="2.5"
          />
          <path
            d="M55 200 L55 105 Q55 45 130 45 Q205 45 205 105 L205 200"
            fill="none"
            stroke="#F0EAD6"
            strokeWidth="1.2"
          />
          <line x1="10" y1="200" x2="250" y2="200" stroke="#F0EAD6" strokeWidth="1.5" />
        </svg>

        {/* Title overlaid on arch */}
        <div style={{ marginTop: -130, position: 'relative', zIndex: 2, paddingBottom: 36 }}>
          <h1
            className="font-serif"
            style={{
              fontWeight: 900,
              fontSize: '3.6rem',
              lineHeight: 1,
              color: '#F0EAD6',
              letterSpacing: '-0.01em',
              textShadow: '0 2px 16px rgba(0,0,0,0.4)',
            }}
          >
            Valencia
          </h1>
          <p
            className="font-serif italic"
            style={{
              fontWeight: 600,
              fontSize: '1.9rem',
              color: '#F5C860',
              marginTop: 4,
              textShadow: '0 1px 8px rgba(0,0,0,0.3)',
            }}
          >
            Pub Golf
          </p>

          {/* Thin tile border strip */}
          <div className="tile-border-thin" style={{ margin: '20px auto', width: 120 }} />

          <p
            className="smallcaps"
            style={{ color: 'rgba(240,234,214,0.7)', letterSpacing: '0.22em' }}
          >
            {day} · 8 STOPS
          </p>
          <p
            className="font-mono"
            style={{ color: 'rgba(240,234,214,0.5)', fontSize: '0.72rem', letterSpacing: '0.18em', marginTop: 4 }}
          >
            {date}
          </p>
        </div>
      </div>

      {/* Arch divider — azulejo → parchment */}
      <ArchDivider color="rgba(26,74,122,0.4)" bg="#FBE8C8" />

      {/* Player list */}
      <div className="flex-1 bg-parchment">
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-6 h-6 border border-ink border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div style={{ borderTop: '1px solid #D8B888' }}>
            {players.map((player) => (
              <button
                key={player.id}
                onClick={() => handleSelect(player)}
                disabled={selecting !== null}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '18px 24px',
                  background: '#FBE8C8',
                  border: 'none',
                  borderBottom: '1px solid #D8B888',
                  cursor: 'pointer',
                  textAlign: 'left',
                  opacity: selecting !== null && selecting !== player.id ? 0.35 : 1,
                  transition: 'opacity 0.3s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  {/* Numbered square */}
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      background: selecting === player.id ? '#C8381A' : '#F0D4A0',
                      border: '1px solid #D8B888',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      transition: 'background 0.3s',
                    }}
                  >
                    <span
                      className="font-serif"
                      style={{
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        color: selecting === player.id ? '#F0EAD6' : '#8A5030',
                      }}
                    >
                      {player.display_order}
                    </span>
                  </div>
                  <span
                    className="font-serif"
                    style={{ fontWeight: 600, fontSize: '1.25rem', color: '#2A0A06' }}
                  >
                    {player.name}
                  </span>
                </div>
                <span
                  className="smallcaps"
                  style={{ color: selecting === player.id ? '#C8381A' : '#8A5030' }}
                >
                  {selecting === player.id ? 'Forbinder...' : 'Klar'}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Rules accordion */}
        <div style={{ paddingBottom: 24 }}>
          <button
            onClick={() => setRulesOpen((o) => !o)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 24px',
              background: 'transparent',
              border: 'none',
              borderTop: '1px solid #D8B888',
              borderBottom: '1px solid #D8B888',
              cursor: 'pointer',
            }}
          >
            <span className="smallcaps-ink">Regler</span>
            <span className="font-serif text-ink-muted" style={{ fontSize: '1.1rem' }}>
              {rulesOpen ? '−' : '+'}
            </span>
          </button>

          {rulesOpen && (
            <div
              style={{
                padding: '20px 24px',
                borderBottom: '1px solid #D8B888',
                background: '#FEF4E0',
              }}
            >
              <Rules compact />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
