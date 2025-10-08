import { CategoryCards } from '@/components/home/CategoryCards'
import { FeaturedPosts } from '@/components/home/FeaturedPosts'
import { ScrollAnimation } from '@/components/ScrollAnimation'
import { db } from '@/lib/db'

export const revalidate = 3600

export default async function HomePage() {
  const rawPosts = await db.post.findMany({
    where: {
      status: 'published',
    },
    orderBy: { publishAt: 'desc' },
    select: {
      slug: true,
      title: true,
      summary: true,
      publishAt: true,
      tags: true,
      isFeatured: true,
    },
  })

  // Serialize dates for client-side hydration
  const posts = rawPosts.map(post => ({
    ...post,
    publishAt: post.publishAt ? post.publishAt : null,
  }))

  return (
    <main>
      <ScrollAnimation />

      {/* Hero Section */}
      <div className="bg-white">
        <div className="max-w-[1216px] mx-auto px-4 lg:px-0 pt-16 lg:pt-24 pb-12 lg:pb-20">
          <h1 className="hero-title font-extrabold leading-tight text-neutral-900">
            医療DX × 政策 × AI
          </h1>
          <p className="mt-4 text-lg text-neutral-600 max-w-2xl">
            データと制度をつなぎ、現場から変える。
            <br />
            医療の未来をつくる医師が発信する、政策・DX・AIの交差点。
          </p>
          <p className="mt-3 text-base text-neutral-500 max-w-2xl">
            週次の医療政策・医療DX実装・AIニュースのまとめを中心に、
            <br />
            中医協速報や医療現場からの個人ブログを発信しています。
          </p>
        </div>
      </div>

      {/* Featured Posts Section */}
      <FeaturedPosts posts={posts} />

      {/* Category Cards Section */}
      <section className="py-12 lg:py-16 bg-neutral-50">
        <div className="max-w-[1280px] mx-auto px-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="h-8 w-1 bg-neutral-900"></div>
            <h2 className="text-3xl font-bold text-neutral-900">カテゴリ</h2>
          </div>
          <CategoryCards />
        </div>
      </section>
    </main>
  )
}
