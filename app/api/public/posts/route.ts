import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyApiKey } from '@/lib/api-auth'

/**
 * GET /api/public/posts
 * Get published posts (requires API key)
 */
export async function GET(req: NextRequest) {
  // Verify API key
  const apiKeyId = await verifyApiKey(req)
  if (!apiKeyId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category')
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    // Build where clause
    const where: any = {
      status: 'published',
    }

    if (category && category !== 'all') {
      where.category = category
    }

    // Fetch posts
    const posts = await db.post.findMany({
      where,
      orderBy: { publishAt: 'desc' },
      take: limit,
      skip: offset,
      select: {
        id: true,
        slug: true,
        title: true,
        summary: true,
        category: true,
        tags: true,
        publishAt: true,
        priceJpy: true,
      },
    })

    // Get total count
    const total = await db.post.count({ where })

    return NextResponse.json({
      posts,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + posts.length < total,
      },
    })
  } catch (error) {
    console.error('Public API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
