'use client'

import dynamic from 'next/dynamic'

const SkyOracleApp = dynamic(() => import('@/components/SkyOracleApp'), {
  ssr: false,
  loading: () => (
    <main className="sky-app">
      <div className="loading-state" style={{ minHeight: '100vh' }}>
        <div>
          <div className="empty-state-icon">☔</div>
          Loading SkyOracle...
        </div>
      </div>
    </main>
  ),
})

export function SkyOracleClient() {
  return <SkyOracleApp />
}
