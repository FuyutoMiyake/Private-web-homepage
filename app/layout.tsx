import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Suspense } from 'react'
import './globals.css'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { GoogleAnalytics } from '@/components/analytics/GoogleAnalytics'
import { CookieConsent } from '@/components/analytics/CookieConsent'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '医療DX × 政策 × AI - Fuyuto Web',
  description: 'データと制度をつなぎ、現場から変える。医療の未来をつくる医師が発信する、政策・DX・AIの交差点。',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body className={inter.className}>
        <Suspense fallback={null}>
          <GoogleAnalytics />
        </Suspense>
        <div className="max-w-[1440px]" style={{ marginLeft: 'auto', marginRight: 'auto' }}>
          <Header />
          {children}
          <Footer />
        </div>
        <CookieConsent />
      </body>
    </html>
  )
}
