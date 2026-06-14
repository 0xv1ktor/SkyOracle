'use client'
import { useState, useEffect, useCallback } from 'react'
import {
  ensureNetwork, getWriteClient, getEthereum,
  CONTRACT_ADDRESS, TransactionStatus, CHAIN_KEY
} from '@/lib/genlayer'

const STORAGE_KEY = 'skyoracle:disconnected'

export function useWallet() {
  const [address, setAddress] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const [connecting, setConnecting] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  const connect = useCallback(async () => {
    const eth = getEthereum()
    if (!eth) { alert('Install MetaMask!'); return }
    setConnecting(true)
    try {
      // Clear disconnect flag — user explicitly wants to connect
      try { localStorage.removeItem(STORAGE_KEY) } catch {}
      await ensureNetwork()
      const accounts: string[] = await eth.request({ method: 'eth_requestAccounts' })
      if (accounts[0]) setAddress(accounts[0])
    } catch (e) {
      console.error(e)
    } finally {
      setConnecting(false)
    }
  }, [])

  const disconnect = useCallback(() => {
    // Web3 wallets (MetaMask) don't expose a real disconnect API.
    // We clear local app state and remember the choice so we don't
    // auto-reconnect on next page load. To revoke fully, the user must
    // disconnect manually inside MetaMask → Connected sites.
    setAddress(null)
    try { localStorage.setItem(STORAGE_KEY, '1') } catch {}
  }, [])

  useEffect(() => {
    if (!mounted) return
    const eth = getEthereum()
    if (!eth) return
    let disconnected = false
    try { disconnected = localStorage.getItem(STORAGE_KEY) === '1' } catch {}
    if (disconnected) return

    eth.request({ method: 'eth_accounts' })
      .then((accounts: string[]) => { if (accounts[0]) setAddress(accounts[0]) })
      .catch(() => {})
    const handler = (accs: string[]) => setAddress(accs[0] ?? null)
    eth.on('accountsChanged', handler)
    return () => {
      try { eth.removeListener?.('accountsChanged', handler) } catch {}
    }
  }, [mounted])

  const writeContract = useCallback(async (
    functionName: string,
    args: unknown[],
    value?: bigint
  ) => {
    if (!address) throw new Error('Not connected')
    await ensureNetwork()
    const client = getWriteClient(address)
    // Some wallets (e.g. OKX) don't implement MetaMask Snaps methods like
    // `wallet_getSnaps` that genlayer-js probes during connect. Swallow that
    // specific error — it's only feature detection and the actual transaction
    // works fine without Snaps.
    try {
      await client.connect(CHAIN_KEY as any)
    } catch (e: any) {
      const msg = String(e?.message || e || '')
      if (!/wallet_getSnaps|Method not found|snap/i.test(msg)) {
        throw e
      }
      console.warn('Wallet does not support Snaps — continuing anyway:', msg)
    }
    const txHash = await client.writeContract({
      address: CONTRACT_ADDRESS as `0x${string}`,
      functionName,
      args: args as any,
      value: value ?? BigInt(0),
    })
    try {
  const receipt = await Promise.race([
    client.waitForTransactionReceipt({
      hash: txHash,
      status: TransactionStatus.ACCEPTED,
    }),
    new Promise(resolve => setTimeout(() => resolve({ txHash, timedOut: true }), 60000))
  ])
  return receipt
} catch (e) {
  console.warn('Wait receipt failed, tx likely in progress:', txHash)
  return { txHash }
}
  }, [address])

  return { address, connect, disconnect, connecting, mounted, writeContract }
}
