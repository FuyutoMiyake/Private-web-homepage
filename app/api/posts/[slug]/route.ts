import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { split } from '@/lib/paywall'

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const post = await db.post.findUnique({
    where: { slug: params.slug },
  })

  if (!post || post.status !== 'published') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const { preview, paid } = split(post)

  return NextResponse.json({
    id: post.id,
    slug: post.slug,
    title: post.title,
    summary: post.summary,
    category: post.category,
    tags: post.tags,
    publishedAt: post.publishAt,
    previewHtml: preview,
    paywall: {
      enabled: post.paywallEnabled,
      priceJpy: post.priceJpy,
      freeMode: post.freeMode,
      hasPaidContent: paid.length > 0,
    },
    sourceUrls: post.sourceUrls,
  })
}
