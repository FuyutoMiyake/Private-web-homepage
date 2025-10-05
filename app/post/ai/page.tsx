import Link from 'next/link'

export const metadata = {
  title: 'AI・データ活用 - Fuyuto Web',
  description: 'AI問診、画像診断支援、ビッグデータ解析、予測モデルなど、医療現場でのAI・データ活用事例を紹介します。',
}

export default function AiPage() {
  const mockPosts: any[] = []

  return (
    <main className="bg-neutral-50 py-12">
      <div className="max-w-[1280px] mx-auto px-8">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-neutral-900 mb-4">AI・データ活用</h1>
          <p className="text-lg text-neutral-600 max-w-3xl">
            AI問診、画像診断支援、ビッグデータ解析、予測モデルなど、医療現場でのAI・データ活用事例を紹介します。
          </p>
        </div>

        {mockPosts.length === 0 && (
          <div className="text-center py-16">
            <p className="text-neutral-500">記事がまだありません。</p>
          </div>
        )}
      </div>
    </main>
  )
}
