import Link from 'next/link'
import { SocialLinks } from '@/components/sns/SocialLinks'
import { db } from '@/lib/db'

export async function Footer() {
  const settings = await db.siteSettings.findUnique({
    where: { id: 1 },
    select: {
      snsTwitter: true,
      snsLinkedin: true,
      snsLine: true,
      snsInstagram: true,
      snsYoutube: true,
      snsTiktok: true,
      snsFacebook: true,
    },
  })

  const snsLinks = settings
    ? {
        twitter: settings.snsTwitter,
        linkedin: settings.snsLinkedin,
        line: settings.snsLine,
        instagram: settings.snsInstagram,
        youtube: settings.snsYoutube,
        tiktok: settings.snsTiktok,
        facebook: settings.snsFacebook,
      }
    : {}

  return (
    <footer className="bg-neutral-900 py-12 lg:py-16 mt-16">
      <div className="max-w-[1216px] mx-auto px-4 lg:px-0">
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="text-2xl font-bold text-white">Fuyuto Web</div>

          {/* SNS Links */}
          <SocialLinks variant="horizontal" size="md" links={snsLinks} />

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
