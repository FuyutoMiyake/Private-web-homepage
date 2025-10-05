import { notFound } from 'next/navigation'

// Mock data for now (will connect to database later)
const mockPosts = [
  {
    slug: 'test-article',
    title: 'テスト記事：2026年診療報酬改定の全体像',
    category: 'policy',
    tags: ['診療報酬', '中医協'],
    publishAt: new Date('2025-10-01'),
    summary: '2026年の診療報酬改定に向けた議論が本格化しています。',
    body: `## 診療報酬改定とは

診療報酬改定は、医療機関が提供する医療サービスに対する報酬を見直す制度です。

### 主要なポイント

1. **改定率の決定**
   - 2026年改定の改定率はまだ未定
   - 過去の改定率の推移を参考に予測

2. **重点項目**
   - かかりつけ医機能の強化
   - 地域包括ケアシステムの推進
   - 医療DXの促進

## 今後のスケジュール

- 2025年10月: 中医協での議論開始
- 2025年12月: 改定率決定
- 2026年2月: 答申
- 2026年4月: 施行`,
  },
]

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const post = mockPosts.find((p) => p.slug === params.slug)
  if (!post) return {}

  return {
    title: `${post.title} - Fuyuto Web`,
    description: post.summary,
  }
}

export default function PostDetailPage({ params }: { params: { slug: string } }) {
  const post = mockPosts.find((p) => p.slug === params.slug)

  if (!post) {
    notFound()
  }

  return (
    <main className="bg-neutral-50 py-12">
      <article className="max-w-3xl mx-auto px-4">
        {/* カテゴリバッジ */}
        <div className="mb-4">
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-neutral-100 text-neutral-700">
            {post.category === 'policy' ? '医療政策' : post.category === 'dx' ? '医療DX' : 'その他'}
          </span>
        </div>

        {/* タイトル */}
        <h1 className="text-4xl font-bold mb-4 text-neutral-900">{post.title}</h1>

        {/* メタ情報 */}
        <div className="flex items-center gap-4 text-sm text-neutral-600 mb-8">
          <span className="text-blue-600">{post.publishAt.toLocaleDateString('ja-JP')}</span>
          {post.tags.length > 0 && (
            <>
              <span>•</span>
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <span key={tag} className="px-2 py-0.5 rounded-full text-xs bg-neutral-100 text-neutral-700">
                    {tag}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>

        {/* サマリー */}
        {post.summary && (
          <div className="bg-neutral-100 border-l-4 border-neutral-900 p-4 mb-8">
            <p className="text-neutral-700">{post.summary}</p>
          </div>
        )}

        {/* 本文 */}
        <div className="prose prose-neutral max-w-none">
          {post.body.split('\n\n').map((paragraph, index) => {
            // 見出しの処理
            if (paragraph.startsWith('## ')) {
              return (
                <h2 key={index} className="text-2xl font-bold mt-8 mb-4 text-neutral-900">
                  {paragraph.replace('## ', '')}
                </h2>
              )
            }
            if (paragraph.startsWith('### ')) {
              return (
                <h3 key={index} className="text-xl font-bold mt-6 mb-3 text-neutral-900">
                  {paragraph.replace('### ', '')}
                </h3>
              )
            }
            // リストの処理
            if (paragraph.includes('\n- ') || paragraph.startsWith('- ')) {
              const items = paragraph.split('\n').filter((line) => line.startsWith('- '))
              return (
                <ul key={index} className="list-disc list-inside mb-4 space-y-2">
                  {items.map((item, i) => (
                    <li key={i} className="text-neutral-700">
                      {item.replace('- ', '')}
                    </li>
                  ))}
                </ul>
              )
            }
            // 番号付きリストの処理
            if (/^\d+\./.test(paragraph)) {
              const items = paragraph.split('\n').filter((line) => /^\d+\./.test(line))
              return (
                <ol key={index} className="list-decimal list-inside mb-4 space-y-2">
                  {items.map((item, i) => (
                    <li key={i} className="text-neutral-700">
                      {item.replace(/^\d+\.\s*/, '')}
                    </li>
                  ))}
                </ol>
              )
            }
            // 通常の段落
            return (
              <p key={index} className="mb-4 leading-relaxed text-neutral-700">
                {paragraph}
              </p>
            )
          })}
        </div>
      </article>
    </main>
  )
}
