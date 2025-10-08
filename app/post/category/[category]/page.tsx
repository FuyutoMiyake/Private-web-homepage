import { db } from '@/lib/db'
import Link from 'next/link'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'

// ISR: 1時間ごとに再生成
export const revalidate = 3600

const POSTS_PER_PAGE = 20

const categories = [
  { key: 'all', label: 'すべて' },
  { key: 'policy', label: '医療政策' },
  { key: 'dx', label: '実装（医療DX）' },
  { key: 'ai', label: 'AI・データ活用' }
]

// 静的に生成するカテゴリを指定
export async function generateStaticParams() {
  return [
    { category: 'policy' },
    { category: 'dx' },
    { category: 'ai' }
  ]
}

// 動的メタデータ
export async function generateMetadata({
  params
}: {
  params: { category: string }
}): Promise<Metadata> {
  const category = categories.find((c) => c.key === params.category)
  const categoryLabel = category?.label || '記事一覧'

  return {
    title: `${categoryLabel} - Fuyuto Web`,
    description: `${categoryLabel}に関する記事一覧`
  }
}

export default async function CategoryPostListPage({
  params
}: {
  params: { category: string }
}) {
  const categoryFilter = params.category

  // 有効なカテゴリか確認
  if (!['policy', 'dx', 'ai'].includes(categoryFilter)) {
    notFound()
  }

  const currentPage = 1
  const skip = (currentPage - 1) * POSTS_PER_PAGE

  // 総記事数を取得
  const totalCount = await db.post.count({
    where: {
      status: 'published',
      category: categoryFilter
    }
  })

  const totalPages = Math.ceil(totalCount / POSTS_PER_PAGE)

  // ページネーション付きで記事を取得
  const posts = await db.post.findMany({
    where: {
      status: 'published',
      category: categoryFilter
    },
    orderBy: { publishAt: 'desc' },
    select: {
      slug: true,
      title: true,
      summary: true,
      category: true,
      tags: true,
      publishAt: true
    },
    skip,
    take: POSTS_PER_PAGE
  })

  // URLヘルパー関数
  const getPageUrl = (page: number, cat: string) => {
    if (cat === 'all') {
      if (page === 1) return '/post'
      return `/post/page/${page}`
    }
    if (page === 1) return `/post/category/${cat}`
    return `/post/category/${cat}/page/${page}`
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">記事一覧</h1>

      {/* Category Tabs */}
      <div className="mb-8 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {categories.map((cat) => (
            <Link
              key={cat.key}
              href={cat.key === 'all' ? '/post' : `/post/category/${cat.key}`}
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-12 flex justify-center items-center gap-2">
          {/* 前へボタン */}
          {currentPage > 1 ? (
            <Link
              href={getPageUrl(currentPage - 1, categoryFilter)}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              前へ
            </Link>
          ) : (
            <span className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-400 cursor-not-allowed">
              前へ
            </span>
          )}

          {/* ページ番号 */}
          <div className="flex gap-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
              // 最初の2ページ、最後の2ページ、現在のページ周辺3ページのみ表示
              const showPage =
                page <= 2 ||
                page > totalPages - 2 ||
                (page >= currentPage - 1 && page <= currentPage + 1)

              if (!showPage) {
                // 省略記号を表示（連続しないように）
                const prevPage = page - 1
                const prevShowPage =
                  prevPage <= 2 ||
                  prevPage > totalPages - 2 ||
                  (prevPage >= currentPage - 1 && prevPage <= currentPage + 1)

                if (!prevShowPage) {
                  return (
                    <span key={page} className="px-2 py-2 text-gray-400">
                      ...
                    </span>
                  )
                }
                return null
              }

              return (
                <Link
                  key={page}
                  href={getPageUrl(page, categoryFilter)}
                  className={`px-4 py-2 rounded-md text-sm font-medium ${
                    page === currentPage
                      ? 'bg-blue-600 text-white'
                      : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </Link>
              )
            })}
          </div>

          {/* 次へボタン */}
          {currentPage < totalPages ? (
            <Link
              href={getPageUrl(currentPage + 1, categoryFilter)}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              次へ
            </Link>
          ) : (
            <span className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-400 cursor-not-allowed">
              次へ
            </span>
          )}
        </div>
      )}

      {/* 記事数表示 */}
      {totalCount > 0 && (
        <div className="mt-4 text-center text-sm text-gray-500">
          全{totalCount}件中 {skip + 1}〜{Math.min(skip + POSTS_PER_PAGE, totalCount)}件を表示
        </div>
      )}
    </div>
  )
}
