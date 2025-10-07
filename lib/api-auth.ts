import { NextRequest } from 'next/server'
import { db } from './db'

export type ApiKeyInfo = {
  id: string
  name: string
  createdBy: string | null
}

/**
 * Verify API key from request header
 * @param req NextRequest object
 * @returns API key info if valid, null otherwise
 */
export async function verifyApiKey(req: NextRequest): Promise<ApiKeyInfo | null> {
  const apiKey = req.headers.get('x-api-key')

  if (!apiKey) {
    return null
  }

  try {
    // Find API key in database
    const key = await db.apiKey.findUnique({
      where: { key: apiKey },
      select: {
        id: true,
        name: true,
        createdBy: true,
        isActive: true,
      },
    })

    if (!key || !key.isActive) {
      return null
    }

    // Update usage stats (fire and forget)
    db.apiKey
      .update({
        where: { id: key.id },
        data: {
          lastUsedAt: new Date(),
          usageCount: { increment: 1 },
        },
      })
      .catch((error) => {
        console.error('Failed to update API key usage:', error)
      })

    return {
      id: key.id,
      name: key.name,
      createdBy: key.createdBy,
    }
  } catch (error) {
    console.error('API key verification error:', error)
    return null
  }
}

/**
 * Generate a random API key
 * Format: blog_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx (36 chars total)
 */
export function generateApiKey(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  const length = 32
  let result = 'blog_'

  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }

  return result
}
