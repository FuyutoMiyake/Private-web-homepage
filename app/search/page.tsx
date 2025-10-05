export const metadata = {
  title: '検索 - Fuyuto Web',
  description: '記事を検索できます。',
}

export default function SearchPage() {
  return (
    <main className="bg-neutral-50 py-12">
      <div className="max-w-[1280px] mx-auto px-8">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-neutral-900 mb-4">検索</h1>
          <p className="text-lg text-neutral-600">記事を検索できます。</p>
        </div>

        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <input
              type="text"
              placeholder="キーワードを入力してください"
              className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
              disabled
            />
            <p className="mt-4 text-sm text-neutral-500 text-center">
              検索機能は準備中です。データベース接続後に利用できるようになります。
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
