import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Sales Co-worker — AI Sales Assistant',
  description: 'AI-powered sales coworker: manage leads, emails, and deals with Zoho, Outlook, and Yeastar PBX',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
