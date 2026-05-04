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
  const [manageOpen, setManageOpen] = useState(false)
  const [gameStarted, setGameStarted] = useState(false)
  const [newName, setNewName] = useState('')
  const [adding, setAdding] = useState(false)

  const { day, date } = formatDateHeader()

  useEffect(() => {
    async function load() {
      const [playersRes, scoresRes] = await Promise.all([
        supabase.from('players').select('*').order('display_order'),
        supabase.from('scores').select('id').limit(1),
      ])
      setPlayers(playersRes.data || [])
      setGameStarted((scoresRes.data?.length ?? 0) > 0)
      setLoading(false)
    }
    load()
  }, [])

  async function handleSelect(player: Player) {
    setSelecting(player.id)
    localStorage.setItem('athens_player_id', player.id)
    router.push('/game')
  }

  async function handleToggleActive(player: Player) {
    const next = !player.active
    await supabase.from('players').update({ active: next }).eq('id', player.id)
    setPlayers((prev) => prev.map((p) => p.id === player.id ? { ...p, active: next } : p))
  }

  async function handleAddPlayer() {
    const name = newName.trim()
    if (!name) return
    setAdding(true)
    const maxOrder = players.reduce((m, p) => Math.max(m, p.display_order), 0)
    const { data, error } = await supabase
      .from('players')
      .insert({ name, active: true, display_order: maxOrder + 1 })
      .select()
      .single()
    if (!error && data) {
      setPlayers((prev) => [...prev, data])
      setNewName('')
    }
    setAdding(false)
  }

  const activePlayers = players.filter((p) => p.active)

  return (
    <div className="min-h-screen bg-parchment flex flex-col">
      {/* Hero — azulejo header */}
      <div className="azulejo-bg" style={{ padding: '40px 24px 0', textAlign: 'center', position: 'relative' }}>
        {/* Moorish arch watermark */}
        <svg viewBox="0 0 260 200" width={220} style={{ margin: '0 auto', display: 'block', opacity: 0.15 }}>
          <path d="M30 200 L30 100 Q30 20 130 20 Q230 20 230 100 L230 200" fill="none" stroke="var(--limestone)" strokeWidth="2.5" />
          <path d="M55 200 L55 105 Q55 45 130 45 Q205 45 205 105 L205 200" fill="none" stroke="var(--limestone)" strokeWidth="1.2" />
          <line x1="10" y1="200" x2="250" y2="200" stroke="var(--limestone)" strokeWidth="1.5" />
        </svg>

        {/* Title overlaid on arch */}
        <div style={{ marginTop: -130, position: 'relative', zIndex: 2, paddingBottom: 36 }}>
          <h1
            className="font-serif"
            style={{
              fontWeight: 900,
              fontSize: '3.6rem',
              lineHeight: 1,
              color: 'var(--limestone)',
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
              color: 'var(--gold-soft)',
              marginTop: 4,
              textShadow: '0 1px 8px rgba(0,0,0,0.3)',
            }}
          >
            Pub Golf
          </p>

          <div className="tile-border-thin" style={{ margin: '20px auto', width: 120 }} />

          <p className="smallcaps" style={{ color: 'rgb(var(--limestone-rgb) / 0.7)', letterSpacing: '0.22em' }}>
            🇪🇸 {day} · 9 STOPS
          </p>
          <p
            className="font-mono"
            style={{ color: 'rgb(var(--limestone-rgb) / 0.5)', fontSize: '0.72rem', letterSpacing: '0.18em', marginTop: 4 }}
          >
            {date}
          </p>
        </div>
      </div>

      {/* Arch divider */}
      <ArchDivider />

      {/* Player list */}
      <div className="flex-1 bg-parchment">
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-6 h-6 border border-ink border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div style={{ borderTop: '1px solid var(--rule)' }}>
            {activePlayers.map((player) => (
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
                  background: 'var(--limestone)',
                  border: 'none',
                  borderBottom: '1px solid var(--rule)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  opacity: selecting !== null && selecting !== player.id ? 0.35 : 1,
                  transition: 'opacity 0.3s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      background: selecting === player.id ? 'var(--cobalt)' : 'var(--limestone-dark)',
                      border: '1px solid var(--rule)',
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
                        color: selecting === player.id ? 'var(--limestone)' : 'var(--ink-muted)',
                      }}
                    >
                      {player.display_order}
                    </span>
                  </div>
                  <span className="font-serif" style={{ fontWeight: 600, fontSize: '1.25rem', color: 'var(--ink)' }}>
                    {player.name}
                  </span>
                </div>
                <span className="smallcaps" style={{ color: selecting === player.id ? 'var(--cobalt)' : 'var(--ink-muted)' }}>
                  {selecting === player.id ? 'Forbinder...' : 'Klar'}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Manage players accordion — only before game starts */}
        {!gameStarted && !loading && (
          <div>
            <button
              onClick={() => setManageOpen((o) => !o)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 24px',
                background: 'transparent',
                border: 'none',
                borderTop: '1px solid var(--rule)',
                borderBottom: manageOpen ? 'none' : '1px solid var(--rule)',
                cursor: 'pointer',
              }}
            >
              <span className="smallcaps-ink">Rediger spillere</span>
              <span className="font-serif text-ink-muted" style={{ fontSize: '1.1rem' }}>
                {manageOpen ? '−' : '+'}
              </span>
            </button>

            {manageOpen && (
              <div
                style={{
                  padding: '16px 24px',
                  borderBottom: '1px solid var(--rule)',
                  background: 'var(--limestone-light)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                }}
              >
                {/* Toggle existing players */}
                {players.map((player) => (
                  <div key={player.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span
                      className="font-serif"
                      style={{
                        fontSize: '1.1rem',
                        fontWeight: 500,
                        color: player.active ? 'var(--ink)' : 'var(--ink-faint)',
                        textDecoration: player.active ? 'none' : 'line-through',
                      }}
                    >
                      {player.name}
                    </span>
                    <button
                      onClick={() => handleToggleActive(player)}
                      className="smallcaps"
                      style={{
                        background: 'none',
                        border: '1px solid',
                        borderColor: player.active ? 'var(--terracotta)' : 'var(--rule)',
                        color: player.active ? 'var(--terracotta)' : 'var(--ink-muted)',
                        padding: '4px 12px',
                        cursor: 'pointer',
                        fontSize: '0.7rem',
                        letterSpacing: '0.1em',
                      }}
                    >
                      {player.active ? 'Fjern' : 'Tilføj'}
                    </button>
                  </div>
                ))}

                {/* Add new player */}
                <div
                  style={{
                    display: 'flex',
                    gap: 8,
                    marginTop: 4,
                    paddingTop: 12,
                    borderTop: '1px solid var(--rule)',
                  }}
                >
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddPlayer()}
                    placeholder="Nyt spillernavn"
                    style={{
                      flex: 1,
                      background: 'var(--limestone)',
                      border: '1px solid var(--rule)',
                      padding: '8px 12px',
                      fontFamily: 'inherit',
                      fontSize: '1rem',
                      color: 'var(--ink)',
                      outline: 'none',
                    }}
                  />
                  <button
                    onClick={handleAddPlayer}
                    disabled={adding || !newName.trim()}
                    className="smallcaps"
                    style={{
                      background: 'var(--cobalt)',
                      color: 'var(--limestone)',
                      border: 'none',
                      padding: '8px 16px',
                      cursor: 'pointer',
                      opacity: adding || !newName.trim() ? 0.4 : 1,
                    }}
                  >
                    Tilføj
                  </button>
                </div>
              </div>
            )}
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
              borderTop: gameStarted ? '1px solid var(--rule)' : 'none',
              borderBottom: '1px solid var(--rule)',
              cursor: 'pointer',
            }}
          >
            <span className="smallcaps-ink">Regler</span>
            <span className="font-serif text-ink-muted" style={{ fontSize: '1.1rem' }}>
              {rulesOpen ? '−' : '+'}
            </span>
          </button>

          {rulesOpen && (
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--rule)', background: 'var(--limestone-light)' }}>
              <Rules compact />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
