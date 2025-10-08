import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getPreviewText } from '@/lib/paywall'
import { excerptFromPreview } from '@/lib/excerpt'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const limit = parseInt(searchParams.get('limit') || '20')
  const category = searchParams.get('category')

  const posts = await db.post.findMany({
    where: {
      status: 'published',
      category: category || undefined,
    },
    orderBy: { publishAt: 'desc' },
    take: limit,
    select: {
      id: true,
      slug: true,
      title: true,
      summary: true,
      category: true,
      tags: true,
      publishAt: true,
      isFeatured: true,
      body: true, // Need body to generate preview text
    },
  })

  const results = posts.map((post) => {
    const fullPost = { ...post, ...getPostDefaults() } as any
    const previewText = getPreviewText(fullPost)
    const excerpt = post.summary || excerptFromPreview(previewText, 120)

    return {
      id: post.id,
      slug: post.slug,
      title: post.title,
      summary: post.summary,
      excerpt,
      category: post.category,
      tags: post.tags,
      publishAt: post.publishAt,
      isFeatured: post.isFeatured,
    }
  })

  return NextResponse.json({ results, total: results.length })
}

function getPostDefaults() {
  return {
    paywallEnabled: false,
    freeMode: 'marker',
    freeChars: null,
    freeSections: null,
    priceJpy: null,
    isSubscriptionExempt: false,
    featuredOrder: null,
    featuredUntil: null,
    searchVector: null,
    sourceUrls: [],
    createdBy: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    status: 'published',
  }
}
