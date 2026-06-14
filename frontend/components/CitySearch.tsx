'use client'
import { useState, useEffect } from 'react'

export interface CitySuggestion {
  name: string
  country: string
  admin1?: string
  lat: string
  lon: string
}

interface Props {
  selected: { name: string; country: string; lat: string; lon: string } | null
  onSelect: (c: CitySuggestion) => void
  accent: string
}

export function CitySearch({ selected, onSelect, accent }: Props) {
  const [query, setQuery] = useState(selected?.name ?? '')
  const [results, setResults] = useState<CitySuggestion[]>([])
  const [loading, setLoading] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [debounceTimer, setDebounceTimer] = useState<any>(null)

  useEffect(() => {
    if (selected?.name && selected.name !== query) setQuery(selected.name)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.name])

  function search(q: string) {
    if (q.length < 2) { setResults([]); return }
    setLoading(true)
    fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=10&language=en&format=json`)
      .then(r => r.json())
      .then(data => {
        const list: CitySuggestion[] = (data.results || []).map((r: any) => ({
          name: r.name,
          country: r.country || '',
          admin1: r.admin1 || '',
          lat: String(r.latitude),
          lon: String(r.longitude),
        }))
        setResults(list)
      })
      .catch(() => setResults([]))
      .finally(() => setLoading(false))
  }

  function onChange(v: string) {
    setQuery(v)
    setShowDropdown(true)
    if (debounceTimer) clearTimeout(debounceTimer)
    const t = setTimeout(() => search(v), 300)
    setDebounceTimer(t)
  }

  function pick(c: CitySuggestion) {
    onSelect(c)
    setQuery(c.name)
    setShowDropdown(false)
    setResults([])
  }

  return (
    <div style={{ position: 'relative' }}>
      <input
        value={query}
        onChange={e => onChange(e.target.value)}
        onFocus={() => { if (results.length > 0) setShowDropdown(true) }}
        onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
        placeholder="Type city name (e.g. Jakarta, Tokyo, London)..."
        style={{ width: '100%' }}
      />
      {selected?.name && selected.lat && selected.lon && !showDropdown && (
        <div style={{
          marginTop: 6, padding: '6px 12px', borderRadius: 6,
          background: 'rgba(255,255,255,0.07)', border: '1px solid var(--border)',
          fontSize: 11, color: 'var(--muted)', fontFamily: 'Manrope, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "sans-serif"',
          wordBreak: 'break-word',
        }}>
          ✓ {selected.name} {selected.country && `· ${selected.country}`} · {selected.lat}, {selected.lon}
        </div>
      )}
      {showDropdown && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4,
          background: 'var(--bg3)', border: '1px solid var(--border2)',
          borderRadius: 10, maxHeight: 240, overflowY: 'auto', zIndex: 200,
          boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
        }}>
          {loading && (
            <div style={{ padding: 12, fontSize: 12, color: 'var(--muted)', textAlign: 'center' }}>
              Searching...
            </div>
          )}
          {!loading && results.length === 0 && query.length >= 2 && (
            <div style={{ padding: 12, fontSize: 12, color: 'var(--muted)', textAlign: 'center' }}>
              No cities found for "{query}"
            </div>
          )}
          {!loading && query.length < 2 && (
            <div style={{ padding: 12, fontSize: 12, color: 'var(--muted)', textAlign: 'center' }}>
              Type at least 2 characters
            </div>
          )}
          {results.map((c, i) => (
            <button
              key={i}
              onMouseDown={(e) => { e.preventDefault(); pick(c) }}
              style={{
                width: '100%', textAlign: 'left', padding: '10px 14px',
                background: 'transparent', border: 'none', borderBottom: '1px solid var(--border)',
                color: 'var(--text)', cursor: 'pointer',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                gap: 8, fontFamily: 'Manrope, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "sans-serif"',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</div>
                <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {c.admin1 ? `${c.admin1}, ` : ''}{c.country}
                </div>
              </div>
              <div style={{ fontSize: 10, color: accent, fontFamily: 'Manrope, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "sans-serif"', flexShrink: 0 }}>
                {parseFloat(c.lat).toFixed(2)}, {parseFloat(c.lon).toFixed(2)}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
