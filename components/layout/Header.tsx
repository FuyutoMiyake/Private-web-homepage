import Link from 'next/link'

export function Header() {
  return (
    <header className="bg-white shadow-sm">
      {/* Navbar */}
      <nav className="max-w-[1216px] mx-auto px-4 lg:px-0 flex flex-col lg:flex-row justify-between items-center gap-5 lg:gap-0 py-6">
        <Link href="/" className="text-2xl font-bold text-neutral-900">
          Fuyuto Web
        </Link>
        <div className="flex flex-wrap items-center justify-center gap-2">
          {/* 記事グループ */}
          <Link
            href="/post"
            className="px-3 py-2 font-medium text-neutral-900 hover:text-black hover:bg-neutral-100 transition-all"
            style={{ fontSize: '15px' }}
          >
            記事
          </Link>
          <span className="text-neutral-400" style={{ fontSize: '15px' }}>
            ＞
          </span>
          <Link
            href="/post/policy"
            className="px-3 py-2 font-medium text-neutral-900 hover:text-black hover:bg-neutral-100 transition-all"
            style={{ fontSize: '15px' }}
          >
            医療政策
          </Link>
          <span className="text-neutral-400" style={{ fontSize: '15px' }}>
            /
          </span>
          <Link
            href="/post/dx"
            className="px-3 py-2 font-medium text-neutral-900 hover:text-black hover:bg-neutral-100 transition-all"
            style={{ fontSize: '15px' }}
          >
            実装（医療DX）
          </Link>
          <span className="text-neutral-400" style={{ fontSize: '15px' }}>
            /
          </span>
          <Link
            href="/post/ai"
            className="px-3 py-2 font-medium text-neutral-900 hover:text-black hover:bg-neutral-100 transition-all"
            style={{ fontSize: '15px' }}
          >
            AI・データ活用
          </Link>

          {/* 区切り */}
          <span className="text-neutral-400 mx-1" style={{ fontSize: '15px' }}>
            ｜
          </span>

          {/* その他 */}
          <Link
            href="/learning"
            className="px-3 py-2 font-medium text-neutral-900 hover:text-black hover:bg-neutral-100 transition-all"
            style={{ fontSize: '15px' }}
          >
            学習
          </Link>
          <span className="text-neutral-400 mx-1" style={{ fontSize: '15px' }}>
            ｜
          </span>
          <Link
            href="/search"
            className="px-3 py-2 font-medium text-neutral-900 hover:text-black hover:bg-neutral-100 transition-all"
            style={{ fontSize: '15px' }}
          >
            検索
          </Link>
          <span className="text-neutral-400 mx-1" style={{ fontSize: '15px' }}>
            ｜
          </span>
          <Link
            href="/about"
            className="px-3 py-2 font-medium text-neutral-900 hover:text-black hover:bg-neutral-100 transition-all"
            style={{ fontSize: '15px' }}
          >
            About
          </Link>
        </div>
      </nav>
    </header>
  )
}
