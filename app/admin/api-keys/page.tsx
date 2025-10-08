'use client'

import { useState, useEffect } from 'react'

type ApiKey = {
  id: string
  name: string
  key: string
  isActive: boolean
  createdAt: string
  lastUsedAt: string | null
  usageCount: number
}

export default function ApiKeysPage() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [newKeyCreated, setNewKeyCreated] = useState<string | null>(null)

  useEffect(() => {
    fetchApiKeys()
  }, [])

  const fetchApiKeys = async () => {
    try {
      const res = await fetch('/api/admin/api-keys')
      const data = await res.json()
      setApiKeys(data.apiKeys || [])
    } catch (error) {
      console.error('Failed to fetch API keys:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newKeyName.trim()) {
      alert('APIキー名を入力してください')
      return
    }

    setCreating(true)

    try {
      const res = await fetch('/api/admin/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newKeyName.trim() }),
      })

      const data = await res.json()

      if (res.ok) {
        setNewKeyCreated(data.key)
        setNewKeyName('')
        fetchApiKeys()
      } else {
        alert(data.error || 'APIキーの作成に失敗しました')
      }
    } catch (error) {
      console.error('Create API key error:', error)
      alert('ネットワークエラーが発生しました')
    } finally {
      setCreating(false)
    }
  }

  const handleToggle = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch('/api/admin/api-keys', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isActive: !currentStatus }),
      })

      if (res.ok) {
        fetchApiKeys()
      } else {
        const data = await res.json()
        alert(data.error || '更新に失敗しました')
      }
    } catch (error) {
      console.error('Toggle API key error:', error)
      alert('ネットワークエラーが発生しました')
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`APIキー「${name}」を削除しますか？この操作は取り消せません。`)) {
      return
    }

    try {
      const res = await fetch('/api/admin/api-keys', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })

      if (res.ok) {
        fetchApiKeys()
      } else {
        const data = await res.json()
        alert(data.error || '削除に失敗しました')
      }
    } catch (error) {
      console.error('Delete API key error:', error)
      alert('ネットワークエラーが発生しました')
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert('APIキーをクリップボードにコピーしました')
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleString('ja-JP')
  }

  const maskKey = (key: string) => {
    const visibleChars = 8
    return key.slice(0, visibleChars) + '•'.repeat(key.length - visibleChars)
  }

  return (
    <div className="max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">API キー管理</h1>
      </div>

      {/* New Key Created Alert */}
      {newKeyCreated && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-green-900 mb-2">
            APIキーを作成しました
          </h3>
          <p className="text-sm text-green-800 mb-3">
            以下のAPIキーは今回のみ表示されます。必ず保存してください。
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-white px-4 py-2 rounded border border-green-300 text-sm font-mono">
              {newKeyCreated}
            </code>
            <button
              onClick={() => copyToClipboard(newKeyCreated)}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm font-medium"
            >
              コピー
            </button>
          </div>
          <button
            onClick={() => setNewKeyCreated(null)}
            className="mt-3 text-sm text-green-700 hover:text-green-900 underline"
          >
            閉じる
          </button>
        </div>
      )}

      {/* Create Form */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">新規APIキー作成</h2>
        </div>
        <form onSubmit={handleCreate} className="p-6">
          <div className="flex gap-3">
            <input
              type="text"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              placeholder="APIキー名（例: モバイルアプリ）"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              maxLength={100}
            />
            <button
              type="submit"
              disabled={creating}
              className="px-6 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {creating ? '作成中...' : '作成'}
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            作成したAPIキーは、<code className="bg-gray-100 px-1 py-0.5 rounded text-xs">X-API-Key</code>ヘッダーで使用できます
          </p>
        </form>
      </div>

      {/* API Keys List */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">APIキー一覧</h2>
        </div>

        {loading ? (
          <div className="p-6 text-center text-gray-500">読み込み中...</div>
        ) : apiKeys.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            APIキーがまだありません。上のフォームから作成してください。
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    名前
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    APIキー
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ステータス
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    使用回数
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    最終使用
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    作成日
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {apiKeys.map((apiKey) => (
                  <tr key={apiKey.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {apiKey.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <code className="text-xs text-gray-600 font-mono">
                        {maskKey(apiKey.key)}
                      </code>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          apiKey.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {apiKey.isActive ? '有効' : '無効'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {apiKey.usageCount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(apiKey.lastUsedAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(apiKey.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleToggle(apiKey.id, apiKey.isActive)}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        {apiKey.isActive ? '無効化' : '有効化'}
                      </button>
                      <button
                        onClick={() => handleDelete(apiKey.id, apiKey.name)}
                        className="text-red-600 hover:text-red-900"
                      >
                        削除
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Usage Instructions */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-sm font-semibold text-blue-900 mb-2">使用方法</h3>
        <p className="text-sm text-blue-800 mb-3">
          APIキーは、HTTPリクエストのヘッダーに含めて使用します:
        </p>
        <pre className="bg-blue-100 border border-blue-300 rounded px-4 py-3 text-xs font-mono text-blue-900 overflow-x-auto">
{`curl -H "X-API-Key: your_api_key_here" \\
  https://yourdomain.com/api/public/posts`}
        </pre>
        <p className="text-sm text-blue-800 mt-3">
          利用可能なエンドポイント:
        </p>
        <ul className="text-sm text-blue-800 list-disc list-inside mt-1 space-y-1">
          <li><code className="bg-blue-100 px-1 py-0.5 rounded text-xs">GET /api/public/posts</code> - 公開記事一覧</li>
          <li><code className="bg-blue-100 px-1 py-0.5 rounded text-xs">GET /api/public/posts/[slug]</code> - 記事詳細</li>
        </ul>
      </div>
    </div>
  )
}
