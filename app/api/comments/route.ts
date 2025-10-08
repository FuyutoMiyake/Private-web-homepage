import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkRateLimit } from '@/lib/kv'
import { verifyTurnstile, shouldVerifyCaptcha } from '@/lib/captcha'
import { checkIdempotencyKey, cacheIdempotencyResult } from '@/lib/idempotency'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
  try {
    // Idempotency Key チェック
    const idempotencyKey = req.headers.get('idempotency-key')
    if (idempotencyKey) {
      const { cached, result } = await checkIdempotencyKey(idempotencyKey)
      if (cached) {
        return NextResponse.json(result, { status: result.status || 201 })
      }
    }

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'

    // Rate Limit: 5件/10分/IP
    const rateLimitOk = await checkRateLimit(`rate:comment:${ip}`, 5, 600)
    if (!rateLimitOk) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }

    const body = await req.json()
    const { postId, authorName, authorEmail, body: commentBody, turnstileToken } = body

    // バリデーション
    if (!postId || !commentBody) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (commentBody.length < 1 || commentBody.length > 5000) {
      return NextResponse.json(
        { error: 'Comment body must be between 1 and 5000 characters' },
        { status: 400 }
      )
    }

    // Turnstile検証
    if (shouldVerifyCaptcha()) {
      if (!turnstileToken) {
        return NextResponse.json(
          { error: 'CAPTCHA token is required' },
          { status: 400 }
        )
      }

      const valid = await verifyTurnstile(turnstileToken)
      if (!valid) {
        return NextResponse.json(
          { error: 'CAPTCHA verification failed' },
          { status: 403 }
        )
      }
    }

    // 記事が存在するか確認
    const post = await db.post.findUnique({
      where: { id: postId },
      select: { id: true, status: true }
    })

    if (!post || post.status !== 'published') {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }

    // サイト設定取得（承認制 or 即時公開）
    const settings = await db.siteSettings.findUnique({ where: { id: 1 } })
    const initialStatus = settings?.commentMode === 'post_moderation' ? 'approved' : 'pending'

    // IPハッシュ化（プライバシー保護）
    const ipHash = crypto.createHash('sha256').update(ip).digest('hex').slice(0, 16)

    // コメント作成
    const comment = await db.comment.create({
      data: {
        postId,
        authorName: authorName || '匿名',
        authorEmail: authorEmail || null,
        body: commentBody,
        status: initialStatus,
        ipHash
      }
    })

    const responseData = {
      id: comment.id,
      status: comment.status,
      message: initialStatus === 'approved'
        ? 'Comment posted successfully'
        : 'Comment submitted for approval'
    }

    // Idempotency Key キャッシュ
    if (idempotencyKey) {
      await cacheIdempotencyResult(idempotencyKey, responseData)
    }

    return NextResponse.json(responseData, { status: 201 })
  } catch (error) {
    console.error('Comment creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// コメント一覧取得（公開されたコメントのみ）
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const postId = searchParams.get('postId')

  if (!postId) {
    return NextResponse.json(
      { error: 'postId is required' },
      { status: 400 }
    )
  }

  const comments = await db.comment.findMany({
    where: {
      postId,
      status: 'approved'
    },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      authorName: true,
      body: true,
      createdAt: true
    }
  })

  return NextResponse.json({ comments })
}
