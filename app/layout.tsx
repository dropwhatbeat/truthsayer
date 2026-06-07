import type { Metadata } from 'next'
import { Caveat, Inter } from 'next/font/google'
import { Providers } from './providers'
import './globals.css'

const caveat = Caveat({
  subsets: ['latin'],
  variable: '--font-caveat',
  weight: ['400', '600', '700'],
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Bullshit Factory',
  description: 'where lies are manufactured',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${caveat.variable} ${inter.variable}`}>
      <body className="font-inter min-h-screen bg-cream"><Providers>{children}</Providers></body>
    </html>
  )
}
