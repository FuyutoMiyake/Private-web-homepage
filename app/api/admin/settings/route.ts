import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// PUT: サイト設定更新
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      siteTitle,
      snsTwitter,
      snsLinkedin,
      paywallDefaultMode,
      commentMode
    } = body

    const settings = await db.siteSettings.upsert({
      where: { id: 1 },
      update: {
        siteTitle,
        snsTwitter,
        snsLinkedin,
        paywallDefaultMode,
        commentMode
      },
      create: {
        id: 1,
        siteTitle,
        snsTwitter,
        snsLinkedin,
        paywallDefaultMode,
        commentMode
      }
    })

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Settings update error:', error)
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    )
  }
}
