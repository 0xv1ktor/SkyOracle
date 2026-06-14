'use client'
import { useState, useEffect, useCallback } from 'react'
import { getReadClient, CONTRACT_ADDRESS } from '@/lib/genlayer'

export interface Market {
  id: number
  market_type: string
  city1: string
  city2: string
  lat1: string; lon1: string; lat2: string; lon2: string
  threshold: string
  resolve_date: string
  question: string
  status: string
  winner_side: string
  reasoning: string 
  total_yes: number
  total_no: number
  creator: string
}

export interface BetEntry {
  bet_index: number
  market_id: number
  bettor: string
  side: string
  amount: number
  claimed: boolean
  timestamp?: number
}

export interface LeaderEntry {
  addr: string
  total_winnings: number
  total_wagered: number
  wins: number
  losses: number
}

export function useMarkets() {
  const [markets, setMarkets] = useState<Market[]>([])
  const [loading, setLoading] = useState(true)

  const fetchMarkets = useCallback(async () => {
    if (!CONTRACT_ADDRESS) { setLoading(false); return }
    setLoading(true)
    try {
      const client = getReadClient()
      const result = await client.readContract({
        address: CONTRACT_ADDRESS as `0x${string}`,
        functionName: 'get_all_markets',
        args: [],
      })
      if (Array.isArray(result)) {
        // DEBUG: log raw to see if total_yes is 1e19 (chain bug) or 1e18 (frontend bug)
        if (result[0]) console.log('[market raw]', result[0])
        setMarkets(result.filter(Boolean) as unknown as Market[])
      }
    } catch (e) {
      console.error('fetchMarkets error:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchMarkets() }, [fetchMarkets])
  return { markets, loading, refetch: fetchMarkets }
}

export function useMyBets(address: string | null) {
  const [bets, setBets] = useState<BetEntry[]>([])
  const [loading, setLoading] = useState(false)

  const fetchBets = useCallback(async () => {
    if (!address || !CONTRACT_ADDRESS) { setBets([]); return }
    setLoading(true)
    try {
      const client = getReadClient()
      const result = await client.readContract({
        address: CONTRACT_ADDRESS as `0x${string}`,
        functionName: 'get_my_bets',
        args: [address] as any,
      })
      if (Array.isArray(result)) setBets(result as unknown as BetEntry[])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [address])

  useEffect(() => { fetchBets() }, [fetchBets])
  return { bets, loading, refetch: fetchBets }
}

export function useMarketBets(marketId: number | null) {
  const [bets, setBets] = useState<BetEntry[]>([])
  const [loading, setLoading] = useState(false)

  const fetchBets = useCallback(async () => {
    if (marketId == null || !CONTRACT_ADDRESS) { setBets([]); return }
    setLoading(true)
    try {
      const client = getReadClient()
      const result = await client.readContract({
        address: CONTRACT_ADDRESS as `0x${string}`,
        functionName: 'get_bets_for_market',
        args: [marketId] as any,
      })
      if (Array.isArray(result)) setBets(result as unknown as BetEntry[])
    } catch (e) {
      console.error('get_bets_for_market', e)
    } finally {
      setLoading(false)
    }
  }, [marketId])

  useEffect(() => { fetchBets() }, [fetchBets])
  return { bets, loading, refetch: fetchBets }
}

export function useLeaderboard() {
  const [leaders, setLeaders] = useState<LeaderEntry[]>([])
  const [loading, setLoading] = useState(true)

  const fetchLeaders = useCallback(async () => {
    if (!CONTRACT_ADDRESS) { setLoading(false); return }
    setLoading(true)
    try {
      const client = getReadClient()
      const result = await client.readContract({
        address: CONTRACT_ADDRESS as `0x${string}`,
        functionName: 'get_leaderboard',
        args: [],
      })
      if (Array.isArray(result)) {
        const sorted = (result as unknown as LeaderEntry[]).sort(
          (a, b) => Number(b.total_winnings) - Number(a.total_winnings)
        )
        setLeaders(sorted)
      }
    } catch (e) {
      console.error('fetchLeaders', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchLeaders() }, [fetchLeaders])
  return { leaders, loading, refetch: fetchLeaders }
}

export function useOwner() {
  const [owner, setOwner] = useState<string | null>(null)

  useEffect(() => {
    if (!CONTRACT_ADDRESS) return
    const client = getReadClient()
    client.readContract({
      address: CONTRACT_ADDRESS as `0x${string}`,
      functionName: 'get_owner',
      args: [],
    }).then((r: any) => setOwner(typeof r === 'string' ? r : null))
      .catch(() => {})
  }, [])
  return owner
}
