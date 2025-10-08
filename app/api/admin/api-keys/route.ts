import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { generateApiKey } from '@/lib/api-auth'

/**
 * GET /api/admin/api-keys
 * List all API keys
 */
export async function GET(req: NextRequest) {
  try {
    const apiKeys = await db.apiKey.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        key: true,
        isActive: true,
        createdAt: true,
        lastUsedAt: true,
        usageCount: true,
      },
    })

    return NextResponse.json({ apiKeys })
  } catch (error) {
    console.error('List API keys error:', error)
    return NextResponse.json({ error: 'Failed to list API keys' }, { status: 500 })
  }
}

/**
 * POST /api/admin/api-keys
 * Create a new API key
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name } = body

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    // Generate unique API key
    const key = generateApiKey()

    // Create API key
    const apiKey = await db.apiKey.create({
      data: {
        name: name.trim(),
        key,
      },
      select: {
        id: true,
        name: true,
        key: true,
        isActive: true,
        createdAt: true,
        lastUsedAt: true,
        usageCount: true,
      },
    })

    return NextResponse.json(apiKey, { status: 201 })
  } catch (error) {
    console.error('Create API key error:', error)
    return NextResponse.json({ error: 'Failed to create API key' }, { status: 500 })
  }
}

/**
 * PATCH /api/admin/api-keys
 * Update API key status
 */
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, isActive } = body

    if (!id || typeof isActive !== 'boolean') {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 })
    }

    const apiKey = await db.apiKey.update({
      where: { id },
      data: { isActive },
      select: {
        id: true,
        name: true,
        isActive: true,
      },
    })

    return NextResponse.json(apiKey)
  } catch (error) {
    console.error('Update API key error:', error)
    return NextResponse.json({ error: 'Failed to update API key' }, { status: 500 })
  }
}

/**
 * DELETE /api/admin/api-keys
 * Delete an API key
 */
export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json()
    const { id } = body

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    await db.apiKey.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete API key error:', error)
    return NextResponse.json({ error: 'Failed to delete API key' }, { status: 500 })
  }
}
