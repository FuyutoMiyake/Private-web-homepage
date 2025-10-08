import { db } from '@/lib/db'
import { CommentApprovalButton } from './CommentApprovalButton'

export default async function CommentsPage({
  searchParams
}: {
  searchParams: { status?: string }
}) {
  const statusFilter = searchParams.status || 'pending'

  const comments = await db.comment.findMany({
    where: statusFilter === 'all' ? {} : { status: statusFilter as any },
    orderBy: { createdAt: 'desc' },
    include: {
      post: {
        select: {
          title: true,
          slug: true
        }
      }
    }
  })

  const counts = {
    all: await db.comment.count(),
    pending: await db.comment.count({ where: { status: 'pending' } }),
    approved: await db.comment.count({ where: { status: 'approved' } }),
    rejected: await db.comment.count({ where: { status: 'rejected' } })
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">コメント承認</h1>

      {/* Status Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'pending', label: '承認待ち', count: counts.pending },
            { key: 'approved', label: '承認済み', count: counts.approved },
            { key: 'rejected', label: '却下', count: counts.rejected },
            { key: 'all', label: 'すべて', count: counts.all }
          ].map((tab) => (
            <a
              key={tab.key}
              href={`/admin/comments?status=${tab.key}`}
              className={`
                whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm
                ${
                  statusFilter === tab.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              {tab.label} ({tab.count})
            </a>
          ))}
        </nav>
      </div>

      {/* Comments List */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <div className="bg-white p-8 rounded-lg border border-gray-200 text-center text-gray-500">
            コメントがありません
          </div>
        ) : (
          comments.map((comment) => (
            <div
              key={comment.id}
              className="bg-white p-6 rounded-lg border border-gray-200"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="font-medium text-gray-900">
                      {comment.authorName}
                    </span>
                    {comment.authorEmail && (
                      <span className="text-sm text-gray-500">
                        ({comment.authorEmail})
                      </span>
                    )}
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        comment.status === 'approved'
                          ? 'bg-green-100 text-green-800'
                          : comment.status === 'rejected'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {comment.status === 'approved'
                        ? '承認済み'
                        : comment.status === 'rejected'
                        ? '却下'
                        : '承認待ち'}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500 mb-2">
                    記事:{' '}
                    <a
                      href={`/post/${comment.post.slug}`}
                      target="_blank"
                      className="text-blue-600 hover:underline"
                    >
                      {comment.post.title}
                    </a>
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(comment.createdAt).toLocaleString('ja-JP')}
                  </div>
                </div>
              </div>

              <div className="prose prose-sm max-w-none mb-4">
                <p className="text-gray-700 whitespace-pre-wrap">{comment.body}</p>
              </div>

              <div className="flex space-x-2">
                <CommentApprovalButton
                  commentId={comment.id}
                  currentStatus={comment.status}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
