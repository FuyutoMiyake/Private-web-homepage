import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// DELETE: 記事削除
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await db.post.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Post deletion error:', error)
    return NextResponse.json(
      { error: 'Failed to delete post' },
      { status: 500 }
    )
  }
}

// PUT: 記事更新
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json()
    const {
      slug,
      title,
      summary,
      body: postBody,
      category,
      tags,
      status,
      publishAt,
      headerImageUrl,
      paywallEnabled,
      freeMode,
      freeChars,
      freeSections,
      sourceUrls,
      isFeatured,
      featuredOrder
    } = body

    const post = await db.post.update({
      where: { id: params.id },
      data: {
        slug,
        title,
        summary: summary || null,
        body: postBody,
        category,
        tags: tags || [],
        status,
        publishAt: publishAt ? new Date(publishAt) : null,
        headerImageUrl: headerImageUrl || null,
        paywallEnabled: paywallEnabled ?? false,
        freeMode: freeMode || 'chars',
        freeChars: freeChars ?? 300,
        freeSections: freeSections ?? 0,
        sourceUrls: sourceUrls || [],
        isFeatured: isFeatured ?? false,
        featuredOrder: featuredOrder ?? null
      }
    })

    return NextResponse.json(post)
  } catch (error) {
    console.error('Post update error:', error)
    return NextResponse.json(
      { error: 'Failed to update post' },
      { status: 500 }
    )
  }
}
