'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'

type SearchResult = {
  id: string
  slug: string
  title: string
  summary: string | null
  category: string
  tags: string[]
  publishAt: string | null
  type: string
  rank: number | null
}

export default function SearchPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const queryFromUrl = searchParams.get('q') || ''

  const [query, setQuery] = useState(queryFromUrl)
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  useEffect(() => {
    if (queryFromUrl) {
      performSearch(queryFromUrl)
    }
  }, [queryFromUrl])

  const performSearch = async (searchQuery: string) => {
    if (!searchQuery || searchQuery.length < 2) {
      setResults([])
      setSearched(false)
      return
    }

    setLoading(true)
    setSearched(true)

    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`)
      const data = await res.json()
      setResults(data.results || [])
    } catch (error) {
      console.error('Search error:', error)
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query)}`)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">検索</h1>

      {/* Search Form */}
      <form onSubmit={handleSubmit} className="mb-8">
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="記事を検索..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? '検索中...' : '検索'}
          </button>
        </div>
      </form>

      {/* Results */}
      {searched && (
        <div>
          <p className="text-sm text-gray-600 mb-4">
            {results.length}件の記事が見つかりました
          </p>

          <div className="space-y-6">
            {results.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                検索結果が見つかりませんでした
              </p>
            ) : (
              results.map((result) => (
                <article
                  key={result.id}
                  className="border-b border-gray-200 pb-6 last:border-b-0"
                >
                  <div className="mb-2">
                    <span className="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                      {result.category === 'policy'
                        ? '医療政策'
                        : result.category === 'dx'
                        ? '実装（医療DX）'
                        : 'AI・データ活用'}
                    </span>
                    {result.publishAt && (
                      <span className="ml-3 text-sm text-gray-500">
                        {new Date(result.publishAt).toLocaleDateString('ja-JP')}
                      </span>
                    )}
                  </div>

                  <h2 className="text-xl font-bold text-gray-900 mb-2">
                    <Link
                      href={`/post/${result.slug}`}
                      className="hover:text-blue-600 transition-colors"
                    >
                      {result.title}
                    </Link>
                  </h2>

                  {result.summary && (
                    <p className="text-gray-600 mb-3 line-clamp-2">
                      {result.summary}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {result.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </article>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
