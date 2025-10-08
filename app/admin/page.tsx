import { db } from '@/lib/db'

export default async function AdminDashboard() {
  const [totalPosts, publishedPosts, draftPosts, pendingComments] = await Promise.all([
    db.post.count(),
    db.post.count({ where: { status: 'published' } }),
    db.post.count({ where: { status: 'draft' } }),
    db.comment.count({ where: { status: 'pending' } })
  ])

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">ダッシュボード</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Posts */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="text-sm font-medium text-gray-500">総記事数</div>
          <div className="mt-2 text-3xl font-bold text-gray-900">{totalPosts}</div>
        </div>

        {/* Published Posts */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="text-sm font-medium text-gray-500">公開済み</div>
          <div className="mt-2 text-3xl font-bold text-green-600">{publishedPosts}</div>
        </div>

        {/* Draft Posts */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="text-sm font-medium text-gray-500">下書き</div>
          <div className="mt-2 text-3xl font-bold text-yellow-600">{draftPosts}</div>
        </div>

        {/* Pending Comments */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="text-sm font-medium text-gray-500">承認待ちコメント</div>
          <div className="mt-2 text-3xl font-bold text-blue-600">{pendingComments}</div>
        </div>
      </div>
    </div>
  )
}
