import type { Metadata } from 'next'
import './globals.css'
import { AppProvider } from '@/context/AppContext'
import DebugPanel from '@/components/DebugPanel'

export const metadata: Metadata = {
  title: 'Grocery Tracker',
  description: 'Local-first grocery inventory management',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <AppProvider>
          {children}
          <DebugPanel />
        </AppProvider>
      </body>
    </html>
  )
}
