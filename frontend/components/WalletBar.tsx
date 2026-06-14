'use client'
import { useState, useRef, useEffect } from 'react'
import { Copy, LogOut, Wallet } from 'lucide-react'

interface Props {
  address: string | null
  connect: () => void
  disconnect: () => void
  connecting: boolean
  mounted: boolean
}

export function WalletBar({ address, connect, disconnect, connecting, mounted }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  if (!mounted) return <div style={{ width: 100, height: 34 }} />

  if (!address) {
    return (
      <button
        className="btn-primary"
        onClick={connect}
        disabled={connecting}
        style={{ padding: '10px 14px', fontSize: 12, whiteSpace: 'nowrap' }}
      >
        <Wallet size={15} />
        {connecting ? 'Connecting...' : 'Connect Wallet'}
      </button>
    )
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          background: 'rgba(255,255,255,0.07)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 16,
          padding: '9px 11px',
          fontSize: 12,
          color: 'var(--text)',
          fontFamily: 'JetBrains Mono, monospace',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 7,
          whiteSpace: 'nowrap',
          maxWidth: 150,
        }}
      >
        <span style={{
          width: 7, height: 7, borderRadius: '50%',
          background: 'var(--green)', boxShadow: '0 0 10px rgba(145,226,186,0.8)',
          flexShrink: 0,
        }} />
        <span>{address.slice(0, 4)}...{address.slice(-4)}</span>
        <span style={{ fontSize: 8, opacity: 0.7 }}>▾</span>
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', right: 0,
          background: 'rgba(21,23,36,0.96)',
          border: '1px solid rgba(255,255,255,0.14)',
          borderRadius: 18, padding: 8,
          minWidth: 210,
          maxWidth: 'calc(100vw - 24px)',
          zIndex: 200,
          boxShadow: '0 18px 50px rgba(0,0,0,0.48)',
          backdropFilter: 'blur(18px)',
        }}>
          <div style={{
            padding: '8px 10px', fontSize: 11, color: 'var(--muted)',
            fontFamily: 'JetBrains Mono, monospace', wordBreak: 'break-all', lineHeight: 1.5,
          }}>
            {address}
          </div>
          <button
            onClick={() => { navigator.clipboard?.writeText(address); setOpen(false) }}
            style={{
              width: '100%', textAlign: 'left', padding: '8px 10px',
              background: 'transparent', border: 'none', borderRadius: 6,
              color: 'var(--text)', fontSize: 12, cursor: 'pointer',
              fontFamily: 'Manrope, ui-sans-serif, system-ui, sans-serif',
              display: 'flex', alignItems: 'center', gap: 8,
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <Copy size={14} />
            Copy address
          </button>
          <button
            onClick={() => { disconnect(); setOpen(false) }}
            style={{
              width: '100%', textAlign: 'left', padding: '8px 10px',
              background: 'transparent', border: 'none', borderRadius: 6,
              color: 'var(--red)', fontSize: 12, cursor: 'pointer',
              fontFamily: 'Manrope, ui-sans-serif, system-ui, sans-serif',
              display: 'flex', alignItems: 'center', gap: 8,
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,142,154,0.08)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <LogOut size={14} />
            Disconnect
          </button>
          <div style={{
            padding: '8px 10px 4px', fontSize: 10, color: 'var(--muted)',
            borderTop: '1px solid var(--border)', marginTop: 4, lineHeight: 1.5,
          }}>
            To fully revoke access, also disconnect from wallet then reconnect to connected sites.
          </div>
        </div>
      )}
    </div>
  )
}
