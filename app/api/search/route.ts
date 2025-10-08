import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q') || ''
  const limit = parseInt(searchParams.get('limit') || '20', 10)

  if (q.length < 2) {
    return NextResponse.json({ results: [], total: 0, query: q })
  }

  // クエリのサニタイズ（記号を除去、空白で正規化）
  const sanitized = q.replace(/[^\w\s\u3000-\u9fff]/g, ' ').trim()

  if (!sanitized) {
    return NextResponse.json({ results: [], total: 0, query: q })
  }

  // tsqueryフォーマット（単語をANDで結合）
  const tsquery = sanitized.split(/\s+/).join(' & ')

  try {
    // PostgreSQL全文検索 + 部分一致 + タグ一致
    const posts = await db.$queryRaw<
      Array<{
        id: string
        slug: string
        title: string
        summary: string | null
        category: string
        tags: string[]
        publishAt: Date | null
        type: string
        rank: number
      }>
    >`
      SELECT
        id, slug, title, summary, category, tags, "publishAt",
        'post' as type,
        ts_rank("searchVector", to_tsquery('simple', ${tsquery})) AS rank
      FROM "Post"
      WHERE
        status = 'published'
        AND (
          "searchVector" @@ to_tsquery('simple', ${tsquery})
          OR title ILIKE ${`%${sanitized}%`}
          OR ${sanitized} = ANY(tags)
        )
      ORDER BY rank DESC, "publishAt" DESC
      LIMIT ${limit}
    `

    return NextResponse.json({
      results: posts,
      total: posts.length,
      query: q
    })
  } catch (error) {
    console.error('Search error:', error)

    // フォールバック: シンプルなタイトル検索のみ
    const fallbackPosts = await db.post.findMany({
      where: {
        status: 'published',
        title: {
          contains: sanitized,
          mode: 'insensitive'
        }
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
        publishAt: true
      }
    })

    return NextResponse.json({
      results: fallbackPosts.map(p => ({ ...p, type: 'post', rank: 0 })),
      total: fallbackPosts.length,
      query: q
    })
  }
}
