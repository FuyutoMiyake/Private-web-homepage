import Link from 'next/link'
import { db } from '@/lib/db'

export const metadata = {
  title: '医療政策 - Fuyuto Web',
  description: '診療報酬改定、中医協の議論、地域医療構想、医療保険制度の変遷など、医療政策の最新動向を追います。',
}

export default async function PolicyPage() {
  // Fetch posts with category 'policy'
  const rawPosts = await db.post.findMany({
    where: {
      category: 'policy',
      status: 'published',
    },
    orderBy: { publishAt: 'desc' },
    select: {
      slug: true,
      title: true,
      summary: true,
      publishAt: true,
      tags: true,
      isFeatured: true,
    },
  })

  // Serialize dates
  const posts = rawPosts.map((post) => ({
    ...post,
    publishAt: post.publishAt ? post.publishAt : null,
  }))

  const featuredPosts = posts.filter((p) => p.isFeatured).slice(0, 2)
  const otherPosts = posts.filter((p) => !p.isFeatured)

  const formatDate = (date: Date | null) => {
    if (!date) return ''
    return new Date(date).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return (
    <main className="bg-neutral-50 py-12">
      <div className="max-w-[1280px] mx-auto px-8">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-neutral-900 mb-4">医療政策</h1>
          <p className="text-lg text-neutral-600 max-w-3xl">
            診療報酬改定、中医協の議論、地域医療構想、医療保険制度の変遷など、医療政策の最新動向を追います。
          </p>
        </div>

        {/* Featured Posts */}
        {featuredPosts.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-neutral-900 mb-6">注目記事</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {featuredPosts.map((post) => (
                <Link
                  key={post.slug}
                  href={`/post/${post.slug}`}
                  className="bg-white border rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div className="p-6">
                    <div className="flex items-center gap-2 text-xs text-neutral-500 mb-3">
                      <span className="text-blue-600">{formatDate(post.publishAt)}</span>
                      <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">注目</span>
                    </div>
                    <h3 className="text-lg font-bold text-neutral-900 mb-2 leading-snug hover:text-neutral-600 transition-colors">
                      {post.title}
                    </h3>
                    <p className="text-sm text-neutral-600 mb-4 line-clamp-2">{post.summary}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {post.tags.map((tag) => (
                        <span key={tag} className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-neutral-100 text-neutral-700">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* All Posts */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-neutral-900 mb-6">記事一覧</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {otherPosts.map((post) => (
            <Link
              key={post.slug}
              href={`/post/${post.slug}`}
              className="bg-white border rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="p-6">
                <div className="flex items-center gap-2 text-xs text-neutral-500 mb-3">
                  <span className="text-blue-600">{formatDate(post.publishAt)}</span>
                </div>
                <h3 className="text-lg font-bold text-neutral-900 mb-2 leading-snug hover:text-neutral-600 transition-colors">
                  {post.title}
                </h3>
                <p className="text-sm text-neutral-600 mb-4 line-clamp-2">{post.summary}</p>
                <div className="flex flex-wrap gap-1.5">
                  {post.tags.map((tag) => (
                    <span key={tag} className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-neutral-100 text-neutral-700">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Empty State */}
        {posts.length === 0 && (
          <div className="text-center py-16">
            <p className="text-neutral-500">医療政策の記事はまだありません。</p>
          </div>
        )}
      </div>
    </main>
  )
}
