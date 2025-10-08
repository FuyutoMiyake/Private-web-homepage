import { Post } from '@prisma/client'
import { split } from '@/lib/paywall'

/**
 * NewsArticle 構造化データを生成
 * ペイウォール記事の場合は isAccessibleForFree: false と hasPart を設定
 */
export function buildNewsArticleSchema(post: Post) {
  const { preview } = split(post)
  const isPaywalled = post.paywallEnabled

  const baseSchema = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: post.title,
    description: post.summary || '',
    datePublished: post.publishAt?.toISOString() || post.createdAt.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    author: {
      '@type': 'Organization',
      name: 'Fuyuto Web',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Fuyuto Web',
      url: process.env.NEXT_PUBLIC_SITE_URL || 'https://www.ryukke.com',
    },
    isAccessibleForFree: !isPaywalled,
  }

  // ペイウォールがある場合、無料プレビュー部分を明示
  if (isPaywalled) {
    return {
      ...baseSchema,
      hasPart: {
        '@type': 'WebPageElement',
        isAccessibleForFree: true,
        cssSelector: '.article-preview',
      },
    }
  }

  return baseSchema
}

/**
 * BreadcrumbList 構造化データを生成
 */
export function buildBreadcrumbSchema(post: Post) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.ryukke.com'

  // カテゴリ表示名のマッピング
  const categoryNames: Record<string, string> = {
    policy: '医療政策',
    dx: '実装（医療DX）',
    other: 'その他',
  }

  const categoryName = categoryNames[post.category] || post.category

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: baseUrl,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: '記事',
        item: `${baseUrl}/post`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: categoryName,
        item: `${baseUrl}/post/${post.category}`,
      },
      {
        '@type': 'ListItem',
        position: 4,
        name: post.title,
      },
    ],
  }
}
