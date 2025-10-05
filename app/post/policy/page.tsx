import Link from 'next/link'

export const metadata = {
  title: '医療政策 - Fuyuto Web',
  description: '診療報酬改定、中医協の議論、地域医療構想、医療保険制度の変遷など、医療政策の最新動向を追います。',
}

// Mock data
const mockPosts = [
  {
    slug: 'test-article',
    title: 'テスト記事：2026年診療報酬改定の全体像',
    summary: '2026年の診療報酬改定に向けた議論が本格化しています。',
    publishAt: new Date('2025-10-01'),
    tags: ['診療報酬', '中医協'],
  },
]

export default function PolicyPage() {
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

        {/* Posts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {mockPosts.map((post) => (
            <Link
              key={post.slug}
              href={`/post/${post.slug}`}
              className="bg-white border rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="p-6">
                <div className="flex items-center gap-2 text-xs text-neutral-500 mb-3">
                  <span className="text-blue-600">{post.publishAt.toLocaleDateString('ja-JP')}</span>
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
        {mockPosts.length === 0 && (
          <div className="text-center py-16">
            <p className="text-neutral-500">記事がまだありません。</p>
          </div>
        )}
      </div>
    </main>
  )
}
