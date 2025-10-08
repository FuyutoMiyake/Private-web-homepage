import { NextRequest, NextResponse } from 'next/server'

/**
 * Basic認証ミドルウェア
 * /admin配下のルートを保護
 */
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // /admin配下のルートのみ保護
  if (pathname.startsWith('/admin')) {
    // 開発環境ではBasic認証をスキップ
    if (process.env.NODE_ENV === 'development' && !process.env.ADMIN_PASSWORD) {
      return NextResponse.next()
    }

    const authHeader = req.headers.get('authorization')

    if (!authHeader) {
      return new NextResponse('Authentication required', {
        status: 401,
        headers: {
          'WWW-Authenticate': 'Basic realm="Admin Area"'
        }
      })
    }

    const auth = authHeader.split(' ')[1]
    const [user, pwd] = Buffer.from(auth, 'base64').toString().split(':')

    const validUser = process.env.ADMIN_USERNAME || 'admin'
    const validPassword = process.env.ADMIN_PASSWORD || ''

    if (user === validUser && pwd === validPassword) {
      return NextResponse.next()
    }

    return new NextResponse('Invalid credentials', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="Admin Area"'
      }
    })
  }

  return NextResponse.next()
}

export const config = {
  matcher: '/admin/:path*'
}
