'use client'
import type { ReactNode } from 'react'
import { Market } from '@/hooks/useMarkets'
import { fromWei } from '@/lib/genlayer'
import {
  Calendar,
  CloudRain,
  Coins,
  Eye,
  MapPin,
  Swords,
  ThermometerSun,
} from 'lucide-react'

const ICONS: Record<string, ReactNode> = {
  rain: <CloudRain size={24} />,
  temperature: <ThermometerSun size={24} />,
  duel: <Swords size={24} />,
}

const LABELS: Record<string, string> = {
  rain: 'Rain',
  temperature: 'Temp',
  duel: 'Duel',
}

interface Props {
  market: Market
  onBet: (m: Market) => void
  onViewBets: () => void
}

export function MarketCard({ market, onBet, onViewBets }: Props) {
  const totalBigInt = BigInt(market.total_yes || 0) + BigInt(market.total_no || 0)
  const totalDisplay = fromWei(totalBigInt)
  const totalNum = Number(totalBigInt)
  const yesRatio = totalNum > 0
    ? (Number(market.total_yes) / totalNum) * 100
    : 50

  const isOpen = market.status === 'open'
  const typeLabel = market.market_type
  const sideA = market.market_type === 'duel' ? market.city1 : 'YES'
  const sideB = market.market_type === 'duel' ? market.city2 : 'NO'

  return (
    <div className="card market-card">
      <div className="market-card-top">
        <div className="market-icon">{ICONS[typeLabel]}</div>
        <span className={`tag tag-${market.status}`}>{market.status}</span>
      </div>

      <div>
        <span className={`tag tag-${typeLabel}`}>{LABELS[typeLabel] || typeLabel}</span>
      </div>

      <p className="market-question">
        {market.question}
      </p>

      <div className="market-card-meta">
        <span>
          <MapPin size={13} strokeWidth={2.5} />
          <span>{market.city1}{market.city2 ? ` vs ${market.city2}` : ''}</span>
        </span>
        <span>
          <Calendar size={13} strokeWidth={2.5} />
          <span>{market.resolve_date}</span>
        </span>
      </div>

      <div>
        <div className="market-split">
          <div className="market-side">
            <strong>{sideA}</strong>
            <span>{yesRatio.toFixed(0)}%</span>
          </div>
          <div className="market-side">
            <strong>{sideB}</strong>
            <span>{(100 - yesRatio).toFixed(0)}%</span>
          </div>
        </div>
        <div className="odds-track" style={{ marginTop: 8 }}>
          <div className="odds-fill" style={{ width: `${yesRatio}%` }} />
        </div>
      </div>

      <div className="market-footer">
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--muted)', fontWeight: 800 }}>
          <Coins size={14} />
          {totalDisplay.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })} GEN
        </span>
        <div className="market-actions">
          <button
            className="btn-ghost"
            onClick={onViewBets}
            style={{ padding: '7px 10px', fontSize: 11 }}
          >
            <Eye size={13} />
            Bets
          </button>
          {isOpen && (
            <button
              className="btn-primary"
              onClick={() => onBet(market)}
              style={{ padding: '7px 11px', fontSize: 11 }}
            >
              Bet
            </button>
          )}
          {market.status === 'resolved' && (
            <span style={{ fontSize: 12, color: 'var(--accent)', alignSelf: 'center' }}>
               Winner: {
                market.winner_side === 'CITY1' ? market.city1 :
                market.winner_side === 'CITY2' ? market.city2 :
                market.winner_side
              }
            </span>
          )}
        </div>
      </div>
      {market.status === 'resolved' && market.reasoning && (
        <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
          {market.reasoning}
        </p>
      )}
    </div>
  )
}
