'use client'
import { useState } from 'react'
import { CitySearch } from './CitySearch'

interface Props {
  onClose: () => void
  onSuccess: () => void
  writeContract: any
}

export function CreateMarketModal({ onClose, onSuccess, writeContract }: Props) {
  const [type, setType] = useState('rain')
  const [city1, setCity1] = useState('')
  const [city2, setCity2] = useState('')
  const [lat1, setLat1] = useState('')
  const [lon1, setLon1] = useState('')
  const [lat2, setLat2] = useState('')
  const [lon2, setLon2] = useState('')
  const [threshold, setThreshold] = useState('30')
  const [date, setDate] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() + 1)
    return d.toISOString().split('T')[0]
  })
  const [question, setQuestion] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  const autoQuestion = () => {
    if (type === 'rain') return `Will it rain in ${city1 || '...'} on ${date}?`
    if (type === 'temperature') return `Will the temperature in ${city1 || '...'} exceed ${threshold}°C on ${date}?`
    return `Which city will be hotter on ${date}: ${city1 || 'City 1'} or ${city2 || 'City 2'}?`
  }

  const canCreate =
    !!city1 && !!lat1 && !!lon1 &&
    (type !== 'duel' || (!!city2 && !!lat2 && !!lon2))

  async function handleCreate() {
    setLoading(true)
    setMsg('Creating market...')
    try {
      const q = question || autoQuestion()
      await writeContract('create_market', [type, city1, city2, lat1, lon1, lat2, lon2, threshold, date, q], undefined)
      setMsg('Market created!')
      setTimeout(() => { onSuccess(); onClose() }, 1200)
    } catch (e: any) {
      setMsg('Error: ' + (e.message || 'Failed'))
    } finally {
      setLoading(false)
    }
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
        maxWidth: 500,
        padding: '20px 18px',
        borderRadius: '20px 20px 0 0',
        maxHeight: '92vh',
        overflowY: 'auto',
        margin: 0,
      }}
        data-modal="create"
      >
        {/* Drag handle */}
        <div style={{
          width: 40, height: 4, borderRadius: 2,
          background: 'rgba(255,255,255,0.15)',
          margin: '0 auto 16px',
        }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <h2 style={{ fontSize: 17, fontWeight: 700 }}>Create Market</h2>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', color: 'var(--muted)',
            cursor: 'pointer', fontSize: 20, padding: 4,
          }}>✕</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Market type */}
          <div>
            <label>Market Type</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {[
                { key: 'rain', label: '🌧️ Rain', desc: 'Will it rain?' },
                { key: 'temperature', label: '🌡️ Temp', desc: 'Over threshold?' },
                { key: 'duel', label: '⚔️ Duel', desc: 'Hotter city?' },
              ].map(t => (
                <button key={t.key} onClick={() => setType(t.key)} style={{
                  padding: '10px 6px', borderRadius: 10, border: '2px solid',
                  borderColor: type === t.key ? 'var(--accent)' : 'var(--border)',
                  background: type === t.key ? 'rgba(255,189,122,0.14)' : 'rgba(255,255,255,0.05)',
                  color: type === t.key ? 'var(--accent)' : 'var(--muted)',
                  cursor: 'pointer', fontWeight: 600, fontSize: 12,
                  transition: 'all 0.15s', lineHeight: 1.4,
                }}>
                  <div>{t.label}</div>
                  <div style={{ fontSize: 10, marginTop: 2, opacity: 0.7 }}>{t.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* City 1 */}
          <div>
            <label>Search any city in the world</label>
            <CitySearch
              selected={city1 ? { name: city1, country: '', lat: lat1, lon: lon1 } : null}
              onSelect={(c) => { setCity1(c.name); setLat1(c.lat); setLon1(c.lon) }}
              accent="var(--accent)"
            />
          </div>

          {/* City 2 (duel only) */}
          {type === 'duel' && (
            <div>
              <label>Compare against City 1</label>
              <CitySearch
                selected={city2 ? { name: city2, country: '', lat: lat2, lon: lon2 } : null}
                onSelect={(c) => { setCity2(c.name); setLat2(c.lat); setLon2(c.lon) }}
                accent="var(--heat)"
              />
            </div>
          )}

          {/* Threshold (temp only) */}
          {type === 'temperature' && (
            <div>
              <label>Temperature Threshold (°C)</label>
              <input type="number" value={threshold} onChange={e => setThreshold(e.target.value)} />
            </div>
          )}

          {/* Date */}
          <div>
            <label>Resolve Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>

          {/* Custom question */}
          <div>
            <label>Question (auto-generated if empty)</label>
            <input
              value={question}
              onChange={e => setQuestion(e.target.value)}
              placeholder={autoQuestion()}
            />
          </div>

          {msg && (
            <div style={{
              background: 'rgba(255,255,255,0.075)', border: '1px solid var(--border2)',
              borderRadius: 8, padding: '10px 14px', fontSize: 13, color: 'var(--accent)',
              wordBreak: 'break-word', lineHeight: 1.5,
            }}>{msg}</div>
          )}

          <button
            className="btn-primary"
            onClick={handleCreate}
            disabled={loading || !canCreate}
            style={{ width: '100%', padding: 14 }}
          >
            {loading ? 'Creating...' : 'Create Market'}
          </button>
        </div>
      </div>

      <style>{`
        @media (min-width: 600px) {
          [data-modal="create"] {
            border-radius: 20px !important;
            margin: auto !important;
          }
        }
      `}</style>
    </div>
  )
}
