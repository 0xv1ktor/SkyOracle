import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'SkyOracle',
  description: 'Onchain weather prediction markets powered by GenLayer Intelligent Contracts',
  icons: {
    icon: `data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text x=%2250%%22 y=%2250%%22 dominant-baseline=%22central%22 text-anchor=%22middle%22 font-size=%2280%22>🔮</text></svg>`,
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  )
}
