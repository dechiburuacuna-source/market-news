import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Industry Intelligence',
  description: 'Curated intelligence for Mining, Energy & Data Centers',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

const FONTS_URL =
  'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;0,900;1,400;1,700' +
  '&family=Source+Serif+4:ital,opsz,wght@0,8..60,300;0,8..60,400;0,8..60,600;1,8..60,400' +
  '&family=Inter:wght@400;500;600' +
  '&family=JetBrains+Mono:wght@400;500' +
  '&display=swap'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full overflow-hidden">
      <head>
        {/* Preconnect for speed */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Primary font load — also loaded via @import in globals.css as fallback */}
        <link href={FONTS_URL} rel="stylesheet" />
      </head>
      <body
        className="h-full overflow-hidden font-body"
        style={{ background: 'var(--paper)', color: 'var(--ink-body)' }}
      >
        {children}
      </body>
    </html>
  )
}
