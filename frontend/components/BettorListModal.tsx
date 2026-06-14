'use client'
import { Market, useMarketBets } from '@/hooks/useMarkets'
import { fromWei } from '@/lib/genlayer'

interface Props {
  market: Market
  onClose: () => void
  currentAddress: string | null
}

function shortAddr(a: string) {
  if (!a) return '—'
  return `${a.slice(0, 6)}...${a.slice(-4)}`
}

function formatTs(ts?: number) {
  if (!ts || ts === 0) return ''
  const d = new Date(Number(ts) * 1000)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleString()
}

export function BettorListModal({ market, onClose, currentAddress }: Props) {
  const { bets, loading } = useMarketBets(market.id)
  const isResolved = market.status === 'resolved'
  const sideAKey = market.market_type === 'duel' ? 'CITY1' : 'YES'
  const sideBKey = market.market_type === 'duel' ? 'CITY2' : 'NO'
  const sideALabel = market.market_type === 'duel' ? market.city1 : 'YES'
  const sideBLabel = market.market_type === 'duel' ? market.city2 : 'NO'

  const sideABets = bets.filter(b => b.side === sideAKey)
  const sideBBets = bets.filter(b => b.side === sideBKey)

  function isWinner(side: string): boolean {
    if (!isResolved) return false
    if (market.winner_side === 'DRAW') return true
    return market.winner_side === side
  }

  function Row({ b }: { b: typeof bets[number] }) {
    const isMe = currentAddress && b.bettor.toLowerCase() === currentAddress.toLowerCase()
    const won = isResolved && (market.winner_side === b.side || market.winner_side === 'DRAW')
    const lost = isResolved && !won
    return (
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr auto',
        alignItems: 'center', gap: 8,
        padding: '8px 10px', borderRadius: 8,
        background: isMe ? 'rgba(159,231,255,0.09)' : 'transparent',
        border: isMe ? '1px solid var(--border2)' : '1px solid transparent',
      }}>
        <div style={{ minWidth: 0 }}>
          <div style={{
            fontSize: 12, color: 'var(--text)',
            display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap',
          }}>
            <span style={{ fontFamily: 'monospace' }}>{shortAddr(b.bettor)}</span>
            {isMe && <span style={{ fontSize: 9, color: 'var(--accent)', background: 'rgba(159,231,255,0.14)', padding: '1px 6px', borderRadius: 3 }}>YOU</span>}
            {isResolved && won && <span style={{ fontSize: 9, color: 'var(--green)' }}>✓ won</span>}
            {isResolved && lost && <span style={{ fontSize: 9, color: 'var(--red)' }}>✗ lost</span>}
            {b.claimed && <span style={{ fontSize: 9, color: 'var(--muted)' }}>· claimed</span>}
          </div>
          {b.timestamp ? (
            <div style={{ fontSize: 9, color: 'var(--muted)', marginTop: 2 }}>
              {formatTs(b.timestamp)}
            </div>
          ) : null}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text)', textAlign: 'right', fontWeight: 600, whiteSpace: 'nowrap' }}>
          {fromWei(b.amount).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 3 })} GEN
        </div>
      </div>
    )
  }

  function Column({
    title, sideKey, color, totalWei, bets: list,
  }: { title: string; sideKey: string; color: string; totalWei: number; bets: typeof bets }) {
    const winning = isWinner(sideKey)
    return (
      <div style={{
        background: 'rgba(255,255,255,0.065)', borderRadius: 12,
        border: `1px solid ${winning ? color : 'var(--border)'}`,
        padding: 12,
      }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          paddingBottom: 8, borderBottom: '1px solid var(--border)', marginBottom: 8,
          flexWrap: 'wrap', gap: 4,
        }}>
          <div style={{ fontWeight: 700, fontSize: 13, color, display: 'flex', alignItems: 'center', gap: 6 }}>
            {title}
            {winning && (
              <span style={{ fontSize: 9, background: color, color: '#11131f', padding: '1px 6px', borderRadius: 3 }}>
                WINNER
              </span>
            )}
          </div>
          <div style={{ fontSize: 10, color: 'var(--muted)' }}>
            {list.length} bet{list.length !== 1 ? 's' : ''} · {fromWei(totalWei).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 3 })} GEN
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {list.length === 0 ? (
            <div style={{ fontSize: 11, color: 'var(--muted)', textAlign: 'center', padding: 14 }}>
              No bets yet
            </div>
          ) : (
            list.map((b, i) => <Row key={i} b={b} />)
          )}
        </div>
      </div>
    )
  }

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
        maxWidth: 680,
        padding: '20px 16px',
        borderRadius: '20px 20px 0 0',
        maxHeight: '88vh',
        overflowY: 'auto',
        margin: 0,
      }}
        data-modal="bettors"
      >
        {/* Drag handle */}
        <div style={{
          width: 40, height: 4, borderRadius: 2,
          background: 'rgba(255,255,255,0.15)',
          margin: '0 auto 16px',
        }} />

        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'flex-start', marginBottom: 14, gap: 8,
        }}>
          <div style={{ minWidth: 0 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.3 }}>
              Bettors · Market #{market.id}
            </h2>
            <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4, lineHeight: 1.4 }}>
              {market.question}
            </p>
            {isResolved && (
              <p style={{ fontSize: 11, color: 'var(--accent)', marginTop: 4 }}>
                Resolved · Winner: {market.winner_side}
              </p>
            )}
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', color: 'var(--muted)',
            cursor: 'pointer', fontSize: 20, flexShrink: 0, padding: 4,
          }}>✕</button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--muted)', fontSize: 13 }}>
            Loading bettors...
          </div>
        ) : bets.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--muted)', fontSize: 13 }}>
            No bets placed on this market yet
          </div>
        ) : (
          /* Stack columns vertically on mobile, side-by-side on desktop */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Column
              title={sideALabel}
              sideKey={sideAKey}
              color="var(--green)"
              totalWei={market.total_yes}
              bets={sideABets}
            />
            <Column
              title={sideBLabel}
              sideKey={sideBKey}
              color="var(--red)"
              totalWei={market.total_no}
              bets={sideBBets}
            />
          </div>
        )}
      </div>

      <style>{`
        @media (min-width: 600px) {
          [data-modal="bettors"] {
            border-radius: 20px !important;
            margin: auto !important;
          }
          [data-modal="bettors"] > div[style*="flex-direction: column"] {
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
          }
        }
      `}</style>
    </div>
  )
}
