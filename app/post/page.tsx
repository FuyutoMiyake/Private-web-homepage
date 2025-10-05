export const metadata = {
  title: '記事一覧 - Fuyuto Web',
  description: '医療政策、医療DX、AI・データ活用に関する全ての記事を掲載しています。',
}

export default function PostListPage() {
  return (
    <main className="bg-neutral-50 py-12">
      <div className="max-w-[1280px] mx-auto px-8">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-neutral-900 mb-4">記事一覧</h1>
          <p className="text-lg text-neutral-600">
            医療政策、医療DX、AI・データ活用に関する全ての記事を掲載しています。
          </p>
        </div>

        <div className="text-center py-16">
          <p className="text-neutral-500">記事がまだありません。データベース接続後に表示されます。</p>
        </div>
      </div>
    </main>
  )
}
