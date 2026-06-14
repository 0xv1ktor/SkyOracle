'use client'
import { useState, useCallback } from 'react'
import { useWallet } from '@/hooks/useWallet'
import { useMarkets, useMyBets, useLeaderboard, useOwner, Market } from '@/hooks/useMarkets'
import { fromWei, CONTRACT_ADDRESS } from '@/lib/genlayer'
import { RainBg } from '@/components/RainBg'
import { WalletBar } from '@/components/WalletBar'
import { MarketCard } from '@/components/MarketCard'
import { BetModal } from '@/components/BetModal'
import { CreateMarketModal } from '@/components/CreateMarketModal'
import { ClaimPanel } from '@/components/ClaimPanel'
import { BettorListModal } from '@/components/BettorListModal'
import { Leaderboard } from '@/components/Leaderboard'
import {
  Activity,
  CalendarDays,
  CloudRain,
  Droplets,
  Home,
  Map,
  Menu,
  Plus,
  Search,
  SunMedium,
  Trophy,
  Wind,
} from 'lucide-react'


export default function Home() {
  const { address, connect, disconnect, connecting, mounted, writeContract } = useWallet()
  const { markets, loading, refetch } = useMarkets()
  const { bets, refetch: refetchBets } = useMyBets(address)
  const { leaders, refetch: refetchLeaders } = useLeaderboard()
  const owner = useOwner()
  const [betTarget, setBetTarget] = useState<Market | null>(null)
  const [bettorListMarket, setBettorListMarket] = useState<Market | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  const [filter, setFilter] = useState<'all' | 'open' | 'resolved'>('all')
  const [resolving, setResolving] = useState<number | null>(null)
  const [resolveMsg, setResolveMsg] = useState<Record<number, string>>({})

  const isOwner = !!(address && owner && address.toLowerCase() === owner.toLowerCase())
  const openMarkets = markets.filter(m => m.status === 'open').length
  const totalPool = fromWei(markets.reduce(
    (sum, m) => sum + BigInt(m.total_yes || 0) + BigInt(m.total_no || 0),
    BigInt(0)
  ))
  const filtered = markets
  .filter(m => filter === 'all' ? true : m.status === filter)
  .sort((a, b) => {
    if (a.status === 'open' && b.status !== 'open') return -1
    if (a.status !== 'open' && b.status === 'open') return 1
    return 0
  })

  const handleResolve = useCallback(async (marketId: number) => {
    setResolving(marketId)
    setResolveMsg(m => ({ ...m, [marketId]: 'Fetching weather & resolving...' }))
    try {
      await writeContract('resolve_market', [marketId], undefined)
      setResolveMsg(m => ({ ...m, [marketId]: 'Resolved!' }))
      await refetch()
      refetchLeaders()
    } catch (e: any) {
      setResolveMsg(m => ({ ...m, [marketId]: 'Error: ' + (e.message || 'Failed') }))
    } finally {
      setResolving(null)
    }
  }, [writeContract, refetch, refetchLeaders])

  return (
    <main className="sky-app">
      <RainBg />
      <div className="sky-stage">
        <aside className="phone-shell">
          <div className="phone-inner">
            <div className="status-row">
              <span>9:41</span>
              <div className="status-dots" aria-hidden="true">
                <span />
                <span />
              </div>
            </div>

            <div className="phone-nav">
              <button className="icon-button" aria-label="Open menu">
                <Menu size={22} />
              </button>
              <div className="brand-chip">
                <span>SO</span>
                <span>SkyOracle</span>
              </div>
              <button
                className="icon-button"
                aria-label={address ? 'Create market' : 'Open leaderboard'}
                onClick={() => address ? setShowCreate(true) : setShowLeaderboard(true)}
              >
                <CalendarDays size={21} />
              </button>
            </div>

            <section className="weather-hero">
              <div className="location">Global Weather Oracle</div>
              <div className="weather-art" aria-hidden="true">
                <div className="weather-sun" />
                <div className="weather-cloud" />
                <div className="rain-lines">
                  <span />
                  <span />
                  <span />
                </div>
              </div>
              <div className="weather-temp">
                {openMarkets}<sup>°</sup>
              </div>
              <div className="weather-subtitle">Open markets scanning the sky.</div>
              <div className="weather-meta">
                <div><Wind size={18} /> {markets.length} total</div>
                <div><Droplets size={18} /> {openMarkets} open</div>
                <div><SunMedium size={18} /> {totalPool.toLocaleString(undefined, { maximumFractionDigits: 2 })} GEN</div>
              </div>
            </section>

            <nav className="bottom-dock" aria-label="Primary">
              <button className="icon-button active" aria-label="Markets">
                <Home size={20} />
              </button>
              <button className="icon-button" aria-label="Search markets">
                <Search size={20} />
              </button>
              <button
                className="icon-button"
                aria-label="Open leaderboard"
                onClick={() => setShowLeaderboard(true)}
              >
                <Trophy size={20} />
              </button>
              <button className="icon-button" aria-label="Map view">
                <Map size={20} />
              </button>
            </nav>
          </div>
        </aside>

        <section className="content-panel">
          <header className="top-actions">
            <div className="brand-chip">
              <span>SO</span>
              <span>SkyOracle</span>
            </div>
            <div className="action-group">
              <button className="btn-ghost" onClick={() => setShowLeaderboard(true)}>
                <Trophy size={16} />
                <span className="nav-label-full">Leaderboard</span>
                <span className="nav-label-icon">Rank</span>
              </button>
              {address && (
                <button className="btn-primary" onClick={() => setShowCreate(true)}>
                  <Plus size={16} />
                  <span className="nav-label-full">Create Market</span>
                  <span className="nav-label-icon">Create</span>
                </button>
              )}
              <WalletBar
                address={address}
                connect={connect}
                disconnect={disconnect}
                connecting={connecting}
                mounted={mounted}
              />
            </div>
          </header>

          <div className="dashboard-hero">
            <div className="dashboard-kicker">
              <CloudRain size={16} />
              GenLayer prediction markets
            </div>
            <h1 className="dashboard-title">
              Forecast the weather. <span>Trade the outcome.</span>
            </h1>
            <p className="dashboard-copy">
              A clean onchain dashboard for rain, temperature, and city duel markets resolved by SkyOracle.
            </p>
          </div>

          <div className="stat-strip">
            {[
              { label: 'Markets', value: markets.length },
              { label: 'Open', value: openMarkets },
              { label: 'Total Pool', value: `${totalPool.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })} GEN` },
            ].map(s => (
              <div key={s.label} className="stat-card">
                <div className="stat-value">{s.value}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </div>

          {address && bets.length > 0 && (
            <ClaimPanel
              bets={bets}
              markets={markets}
              writeContract={writeContract}
              onRefetch={() => { refetch(); refetchBets(); refetchLeaders() }}
            />
          )}

          <div className="section-title">
            <h2><Activity size={20} /> Market Forecast</h2>
            <div className="filter-row">
              {(['all', 'open', 'resolved'] as const).map(f => (
                <button
                  key={f}
                  className={`filter-pill ${filter === f ? 'active' : ''}`}
                  onClick={() => setFilter(f)}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="loading-state">
              <div>
              <div className="empty-state-icon">☔</div>
              Loading markets...
              </div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <div>
              <div className="empty-state-icon">🌤️</div>
              <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 18 }}>
                {CONTRACT_ADDRESS ? 'No markets yet. Be the first to create one!' : 'Add CONTRACT_ADDRESS to .env.local'}
              </p>
              {address && CONTRACT_ADDRESS && (
                <button className="btn-primary" onClick={() => setShowCreate(true)}>
                  Create First Market
                </button>
              )}
              </div>
            </div>
          ) : (
            <div className="market-grid">
              {filtered.map(m => {
                const today = new Date().toISOString().split('T')[0]
                const canResolve = m.resolve_date <= today
                return (
                  <div key={m.id}>
                    <MarketCard
                      market={m}
                      onBet={setBetTarget}
                      onViewBets={() => setBettorListMarket(m)}
                    />
                    {m.status === 'open' && address && isOwner && canResolve && (
                      <div className="force-resolve">
                        <button
                          className="btn-ghost"
                          onClick={() => handleResolve(m.id)}
                          disabled={resolving === m.id}
                          style={{ padding: '7px 10px', fontSize: 11, color: 'var(--sun)' }}
                        >
                          {resolveMsg[m.id] || (resolving === m.id ? 'Resolving...' : '⚡ Force Resolve (owner)')}
                        </button>
                      </div>
                    )}
                    {m.status === 'open' && !isOwner && resolveMsg[m.id] && (
                      <div style={{ marginTop: 6, textAlign: 'right', fontSize: 10, color: 'var(--sun)' }}>
                        {resolveMsg[m.id]}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          <footer className="footer-note">
            <p style={{ color: 'var(--muted)', fontSize: 12 }}>SkyOracle · Powered by GenLayer</p>
          </footer>
        </section>
      </div>

      {betTarget && (
        <BetModal
          market={betTarget}
          onClose={() => setBetTarget(null)}
          onSuccess={() => { refetch(); refetchBets() }}
          writeContract={writeContract}
        />
      )}
      {showCreate && (
        <CreateMarketModal
          onClose={() => setShowCreate(false)}
          onSuccess={refetch}
          writeContract={writeContract}
        />
      )}
      {bettorListMarket && (
        <BettorListModal
          market={bettorListMarket}
          onClose={() => setBettorListMarket(null)}
          currentAddress={address}
        />
      )}
      {showLeaderboard && (
        <Leaderboard
          leaders={leaders}
          onClose={() => setShowLeaderboard(false)}
          currentAddress={address}
        />
      )}
    </main>
  )
}
