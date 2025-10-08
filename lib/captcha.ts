/**
 * Cloudflare Turnstile (CAPTCHA) utilities
 */

export function shouldVerifyCaptcha(): boolean {
  return process.env.NODE_ENV === 'production' && process.env.E2E_TEST_MODE !== 'true'
}

export function getTurnstileSitekey(): string {
  if (process.env.E2E_TEST_MODE === 'true') {
    return '1x00000000000000000000AA' // Cloudflare公式テストキー
  }
  return process.env.NEXT_PUBLIC_TURNSTILE_SITEKEY || '1x00000000000000000000AA'
}

export async function verifyTurnstile(token: string): Promise<boolean> {
  if (!shouldVerifyCaptcha()) {
    return true // 開発環境・テスト環境では常に許可
  }

  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        secret: process.env.TURNSTILE_SECRET,
        response: token
      })
    })

    const data = await response.json()
    return data.success === true
  } catch (error) {
    console.error('Turnstile verification error:', error)
    return false
  }
}
