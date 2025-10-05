import Link from 'next/link'

export function Footer() {
  return (
    <footer className="bg-neutral-900 py-12 lg:py-16 mt-16">
      <div className="max-w-[1216px] mx-auto px-4 lg:px-0">
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="text-2xl font-bold text-white">Fuyuto Web</div>
          <div className="flex flex-wrap justify-center gap-6 text-neutral-400">
            <Link href="/about" className="hover:text-white transition-colors">
              サイト概要
            </Link>
            <Link href="/legal/privacy" className="hover:text-white transition-colors">
              プライバシーポリシー
            </Link>
            <Link href="/legal/terms" className="hover:text-white transition-colors">
              利用規約
            </Link>
            <Link href="/legal/tokusho" className="hover:text-white transition-colors">
              特定商取引法
            </Link>
            <Link href="mailto:contact@example.com" className="hover:text-white transition-colors">
              お問い合わせ
            </Link>
          </div>
          <div className="w-full h-px bg-neutral-800 my-4"></div>
          <p className="text-sm text-neutral-500">© 2025 Fuyuto Web. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
