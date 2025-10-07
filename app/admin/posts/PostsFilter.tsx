'use client'

import { useRouter, useSearchParams } from 'next/navigation'

export function PostsFilter() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const category = searchParams.get('category') || 'all'
  const status = searchParams.get('status') || 'all'
  const sortBy = searchParams.get('sortBy') || 'createdAt'
  const order = searchParams.get('order') || 'desc'

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value === 'all') {
      params.delete(key)
    } else {
      params.set(key, value)
    }
    router.push(`/admin/posts?${params.toString()}`)
  }

  return (
    <div className="mb-6 flex flex-wrap gap-4 items-center bg-white p-4 rounded-lg border border-gray-200">
      {/* カテゴリフィルター */}
      <div className="flex items-center gap-2">
        <label htmlFor="category" className="text-sm font-medium text-gray-700">
          カテゴリ:
        </label>
        <select
          id="category"
          value={category}
          onChange={(e) => updateFilter('category', e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">すべて</option>
          <option value="policy">Policy</option>
          <option value="dx">DX</option>
          <option value="ai">AI</option>
          <option value="other">その他</option>
        </select>
      </div>

      {/* ステータスフィルター */}
      <div className="flex items-center gap-2">
        <label htmlFor="status" className="text-sm font-medium text-gray-700">
          ステータス:
        </label>
        <select
          id="status"
          value={status}
          onChange={(e) => updateFilter('status', e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">すべて</option>
          <option value="published">公開</option>
          <option value="draft">下書き</option>
          <option value="scheduled">予約</option>
        </select>
      </div>

      {/* ソート項目 */}
      <div className="flex items-center gap-2">
        <label htmlFor="sortBy" className="text-sm font-medium text-gray-700">
          並び替え:
        </label>
        <select
          id="sortBy"
          value={sortBy}
          onChange={(e) => updateFilter('sortBy', e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="createdAt">作成日時</option>
          <option value="publishAt">公開日時</option>
          <option value="updatedAt">更新日時</option>
          <option value="title">タイトル</option>
        </select>
      </div>

      {/* ソート順序 */}
      <div className="flex items-center gap-2">
        <label htmlFor="order" className="text-sm font-medium text-gray-700">
          順序:
        </label>
        <select
          id="order"
          value={order}
          onChange={(e) => updateFilter('order', e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="desc">降順（新しい順）</option>
          <option value="asc">昇順（古い順）</option>
        </select>
      </div>

      {/* リセットボタン */}
      {(category !== 'all' || status !== 'all' || sortBy !== 'createdAt' || order !== 'desc') && (
        <button
          onClick={() => router.push('/admin/posts')}
          className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50"
        >
          リセット
        </button>
      )}
    </div>
  )
}
