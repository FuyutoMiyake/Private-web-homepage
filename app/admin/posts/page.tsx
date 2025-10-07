import Link from 'next/link'
import { db } from '@/lib/db'
import { DeletePostButton } from './DeletePostButton'
import { PostsFilter } from './PostsFilter'
import { Prisma } from '@prisma/client'

type SearchParams = {
  category?: string
  status?: string
  sortBy?: string
  order?: string
}

export default async function PostsPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const { category, status, sortBy = 'createdAt', order = 'desc' } = searchParams

  // フィルター条件を構築
  const where: Prisma.PostWhereInput = {}

  if (category && category !== 'all') {
    where.category = category
  }

  if (status && status !== 'all') {
    where.status = status
  }

  // ソート条件を構築
  const orderBy: Prisma.PostOrderByWithRelationInput = {}

  if (sortBy === 'publishAt') {
    orderBy.publishAt = order as 'asc' | 'desc'
  } else if (sortBy === 'updatedAt') {
    orderBy.updatedAt = order as 'asc' | 'desc'
  } else if (sortBy === 'title') {
    orderBy.title = order as 'asc' | 'desc'
  } else {
    orderBy.createdAt = order as 'asc' | 'desc'
  }

  const posts = await db.post.findMany({
    where,
    orderBy,
    select: {
      id: true,
      slug: true,
      title: true,
      category: true,
      status: true,
      publishAt: true,
      createdAt: true,
      updatedAt: true
    }
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">記事管理</h1>
        <Link
          href="/admin/posts/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          新規作成
        </Link>
      </div>

      {/* フィルター/ソートUI */}
      <PostsFilter />

      {/* 記事数表示 */}
      <div className="mb-4 text-sm text-gray-600">
        {posts.length}件の記事
      </div>

      {posts.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-500">
          該当する記事がありません
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                タイトル
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                カテゴリ
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ステータス
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                公開日時
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {posts.map((post) => (
              <tr key={post.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{post.title}</div>
                  <div className="text-sm text-gray-500">{post.slug}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                    {post.category}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      post.status === 'published'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {post.status === 'published' ? '公開' : '下書き'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {post.publishAt
                    ? new Date(post.publishAt).toLocaleDateString('ja-JP')
                    : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <Link
                    href={`/admin/posts/${post.id}/edit`}
                    className="text-blue-600 hover:text-blue-900 mr-4"
                  >
                    編集
                  </Link>
                  <DeletePostButton postId={post.id} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      )}
    </div>
  )
}
