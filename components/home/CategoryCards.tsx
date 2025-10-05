import Link from 'next/link'

export function CategoryCards() {
  const categories = [
    {
      title: '医療政策',
      description:
        '診療報酬改定、中医協の議論、地域医療構想、医療保険制度の変遷など、医療政策の最新動向を追います。',
      href: '/post/policy',
    },
    {
      title: '実装（医療DX）',
      description:
        '電子カルテ標準化、PHR、オンライン診療、オンライン資格確認など、医療DXの現場実装を解説します。',
      href: '/post/dx',
    },
    {
      title: 'AI・データ活用',
      description:
        'AI問診、画像診断支援、ビッグデータ解析、予測モデルなど、医療現場でのAI・データ活用事例を紹介します。',
      href: '/post/ai',
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {categories.map((cat) => (
        <Link
          key={cat.href}
          href={cat.href}
          className="blog-card rounded-lg p-6 bg-white shadow-md hover:shadow-xl transition-shadow"
        >
          <h3 className="text-xl font-bold mb-2 text-neutral-900">{cat.title}</h3>
          <p className="text-gray-600 text-sm leading-relaxed">{cat.description}</p>
        </Link>
      ))}
    </div>
  )
}
