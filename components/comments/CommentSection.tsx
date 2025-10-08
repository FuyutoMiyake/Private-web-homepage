'use client'

import { useState, useEffect } from 'react'
import Script from 'next/script'

type Comment = {
  id: string
  authorName: string
  body: string
  createdAt: string
  status: string
}

type CommentSectionProps = {
  postId: string
}

declare global {
  interface Window {
    turnstile?: {
      render: (element: string | HTMLElement, options: any) => string
      reset: (widgetId: string) => void
      remove: (widgetId: string) => void
    }
  }
}

export default function CommentSection({ postId }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Form state
  const [authorName, setAuthorName] = useState('')
  const [authorEmail, setAuthorEmail] = useState('')
  const [body, setBody] = useState('')

  // UI state
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
  const [turnstileWidgetId, setTurnstileWidgetId] = useState<string | null>(null)

  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITEKEY

  // Fetch existing comments
  useEffect(() => {
    fetchComments()
  }, [postId])

  const fetchComments = async () => {
    try {
      const res = await fetch(`/api/comments?postId=${postId}`)
      const data = await res.json()
      setComments(data.comments || [])
    } catch (error) {
      console.error('Failed to fetch comments:', error)
    } finally {
      setLoading(false)
    }
  }

  // Initialize Turnstile widget
  const initTurnstile = () => {
    if (window.turnstile && siteKey) {
      const widgetId = window.turnstile.render('#turnstile-widget', {
        sitekey: siteKey,
        callback: (token: string) => {
          setTurnstileToken(token)
        },
        'error-callback': () => {
          setTurnstileToken(null)
        },
      })
      setTurnstileWidgetId(widgetId)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)

    if (!body.trim()) {
      setMessage({ type: 'error', text: 'コメントを入力してください' })
      return
    }

    // Check for Turnstile token (skip in development if no siteKey)
    if (siteKey && !turnstileToken) {
      setMessage({ type: 'error', text: 'CAPTCHA認証を完了してください' })
      return
    }

    setSubmitting(true)

    try {
      // Generate idempotency key
      const idempotencyKey = `comment-${postId}-${Date.now()}-${Math.random()}`

      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'idempotency-key': idempotencyKey,
        },
        body: JSON.stringify({
          postId,
          authorName: authorName.trim() || undefined,
          authorEmail: authorEmail.trim() || undefined,
          body: body.trim(),
          turnstileToken: turnstileToken || undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (res.status === 429) {
          setMessage({
            type: 'error',
            text: 'コメントの投稿が多すぎます。しばらく待ってから再度お試しください。',
          })
        } else if (res.status === 403) {
          setMessage({ type: 'error', text: 'CAPTCHA認証に失敗しました' })
        } else {
          setMessage({ type: 'error', text: data.error || 'コメントの投稿に失敗しました' })
        }
        return
      }

      // Success
      if (data.requiresApproval) {
        setMessage({
          type: 'success',
          text: 'コメントを受け付けました。承認後に表示されます。',
        })
      } else {
        setMessage({ type: 'success', text: 'コメントを投稿しました' })
        // Refresh comments to show the new one
        fetchComments()
      }

      // Reset form
      setAuthorName('')
      setAuthorEmail('')
      setBody('')
      setTurnstileToken(null)

      // Reset Turnstile widget
      if (turnstileWidgetId && window.turnstile) {
        window.turnstile.reset(turnstileWidgetId)
      }
    } catch (error) {
      console.error('Comment submission error:', error)
      setMessage({ type: 'error', text: 'ネットワークエラーが発生しました' })
    } finally {
      setSubmitting(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="mt-12 border-t border-gray-200 pt-8">
      {/* Turnstile Script */}
      {siteKey && (
        <Script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js"
          onLoad={initTurnstile}
          strategy="lazyOnload"
        />
      )}

      <h2 className="text-2xl font-bold text-gray-900 mb-6">コメント</h2>

      {/* Existing Comments */}
      <div className="mb-8">
        {loading ? (
          <p className="text-gray-500">読み込み中...</p>
        ) : comments.length === 0 ? (
          <p className="text-gray-500">まだコメントはありません</p>
        ) : (
          <div className="space-y-6">
            {comments.map((comment) => (
              <div key={comment.id} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-gray-900">{comment.authorName}</span>
                  <span className="text-sm text-gray-500">{formatDate(comment.createdAt)}</span>
                </div>
                <p className="text-gray-700 whitespace-pre-wrap">{comment.body}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Comment Form */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">コメントを投稿</h3>

        {message && (
          <div
            className={`mb-4 p-4 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="authorName" className="block text-sm font-medium text-gray-700 mb-1">
                名前（任意）
              </label>
              <input
                type="text"
                id="authorName"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="匿名"
                maxLength={100}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="authorEmail" className="block text-sm font-medium text-gray-700 mb-1">
                メールアドレス（任意・非公開）
              </label>
              <input
                type="email"
                id="authorEmail"
                value={authorEmail}
                onChange={(e) => setAuthorEmail(e.target.value)}
                placeholder="email@example.com"
                maxLength={100}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label htmlFor="body" className="block text-sm font-medium text-gray-700 mb-1">
              コメント<span className="text-red-500">*</span>
            </label>
            <textarea
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="コメントを入力してください"
              required
              rows={4}
              maxLength={2000}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">{body.length}/2000文字</p>
          </div>

          {/* Turnstile Widget */}
          {siteKey && (
            <div id="turnstile-widget" className="flex justify-center"></div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full md:w-auto px-6 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? '送信中...' : 'コメントを投稿'}
          </button>
        </form>
      </div>
    </div>
  )
}
