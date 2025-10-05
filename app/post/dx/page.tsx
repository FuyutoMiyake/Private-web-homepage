import Link from 'next/link'

export const metadata = {
  title: '実装（医療DX） - Fuyuto Web',
  description: '電子カルテ標準化、PHR、オンライン診療、オンライン資格確認など、医療DXの現場実装を解説します。',
}

export default function DxPage() {
  const mockPosts: any[] = []

  return (
    <main className="bg-neutral-50 py-12">
      <div className="max-w-[1280px] mx-auto px-8">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-neutral-900 mb-4">実装（医療DX）</h1>
          <p className="text-lg text-neutral-600 max-w-3xl">
            電子カルテ標準化、PHR、オンライン診療、オンライン資格確認など、医療DXの現場実装を解説します。
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
