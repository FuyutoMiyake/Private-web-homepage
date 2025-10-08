'use client'

import { useRouter } from 'next/navigation'
import { useState, FormEvent } from 'react'

type SettingsFormProps = {
  settings: {
    id: number
    siteTitle: string
    snsTwitter: string
    snsLinkedin: string
    snsLine: string
    snsInstagram: string
    snsYoutube: string
    snsTiktok: string
    snsFacebook: string
    paywallDefaultMode: string
    commentMode: string
  }
}

export function SettingsForm({ settings }: SettingsFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    siteTitle: settings.siteTitle,
    snsTwitter: settings.snsTwitter,
    snsLinkedin: settings.snsLinkedin,
    paywallDefaultMode: settings.paywallDefaultMode,
    commentMode: settings.commentMode
  })

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const payload = {
        siteTitle: formData.siteTitle,
        snsTwitter: formData.snsTwitter,
        snsLinkedin: formData.snsLinkedin,
        paywallDefaultMode: formData.paywallDefaultMode,
        commentMode: formData.commentMode
      }

      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!res.ok) {
        throw new Error('保存に失敗しました')
      }

      alert('設定を保存しました')
      router.refresh()
    } catch (error) {
      alert('エラーが発生しました')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Site Info */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h2 className="text-lg font-semibold mb-4">サイト情報</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              サイトタイトル
            </label>
            <input
              type="text"
              required
              value={formData.siteTitle}
              onChange={(e) =>
                setFormData({ ...formData, siteTitle: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
        </div>
      </div>

      {/* SNS Links */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h2 className="text-lg font-semibold mb-4">SNSリンク</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              X (Twitter) URL
            </label>
            <input
              type="url"
              value={formData.snsTwitter}
              onChange={(e) =>
                setFormData({ ...formData, snsTwitter: e.target.value })
              }
              placeholder="https://twitter.com/username"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              LinkedIn URL
            </label>
            <input
              type="url"
              value={formData.snsLinkedin}
              onChange={(e) =>
                setFormData({ ...formData, snsLinkedin: e.target.value })
              }
              placeholder="https://linkedin.com/in/username"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
        </div>
      </div>

      {/* Paywall Defaults */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h2 className="text-lg font-semibold mb-4">ペイウォールデフォルト設定</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              デフォルト無料表示モード
            </label>
            <select
              value={formData.paywallDefaultMode}
              onChange={(e) =>
                setFormData({ ...formData, paywallDefaultMode: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="marker">マーカー</option>
              <option value="chars">文字数指定</option>
              <option value="sections">セクション数指定</option>
            </select>
          </div>
        </div>
      </div>

      {/* Comment Settings */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h2 className="text-lg font-semibold mb-4">コメント設定</h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            コメント承認モード
          </label>
          <select
            value={formData.commentMode}
            onChange={(e) =>
              setFormData({ ...formData, commentMode: e.target.value })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="pre_moderation">事前承認（投稿後に管理者が承認）</option>
            <option value="post_moderation">事後承認（即時公開、後で管理者が確認）</option>
          </select>
          <p className="mt-2 text-sm text-gray-500">
            {formData.commentMode === 'pre_moderation'
              ? 'コメントは管理者が承認するまで表示されません'
              : 'コメントは即時公開され、後で管理者が確認します'}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {isSubmitting ? '保存中...' : '設定を保存'}
        </button>
      </div>
    </form>
  )
}
