import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { split } from '@/lib/paywall'
import { excerptFromPreview } from '@/lib/excerpt'

export const dynamic = 'force-dynamic'
export const revalidate = 3600

export async function GET() {
  const posts = await db.post.findMany({
    where: { status: 'published' },
    orderBy: { publishAt: 'desc' },
    take: 20,
    select: {
      slug: true,
      title: true,
      body: true,
      publishAt: true,
      createdAt: true,
      paywallEnabled: true,
      freeMode: true,
      freeChars: true,
      freeSections: true
    }
  })

  const items = posts.map(post => {
    const { preview } = split(post as any)

    // Markdownを除去してプレーンテキストに変換
    const plainText = preview
      .replace(/^#+\s+/gm, '') // 見出し
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // リンク
      .replace(/[*_]{1,2}([^*_]+)[*_]{1,2}/g, '$1') // 強調
      .replace(/`([^`]+)`/g, '$1') // コード
      .replace(/<!--[\s\S]*?-->/g, '') // HTMLコメント
      .trim()

    const description = excerptFromPreview(plainText, 200)
    const pubDate = (post.publishAt || post.createdAt).toUTCString()
    const url = `${process.env.NEXT_PUBLIC_SITE_URL}/post/${post.slug}`

    return `
      <item>
        <title><![CDATA[${post.title}]]></title>
        <link>${url}</link>
        <description><![CDATA[${description}]]></description>
        <pubDate>${pubDate}</pubDate>
        <guid isPermaLink="true">${url}</guid>
      </item>
    `.trim()
  }).join('\n    ')

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Fuyuto Web</title>
    <link>${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}</link>
    <description>医療政策・医療DXの最新ニュース</description>
    <language>ja</language>
    <atom:link href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/rss.xml" rel="self" type="application/rss+xml" />
    ${items}
  </channel>
</rss>`

  return new NextResponse(rss, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600' // 1時間キャッシュ
    }
  })
}
