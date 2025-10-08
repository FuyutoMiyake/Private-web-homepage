import { Metadata } from 'next'
import { Suspense } from 'react'

export const metadata: Metadata = {
  title: '検索 - Fuyuto Web',
  description: '医療政策・医療DX・AIに関する記事を検索',
  robots: {
    index: false,
    follow: true,
  },
}

export default function SearchLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <Suspense fallback={<div className="max-w-4xl mx-auto px-4 py-8">Loading...</div>}>{children}</Suspense>
}
