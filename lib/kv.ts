import { kv } from '@vercel/kv'

/**
 * レート制限チェック
 * @param key - 一意のキー（例: "rate:comment:192.168.1.1"）
 * @param limit - 制限回数
 * @param windowSec - 時間窓（秒）
 * @returns true: 許可, false: 制限超過
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowSec: number
): Promise<boolean> {
  // ローカル開発時は KV が利用不可の場合があるので常に許可
  if (process.env.NODE_ENV === 'development' && !process.env.KV_URL) {
    return true
  }

  try {
    const count = await kv.incr(key)

    if (count === 1) {
      await kv.expire(key, windowSec)
    }

    return count <= limit
  } catch (error) {
    console.error('Rate limit check failed:', error)
    return true // エラー時は許可（サービス継続優先）
  }
}
