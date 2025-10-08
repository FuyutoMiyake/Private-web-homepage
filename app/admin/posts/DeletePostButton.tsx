'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function DeletePostButton({ postId }: { postId: string }) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!confirm('本当にこの記事を削除しますか？')) {
      return
    }

    setIsDeleting(true)

    try {
      const res = await fetch(`/api/admin/posts/${postId}`, {
        method: 'DELETE'
      })

      if (!res.ok) {
        throw new Error('削除に失敗しました')
      }

      router.refresh()
    } catch (error) {
      alert('エラーが発生しました')
      setIsDeleting(false)
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className="text-red-600 hover:text-red-900 disabled:opacity-50"
    >
      {isDeleting ? '削除中...' : '削除'}
    </button>
  )
}
