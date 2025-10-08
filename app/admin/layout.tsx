import Link from 'next/link'
import { ReactNode } from 'react'

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900">
              <Link href="/admin">管理パネル</Link>
            </h1>
            <Link
              href="/"
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              サイトを表示
            </Link>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-gray-200 min-h-[calc(100vh-73px)]">
          <nav className="p-4 space-y-1">
            <Link
              href="/admin"
              className="block px-4 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100"
            >
              ダッシュボード
            </Link>
            <Link
              href="/admin/analytics"
              className="block px-4 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100"
            >
              アクセス解析
            </Link>
            <Link
              href="/admin/posts"
              className="block px-4 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100"
            >
              記事管理
            </Link>
            <Link
              href="/admin/comments"
              className="block px-4 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100"
            >
              コメント承認
            </Link>
            <Link
              href="/admin/api-keys"
              className="block px-4 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100"
            >
              APIキー管理
            </Link>
            <Link
              href="/admin/settings"
              className="block px-4 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100"
            >
              サイト設定
            </Link>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
