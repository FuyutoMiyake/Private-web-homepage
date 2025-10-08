import { db } from '@/lib/db'
import Link from 'next/link'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: '記事一覧 - Fuyuto Web',
  description: '医療政策・医療DX・AI活用に関する記事一覧'
}

export default async function PostListPage({
  searchParams
}: {
  searchParams: { category?: string }
}) {
  const categoryFilter = searchParams.category || 'all'

  const posts = await db.post.findMany({
    where: {
      status: 'published',
      ...(categoryFilter !== 'all' && { category: categoryFilter })
    },
    orderBy: { publishAt: 'desc' },
    select: {
      slug: true,
      title: true,
      summary: true,
      category: true,
      tags: true,
      publishAt: true
    }
  })

  const categories = [
    { key: 'all', label: 'すべて' },
    { key: 'policy', label: '医療政策' },
    { key: 'dx', label: '実装（医療DX）' },
    { key: 'ai', label: 'AI・データ活用' }
  ]

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">記事一覧</h1>

      {/* Category Tabs */}
      <div className="mb-8 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {categories.map((cat) => (
            <Link
              key={cat.key}
              href={cat.key === 'all' ? '/post' : `/post?category=${cat.key}`}
              className={`
                whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm
                ${
                  categoryFilter === cat.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              {cat.label}
            </Link>
          ))}
        </nav>
      </div>

      {/* Posts List */}
      <div className="space-y-8">
        {posts.length === 0 ? (
          <p className="text-gray-500 text-center py-8">記事がありません</p>
        ) : (
          posts.map((post) => (
            <article
              key={post.slug}
              className="border-b border-gray-200 pb-8 last:border-b-0"
            >
              <div className="mb-2">
                <span className="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                  {post.category === 'policy'
                    ? '医療政策'
                    : post.category === 'dx'
                    ? '実装（医療DX）'
                    : 'AI・データ活用'}
                </span>
                <span className="ml-3 text-sm text-gray-500">
                  {post.publishAt
                    ? new Date(post.publishAt).toLocaleDateString('ja-JP')
                    : ''}
                </span>
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                <Link
                  href={`/post/${post.slug}`}
                  className="hover:text-blue-600 transition-colors"
                >
                  {post.title}
                </Link>
              </h2>

              {post.summary && (
                <p className="text-gray-600 mb-3 line-clamp-2">{post.summary}</p>
              )}

              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag) => (
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
  )
}
