import { kv } from '@vercel/kv'

/**
 * Idempotency Key管理
 * 重複リクエストを防止し、同じ操作が複数回実行されないようにする
 */

const IDEMPOTENCY_TTL = 86400 // 24時間

/**
 * Idempotency Keyをチェックし、キャッシュされた結果があれば返す
 */
export async function checkIdempotencyKey(
  key: string
): Promise<{ cached: boolean; result?: any }> {
  // ローカル開発時は KV が利用不可の場合があるのでスキップ
  if (process.env.NODE_ENV === 'development' && !process.env.KV_URL) {
    return { cached: false }
  }

  try {
    const cachedResult = await kv.get(`idempotency:${key}`)

    if (cachedResult) {
      return { cached: true, result: cachedResult }
    }

    return { cached: false }
  } catch (error) {
    console.error('Idempotency key check failed:', error)
    return { cached: false }
  }
}

/**
 * Idempotency Keyに結果をキャッシュ
 */
export async function cacheIdempotencyResult(
  key: string,
  result: any
): Promise<void> {
  // ローカル開発時は KV が利用不可の場合があるのでスキップ
  if (process.env.NODE_ENV === 'development' && !process.env.KV_URL) {
    return
  }

  try {
    await kv.set(`idempotency:${key}`, result, {
      ex: IDEMPOTENCY_TTL
    })
  } catch (error) {
    console.error('Idempotency key cache failed:', error)
  }
}
