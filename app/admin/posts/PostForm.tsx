'use client'

import { useRouter } from 'next/navigation'
import { useState, FormEvent } from 'react'
import ImageUpload from '@/components/admin/ImageUpload'

type PostFormProps = {
  initialData?: {
    id?: string
    slug: string
    title: string
    summary?: string
    body: string
    category: string
    tags: string[]
    status: string
    publishAt?: string | null
    headerImageUrl?: string | null
    paywallEnabled: boolean
    freeMode: string
    freeChars: number
    freeSections: number
    sourceUrls: string[]
    isFeatured: boolean
    featuredOrder?: number | null
  }
  mode: 'create' | 'edit'
}

export function PostForm({ initialData, mode }: PostFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    slug: initialData?.slug || '',
    title: initialData?.title || '',
    summary: initialData?.summary || '',
    body: initialData?.body || '',
    category: initialData?.category || 'policy',
    tags: initialData?.tags?.join(', ') || '',
    status: initialData?.status || 'draft',
    publishAt: initialData?.publishAt || '',
    headerImageUrl: initialData?.headerImageUrl || '',
    paywallEnabled: initialData?.paywallEnabled ?? false,
    freeMode: initialData?.freeMode || 'chars',
    freeChars: initialData?.freeChars ?? 300,
    freeSections: initialData?.freeSections ?? 0,
    sourceUrls: initialData?.sourceUrls?.join('\n') || '',
    isFeatured: initialData?.isFeatured ?? false,
    featuredOrder: initialData?.featuredOrder ?? 0
  })

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const payload = {
        ...formData,
        tags: formData.tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
        sourceUrls: formData.sourceUrls
          .split('\n')
          .map((u) => u.trim())
          .filter(Boolean),
        freeChars: Number(formData.freeChars),
        freeSections: Number(formData.freeSections),
        featuredOrder: formData.isFeatured ? Number(formData.featuredOrder) : null
      }

      const url =
        mode === 'create'
          ? '/api/admin/posts'
          : `/api/admin/posts/${initialData?.id}`

      const method = mode === 'create' ? 'POST' : 'PUT'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!res.ok) {
        throw new Error('保存に失敗しました')
      }

      router.push('/admin/posts')
      router.refresh()
    } catch (error) {
      alert('エラーが発生しました')
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h2 className="text-lg font-semibold mb-4">基本情報</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              スラッグ *
            </label>
            <input
              type="text"
              required
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              タイトル *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              要約
            </label>
            <textarea
              value={formData.summary}
              onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              本文 (Markdown) *
            </label>
            <textarea
              required
              value={formData.body}
              onChange={(e) => setFormData({ ...formData, body: e.target.value })}
              rows={15}
              className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                カテゴリ *
              </label>
              <select
                required
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="policy">医療政策</option>
                <option value="dx">実装（医療DX）</option>
                <option value="ai">AI・データ活用</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ステータス
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="draft">下書き</option>
                <option value="published">公開</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              タグ（カンマ区切り）
            </label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              placeholder="医療政策, 診療報酬, 中医協"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              公開日時
            </label>
            <input
              type="datetime-local"
              value={formData.publishAt}
              onChange={(e) => setFormData({ ...formData, publishAt: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              参考URL（1行1URL）
            </label>
            <textarea
              value={formData.sourceUrls}
              onChange={(e) => setFormData({ ...formData, sourceUrls: e.target.value })}
              rows={3}
              placeholder="https://example.com/source1"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <ImageUpload
            value={formData.headerImageUrl}
            onChange={(url) => setFormData({ ...formData, headerImageUrl: url })}
            label="ヘッダー画像"
          />
        </div>
      </div>

      {/* Paywall Settings */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h2 className="text-lg font-semibold mb-4">ペイウォール設定</h2>

        <div className="space-y-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="paywallEnabled"
              checked={formData.paywallEnabled}
              onChange={(e) =>
                setFormData({ ...formData, paywallEnabled: e.target.checked })
              }
              className="h-4 w-4 text-blue-600 border-gray-300 rounded"
            />
            <label htmlFor="paywallEnabled" className="ml-2 block text-sm text-gray-700">
              ペイウォールを有効化
            </label>
          </div>

          {formData.paywallEnabled && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  無料表示モード
                </label>
                <select
                  value={formData.freeMode}
                  onChange={(e) => setFormData({ ...formData, freeMode: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="chars">文字数指定</option>
                  <option value="sections">セクション数指定</option>
                </select>
              </div>

              {formData.freeMode === 'chars' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    無料文字数
                  </label>
                  <input
                    type="number"
                    value={formData.freeChars}
                    onChange={(e) =>
                      setFormData({ ...formData, freeChars: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              )}

              {formData.freeMode === 'sections' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    無料セクション数
                  </label>
                  <input
                    type="number"
                    value={formData.freeSections}
                    onChange={(e) =>
                      setFormData({ ...formData, freeSections: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Featured Settings */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h2 className="text-lg font-semibold mb-4">注目記事設定</h2>

        <div className="space-y-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isFeatured"
              checked={formData.isFeatured}
              onChange={(e) =>
                setFormData({ ...formData, isFeatured: e.target.checked })
              }
              className="h-4 w-4 text-blue-600 border-gray-300 rounded"
            />
            <label htmlFor="isFeatured" className="ml-2 block text-sm text-gray-700">
              注目記事として表示
            </label>
          </div>

          {formData.isFeatured && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                表示順序
              </label>
              <input
                type="number"
                value={formData.featuredOrder}
                onChange={(e) =>
                  setFormData({ ...formData, featuredOrder: Number(e.target.value) })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end space-x-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
        >
          キャンセル
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {isSubmitting ? '保存中...' : '保存'}
        </button>
      </div>
    </form>
  )
}
