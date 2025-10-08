import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyApiKey } from '@/lib/api-auth'
import { generateHeaderImage } from '@/lib/image-generator'

// POST: 新規記事作成
export async function POST(req: NextRequest) {
  try {
    // Verify API key and get creator info
    const apiKeyInfo = await verifyApiKey(req)
    if (!apiKeyInfo) {
      return NextResponse.json(
        { error: 'Invalid or missing API key' },
        { status: 401 }
      )
    }

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

    // Validate required fields
    if (!slug || !title || !postBody || !category) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Determine createdBy: use API key's createdBy, or fallback to API key name
    const createdBy = apiKeyInfo.createdBy || apiKeyInfo.name

    // Auto-generate header image if not provided and feature is enabled
    let finalHeaderImageUrl = headerImageUrl || null
    if (!finalHeaderImageUrl) {
      const settings = await db.siteSettings.findUnique({
        where: { id: 1 },
        select: { autoGenerateImages: true }
      })

      if (settings?.autoGenerateImages) {
        console.log('Auto-generating header image with 2-stage flow (Claude + Gemini)...')
        const generatedUrl = await generateHeaderImage(title, summary, postBody)
        if (generatedUrl) {
          finalHeaderImageUrl = generatedUrl
          console.log('Header image generated successfully:', generatedUrl)
        } else {
          console.warn('Failed to generate header image, proceeding without one')
        }
      }
    }

    const post = await db.post.create({
      data: {
        slug,
        title,
        summary: summary || null,
        body: postBody,
        category,
        tags: tags || [],
        status: status || 'draft',
        publishAt: publishAt ? new Date(publishAt) : null,
        headerImageUrl: finalHeaderImageUrl,
        paywallEnabled: paywallEnabled ?? false,
        freeMode: freeMode || 'chars',
        freeChars: freeChars ?? 300,
        freeSections: freeSections ?? 0,
        sourceUrls: sourceUrls || [],
        isFeatured: isFeatured ?? false,
        featuredOrder: featuredOrder ?? null,
        createdBy, // Auto-set createdBy from API key
      }
    })

    return NextResponse.json(post, { status: 201 })
  } catch (error) {
    console.error('Post creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create post' },
      { status: 500 }
    )
  }
}
