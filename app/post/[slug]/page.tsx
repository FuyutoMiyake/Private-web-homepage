import { notFound } from 'next/navigation'
import { MDXRemote } from 'next-mdx-remote/rsc'
import Image from 'next/image'
import { db } from '@/lib/db'
import { split } from '@/lib/paywall'
import { MDXComponents } from '@/components/mdx/MDXComponents'
import CommentSection from '@/components/comments/CommentSection'
import { buildNewsArticleSchema, buildBreadcrumbSchema } from '@/lib/seo/structuredData'
import type { Metadata } from 'next'
import rehypeSlug from 'rehype-slug'

type Props = {
  params: { slug: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await db.post.findUnique({
    where: { slug: params.slug },
    select: {
      title: true,
      summary: true,
      tags: true,
      publishAt: true,
      headerImageUrl: true,
    },
  })

  if (!post) return {}

  const description = post.summary || `${post.tags.join(', ')}に関する記事`

  return {
    title: `${post.title} - Fuyuto Web`,
    description,
    openGraph: {
      title: post.title,
      description,
      type: 'article',
      publishedTime: post.publishAt?.toISOString(),
      tags: post.tags,
      images: post.headerImageUrl ? [post.headerImageUrl] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description,
      images: post.headerImageUrl ? [post.headerImageUrl] : undefined,
    },
  }
}

export default async function PostDetailPage({ params }: Props) {
  const post = await db.post.findUnique({
    where: { slug: params.slug },
  })

  if (!post) {
    notFound()
  }

  const { preview, paid } = split(post)
  const hasPaidContent = paid.length > 0

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'policy':
        return '医療政策'
      case 'dx':
        return '医療DX'
      default:
        return 'その他'
    }
  }

  const formatDate = (date: Date | null) => {
    if (!date) return ''
    return new Date(date).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  // Structured Data for SEO (NewsArticle + Breadcrumb schema)
  const newsArticleSchema = buildNewsArticleSchema(post as any)
  const breadcrumbSchema = buildBreadcrumbSchema(post as any)

  return (
    <>
      {/* NewsArticle Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(newsArticleSchema) }}
      />
      {/* Breadcrumb Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <main className="bg-neutral-50 py-12">
        <article className="max-w-3xl mx-auto px-4">
          {/* Category Badge */}
          <div className="mb-4">
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-neutral-100 text-neutral-700">
              {getCategoryLabel(post.category)}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-4xl font-bold mb-4 text-neutral-900">{post.title}</h1>

          {/* Meta Info */}
          <div className="flex items-center gap-4 text-sm text-neutral-600 mb-8">
            <span className="text-blue-600">{formatDate(post.publishAt)}</span>
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

          {/* Header Image */}
          {post.headerImageUrl && (
            <div className="mb-8 rounded-lg overflow-hidden">
              <Image
                src={post.headerImageUrl}
                alt={post.title}
                width={1200}
                height={630}
                className="w-full h-auto object-cover"
                priority
              />
            </div>
          )}

          {/* Summary */}
          {post.summary && (
            <div className="bg-neutral-100 border-l-4 border-neutral-900 p-4 mb-8">
              <p className="text-neutral-700">{post.summary}</p>
            </div>
          )}

          {/* Source URLs */}
          {post.sourceUrls.length > 0 && (
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-8">
              <h3 className="text-sm font-semibold text-blue-900 mb-2">参考情報</h3>
              <ul className="space-y-1">
                {post.sourceUrls.map((url, index) => (
                  <li key={index}>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      {url}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Preview Content (MDX) - cssSelector for structured data */}
          <div className="article-preview prose prose-neutral max-w-none mb-8">
            <MDXRemote
              source={preview}
              components={MDXComponents}
              options={{
                mdxOptions: {
                  rehypePlugins: [rehypeSlug]
                }
              }}
            />
          </div>

          {/* Paywall */}
          {hasPaidContent && (
            <div className="bg-white border-2 border-neutral-200 rounded-lg p-8 text-center my-8">
              <div className="mb-4">
                <svg
                  className="w-12 h-12 mx-auto text-neutral-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-neutral-900 mb-2">ここから先は有料記事です</h3>
              <p className="text-neutral-600 mb-6">
                この記事の続きを読むには、{post.priceJpy ? `¥${post.priceJpy.toLocaleString()}` : '購入'}
                が必要です
              </p>
              <button className="bg-neutral-900 text-white px-8 py-3 rounded-lg font-semibold hover:bg-neutral-800 transition-colors">
                記事を購入する
              </button>

              {/* Paid content placeholder with data-nosnippet for SEO protection */}
              <div data-nosnippet className="hidden">
                この先は有料会員限定コンテンツです
              </div>
            </div>
          )}

          {/* Paid Content Preview (for demonstration - would be hidden in production) */}
          {hasPaidContent && process.env.NODE_ENV === 'development' && (
            <div data-nosnippet className="bg-red-50 border-2 border-red-200 rounded-lg p-6 my-8">
              <p className="text-sm text-red-600 mb-4">
                ⚠️ 開発モード: 以下は有料コンテンツです(本番環境では非表示)
              </p>
              <div className="prose prose-neutral max-w-none opacity-50">
                <MDXRemote
                  source={paid}
                  components={MDXComponents}
                  options={{
                    mdxOptions: {
                      rehypePlugins: [rehypeSlug]
                    }
                  }}
                />
              </div>
            </div>
          )}

          {/* Comment Section */}
          <CommentSection postId={post.id} />
        </article>
      </main>
    </>
  )
}
