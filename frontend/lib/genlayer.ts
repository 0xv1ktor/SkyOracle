import { createClient } from 'genlayer-js'
import { studionet, testnetAsimov } from 'genlayer-js/chains'
import { TransactionStatus } from 'genlayer-js/types'
import { parseEther, formatEther } from 'viem'

const NETWORK = process.env.NEXT_PUBLIC_NETWORK || 'studionet'
export const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || ''

export const CHAIN = NETWORK === 'testnet' ? testnetAsimov : studionet
export const CHAIN_KEY = NETWORK === 'testnet' ? 'testnetAsimov' : 'studionet'

// 61999 decimal = 0xF22F hex
const CHAIN_HEX = '0xF22F'

export const NETWORK_CONFIG = {
  chainId: CHAIN_HEX,
  chainName: 'GenLayer Studio',
  nativeCurrency: { name: 'GEN', symbol: 'GEN', decimals: 18 },
  rpcUrls: ['https://studio.genlayer.com/api'],
  blockExplorerUrls: ['https://studio.genlayer.com'],
}

// --- CLIENTS ---

/**
 * Read-only client - Digunakan untuk memanggil fungsi 'readonly' di kontrak
 */
export function getReadClient() {
  return createClient({ chain: CHAIN })
}

/**
 * Write client - Digunakan untuk transaksi yang mengubah state (membutuhkan wallet)
 */
export function getWriteClient(address: string) {
  return createClient({
    chain: CHAIN,
    account: address as `0x${string}`,
  })
}

// --- NETWORK HELPERS ---

export async function ensureNetwork(): Promise<void> {
  if (typeof window === 'undefined') return
  const eth = (window as any).ethereum
  if (!eth) return
  try {
    await eth.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: CHAIN_HEX }],
    })
  } catch (e: any) {
    // Error 4902 berarti network belum ada di MetaMask
    if (e.code === 4902 || e.code === -32603) {
      try {
        await eth.request({
          method: 'wallet_addEthereumChain',
          params: [NETWORK_CONFIG],
        })
      } catch (addErr) {
        console.error('Failed to add network:', addErr)
      }
    }
  }
}

export function getEthereum() {
  return (window as any).ethereum
}

export { TransactionStatus }

// --- UNIT CONVERSIONS (GEN <-> WEI) ---

export function toWei(amount: string | number): bigint {
  return parseEther(String(amount));
}

export function fromWei(wei: bigint | string | number): number {
  try {
    if (!wei) return 0;
    // Mengubah satuan Wei (18 desimal) kembali ke angka GEN biasa
    return parseFloat(formatEther(BigInt(wei)));
  } catch {
    return 0;
  }
}