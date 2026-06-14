'use client'
import { LeaderEntry } from '@/hooks/useMarkets'
import { fromWei } from '@/lib/genlayer'

interface Props {
  leaders: LeaderEntry[]
  onClose: () => void
  currentAddress: string | null
}

const MEDALS = ['🥇', '🥈', '🥉']

function shortAddr(a: string) {
  if (!a) return '—'
  return `${a.slice(0, 6)}...${a.slice(-4)}`
}

export function Leaderboard({ leaders, onClose, currentAddress }: Props) {
  const active = leaders.filter(l =>
    Number(l.total_wagered) > 0 || Number(l.wins) > 0 || Number(l.losses) > 0
  )

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(17,19,31,0.86)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      zIndex: 100, backdropFilter: 'blur(8px)',
      padding: 0,
    }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="card" style={{
        width: '100%',
        maxWidth: 600,
        padding: '20px 16px',
        borderRadius: '20px 20px 0 0',
        maxHeight: '88vh',
        overflowY: 'auto',
        margin: 0,
      }}
        data-modal="leaderboard"
      >
        {/* Drag handle */}
        <div style={{
          width: 40, height: 4, borderRadius: 2,
          background: 'rgba(255,255,255,0.15)',
          margin: '0 auto 16px',
        }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
            🏆 Leaderboard
          </h2>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', color: 'var(--muted)',
            cursor: 'pointer', fontSize: 20, padding: 4,
          }}>✕</button>
        </div>

        {active.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 48, color: 'var(--muted)' }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>🌧️</div>
            <p style={{ fontSize: 13 }}>No bets placed yet — be the first to bet and rank up!</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {/* Table header */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '32px 1fr 60px 70px',
              gap: 8,
              padding: '6px 10px',
              fontSize: 10, color: 'var(--muted)',
              textTransform: 'uppercase', letterSpacing: 0.6,
              borderBottom: '1px solid var(--border)', marginBottom: 6,
            }}>
              <div>#</div>
              <div>Address</div>
              {/* W/L hidden on very small screens via inline check */}
              <div style={{ textAlign: 'right' }}>W/L</div>
              <div style={{ textAlign: 'right' }}>Net Won</div>
            </div>

            {active.map((l, i) => {
              const isMe = currentAddress && l.addr.toLowerCase() === currentAddress.toLowerCase()
              const winnings = fromWei(l.total_winnings)
              const wagered = fromWei(l.total_wagered)
              const wins = Number(l.wins)
              const losses = Number(l.losses)
              const winRate = wins + losses > 0 ? (wins / (wins + losses)) * 100 : 0

              return (
                <div key={i} style={{
                  display: 'grid',
                  gridTemplateColumns: '32px 1fr 60px 70px',
                  gap: 8,
                  alignItems: 'center',
                  padding: '10px',
                  borderRadius: 10,
                  background: isMe
                    ? 'rgba(159,231,255,0.10)'
                    : (i % 2 === 0 ? 'rgba(255,255,255,0.015)' : 'transparent'),
                  border: isMe ? '1px solid var(--border2)' : '1px solid transparent',
                  marginBottom: 4,
                }}>
                  {/* Rank */}
                  <div style={{
                    fontSize: i < 3 ? 18 : 12, fontWeight: 700,
                    color: i < 3 ? 'var(--sun)' : 'var(--muted)',
                    textAlign: 'center',
                  }}>
                    {i < 3 ? MEDALS[i] : i + 1}
                  </div>

                  {/* Address + stats */}
                  <div style={{ minWidth: 0 }}>
                    <div style={{
                      fontSize: 13, color: 'var(--text)',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      display: 'flex', alignItems: 'center', gap: 6,
                    }}>
                      <span style={{ fontFamily: 'monospace' }}>{shortAddr(l.addr)}</span>
                      {isMe && (
                        <span style={{
                          fontSize: 9, color: 'var(--accent)',
                          background: 'rgba(159,231,255,0.14)', padding: '1px 6px', borderRadius: 3,
                          flexShrink: 0,
                        }}>YOU</span>
                      )}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 2 }}>
                      Wagered {wagered.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })} GEN · {winRate.toFixed(0)}% win rate
                    </div>
                  </div>

                  {/* W/L */}
                  <div style={{ textAlign: 'right', fontSize: 12 }}>
                    <span style={{ color: 'var(--green)' }}>{wins}</span>
                    <span style={{ color: 'var(--muted)' }}>/</span>
                    <span style={{ color: 'var(--red)' }}>{losses}</span>
                  </div>

                  {/* Net Won */}
                  <div style={{
                    textAlign: 'right', fontSize: 13, fontWeight: 700,
                    color: winnings > 0 ? 'var(--green)' : 'var(--muted)',
                  }}>
                    +{winnings.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 3 })}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <p style={{
          fontSize: 10, color: 'var(--muted)', marginTop: 14,
          textAlign: 'center', lineHeight: 1.5,
        }}>
          "Net Won" = profit after stake (claimed winnings minus original stake). Updated when winners claim.
        </p>
      </div>

      <style>{`
        @media (min-width: 600px) {
          [data-modal="leaderboard"] {
            border-radius: 20px !important;
            margin: auto !important;
          }
        }
      `}</style>
    </div>
  )
}
