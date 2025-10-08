'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function CommentApprovalButton({
  commentId,
  currentStatus
}: {
  commentId: string
  currentStatus: string
}) {
  const router = useRouter()
  const [isUpdating, setIsUpdating] = useState(false)

  const updateStatus = async (newStatus: string) => {
    setIsUpdating(true)

    try {
      const res = await fetch(`/api/admin/comments/${commentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })

      if (!res.ok) {
        throw new Error('更新に失敗しました')
      }

      router.refresh()
    } catch (error) {
      alert('エラーが発生しました')
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <>
      {currentStatus !== 'approved' && (
        <button
          onClick={() => updateStatus('approved')}
          disabled={isUpdating}
          className="px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 disabled:opacity-50"
        >
          承認
        </button>
      )}
      {currentStatus !== 'rejected' && (
        <button
          onClick={() => updateStatus('rejected')}
          disabled={isUpdating}
          className="px-4 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 disabled:opacity-50"
        >
          却下
        </button>
      )}
      {currentStatus !== 'pending' && (
        <button
          onClick={() => updateStatus('pending')}
          disabled={isUpdating}
          className="px-4 py-2 bg-yellow-600 text-white text-sm rounded-md hover:bg-yellow-700 disabled:opacity-50"
        >
          保留
        </button>
      )}
    </>
  )
}
