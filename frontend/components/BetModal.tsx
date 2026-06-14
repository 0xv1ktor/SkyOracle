'use client'
import { useState } from 'react'
import { Market } from '@/hooks/useMarkets'
import { toWei } from '@/lib/genlayer'

interface Props {
  market: Market
  onClose: () => void
  onSuccess: () => void
  writeContract: any
}

export function BetModal({ market, onClose, onSuccess, writeContract }: Props) {
  const [side, setSide] = useState(market.market_type === 'duel' ? 'CITY1' : 'YES')
  const [amount, setAmount] = useState('1')
  const [loading, setLoading] = useState(false)
  const [txMsg, setTxMsg] = useState('')

  const sideA = market.market_type === 'duel' ? market.city1 : 'YES 🟢'
  const sideB = market.market_type === 'duel' ? market.city2 : 'NO 🔴'
  const sideAKey = market.market_type === 'duel' ? 'CITY1' : 'YES'
  const sideBKey = market.market_type === 'duel' ? 'CITY2' : 'NO'

  async function handleBet() {
    setLoading(true)
    setTxMsg('Sending transaction...')
    try {
      const wei = toWei(amount)
      if (wei <= BigInt(0)) throw new Error('Amount must be > 0')
      if (parseFloat(amount) < 1) throw new Error('Minimum bet is 1 GEN')
      await writeContract('place_bet', [market.id, side], wei)
      setTxMsg('Bet placed! Waiting for consensus...')
      setTimeout(() => { onSuccess(); onClose() }, 3000)
    } catch (e: any) {
      console.error('GenLayer Transaction Error:', e)
      setTxMsg('Error: ' + (e.message || 'Transaction failed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(17,19,31,0.86)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      zIndex: 100, backdropFilter: 'blur(8px)',
      padding: 0,
    }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      {/* Sheet slides up from bottom on mobile, centered on desktop */}
      <div className="card" style={{
        width: '100%',
        maxWidth: 460,
        padding: '24px 20px',
        borderRadius: '20px 20px 0 0',
        margin: 0,
        maxHeight: '92vh',
        overflowY: 'auto',
      }}
        /* on desktop, center it instead */
        data-modal="bet"
      >
        {/* Drag handle (mobile hint) */}
        <div style={{
          width: 40, height: 4, borderRadius: 2,
          background: 'rgba(255,255,255,0.15)',
          margin: '0 auto 18px',
        }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 17, fontWeight: 700 }}>Place Bet</h2>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', color: 'var(--muted)',
            cursor: 'pointer', fontSize: 20, padding: 4,
          }}>✕</button>
        </div>

        <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 18, lineHeight: 1.5 }}>
          {market.question}
        </p>

        {/* Side selector */}
        <div style={{ marginBottom: 16 }}>
          <label>Your prediction</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { key: sideAKey, label: sideA, color: 'var(--green)' },
              { key: sideBKey, label: sideB, color: 'var(--red)' },
            ].map(opt => (
              <button key={opt.key} onClick={() => setSide(opt.key)} style={{
                padding: '13px 8px', borderRadius: 12, border: '2px solid',
                borderColor: side === opt.key ? opt.color : 'var(--border)',
                background: side === opt.key ? `${opt.color}18` : 'rgba(255,255,255,0.055)',
                color: side === opt.key ? opt.color : 'var(--muted)',
                fontWeight: 700, fontSize: 13, cursor: 'pointer',
                transition: 'all 0.15s',
              }}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Amount */}
        <div style={{ marginBottom: 18 }}>
          <label>Bet amount (GEN)</label>
          <input
            type="number" min="1" step="1"
            value={amount} onChange={e => setAmount(e.target.value)}
            style={{ marginBottom: 8 }}
          />
          <p style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 6 }}>
            Minimum bet: 1 GEN
          </p>
          {/* Quick amounts */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {['1', '2', '5', '10'].map(v => (
              <button key={v} onClick={() => setAmount(v)} style={{
                padding: '5px 12px', borderRadius: 6, border: '1px solid var(--border)',
                background: amount === v ? 'rgba(255,189,122,0.14)' : 'transparent',
                color: 'var(--accent)', fontSize: 12, cursor: 'pointer',
                fontWeight: amount === v ? 700 : 500,
              }}>{v}</button>
            ))}
          </div>
        </div>

        {txMsg && (
          <div style={{
            background: 'rgba(255,255,255,0.075)', border: '1px solid var(--border2)',
            borderRadius: 8, padding: '10px 14px', fontSize: 13, color: 'var(--accent)',
            marginBottom: 14, wordBreak: 'break-word', lineHeight: 1.5,
          }}>{txMsg}</div>
        )}

        <button
          className="btn-primary"
          onClick={handleBet}
          disabled={loading || !amount || parseFloat(amount) < 1}
          style={{ width: '100%', padding: '14px' }}
        >
          {loading ? 'Processing...' : `Bet ${amount} GEN on ${side === sideAKey ? sideA : sideB}`}
        </button>
      </div>

      {/* Desktop: re-center the modal */}
      <style>{`
        @media (min-width: 600px) {
          [data-modal="bet"] {
            border-radius: 20px !important;
            margin: auto !important;
            max-height: 85vh !important;
          }
        }
      `}</style>
    </div>
  )
}
