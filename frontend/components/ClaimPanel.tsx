'use client'
import { useState } from 'react'
import { Market, BetEntry } from '@/hooks/useMarkets'
import { fromWei } from '@/lib/genlayer'

interface Props {
  bets: BetEntry[]
  markets: Market[]
  writeContract: any
  onRefetch: () => void
}

export function ClaimPanel({ bets, markets, writeContract, onRefetch }: Props) {
  const [claiming, setClaiming] = useState<number | null>(null)
  const [msgs, setMsgs] = useState<Record<number, string>>({})

  async function handleClaim(betIndex: number) {
    setClaiming(betIndex)
    setMsgs(m => ({ ...m, [betIndex]: 'Claiming...' }))
    try {
      await writeContract('claim_winnings', [betIndex], undefined)
      setMsgs(m => ({ ...m, [betIndex]: 'Claimed!' }))
      onRefetch()
    } catch (e: any) {
      setMsgs(m => ({ ...m, [betIndex]: 'Error: ' + (e.message || 'Failed') }))
    } finally {
      setClaiming(null)
    }
  }

  const claimable = bets.filter((b) => {
  const m = markets.find(x => x.id === b.market_id)

  return (
    m &&
    m.status === 'resolved' &&
    !b.claimed &&
    (m.winner_side === b.side || m.winner_side === 'DRAW')
  )
})

  if (claimable.length === 0) return null

  return (
    <div className="card" style={{ padding: 20, marginBottom: 24, borderColor: 'rgba(145,226,186,0.28)' }}>
      <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--green)', marginBottom: 14 }}>
        🎉 Claimable Winnings
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {claimable.map((b) => {
          const m = markets.find(x => x.id === b.market_id)
          const won = m?.winner_side === b.side || m?.winner_side === 'DRAW'
          return (
            <div key={b.bet_index} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              gap: 10, flexWrap: 'wrap',
            }}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <p style={{
                  fontSize: 13, fontWeight: 600,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>{m?.question}</p>
                <p style={{ fontSize: 11, color: won ? 'var(--green)' : 'var(--red)', fontFamily: 'Manrope, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "sans-serif"', marginTop: 2 }}>
                  {won ? '✓ Won' : '✗ Lost'} · {fromWei(b.amount).toFixed(3)} GEN bet on {
                    b.side === 'CITY1' ? m?.city1 :
                    b.side === 'CITY2' ? m?.city2 :
                    b.side
                  }
                </p>
              </div>
              <button className="btn-primary" onClick={() => handleClaim(b.bet_index)}
                disabled={claiming === b.bet_index} style={{ padding: '7px 14px', fontSize: 12 }}>
                {msgs[b.bet_index] || 'Claim'}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
