import Link from 'next/link'
import Image from 'next/image'

export function FeaturedPosts() {
  const featuredPost = {
    slug: 'weekly-summary-41',
    title: '今週の医療政策まとめ（第41週）',
    summary:
      '中医協における診療報酬改定の議論、オンライン診療の規制緩和、医療DX推進本部の最新動向をまとめました。',
    date: '2025年10月5日',
    readTime: '5分で読める',
    tags: ['医療政策', '診療報酬', '中医協'],
    image: 'https://placehold.co/600x400/e5e5e5/525252',
  }

  const smallPosts = [
    {
      slug: 'ehr-standardization',
      title: '電子カルテ標準化の最新動向',
      summary: 'HL7 FHIR規格の採用が加速。2026年までに全国の医療機関での導入を目指す...',
      date: '2025年9月28日',
      tags: ['医療DX', '電子カルテ'],
      image: 'https://placehold.co/600x400/d4d4d4/525252',
    },
    {
      slug: 'online-qualification',
      title: 'オンライン資格確認の義務化',
      summary: 'マイナ保険証の普及に向け、2025年4月からオンライン資格確認が原則義務化...',
      date: '2025年9月20日',
      tags: ['医療政策', '保険証'],
      image: 'https://placehold.co/600x400/d4d4d4/737373',
    },
  ]

  return (
    <section className="py-12 lg:py-16">
      <div className="max-w-[1280px] mx-auto px-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="h-8 w-1 bg-neutral-900"></div>
          <h2 className="text-3xl font-bold text-neutral-900">注目記事</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Large Featured Card */}
          <Link href={`/post/${featuredPost.slug}`}>
            <article className="blog-card flex flex-col gap-6 bg-white overflow-hidden shadow-md hover:shadow-xl transition-shadow cursor-pointer">
              <div className="relative overflow-hidden">
                <Image
                  src={featuredPost.image}
                  alt={featuredPost.title}
                  width={600}
                  height={280}
                  className="w-full h-[280px] object-cover"
                />
                <div className="absolute top-4 left-4">
                  <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-white/90 backdrop-blur-sm text-neutral-900 shadow-sm">
                    注目記事
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-4 p-6 pt-0">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-blue-600">{featuredPost.date}</span>
                    <span className="text-neutral-500">•</span>
                    <span className="text-neutral-500">{featuredPost.readTime}</span>
                  </div>
                  <h3 className="text-2xl font-bold leading-tight text-neutral-900 hover:text-neutral-600 transition-colors">
                    {featuredPost.title}
                  </h3>
                  <p className="text-base leading-relaxed text-neutral-600">{featuredPost.summary}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {featuredPost.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 rounded-full text-xs font-medium bg-neutral-100 text-neutral-700 hover:bg-neutral-200 transition-colors"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </article>
          </Link>

          {/* Small Cards Column */}
          <div className="flex flex-col gap-6">
            {smallPosts.map((post) => (
              <Link key={post.slug} href={`/post/${post.slug}`}>
                <article className="blog-card flex flex-col md:flex-row gap-5 bg-white overflow-hidden shadow-md p-5 hover:shadow-xl transition-shadow cursor-pointer">
                  <Image
                    src={post.image}
                    alt={post.title}
                    width={160}
                    height={160}
                    className="w-full md:w-40 h-40 object-cover flex-shrink-0"
                  />
                  <div className="flex flex-col gap-3 flex-1">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-blue-600">{post.date}</span>
                      </div>
                      <h3 className="text-lg font-bold text-neutral-900 hover:text-neutral-600 transition-colors leading-snug">
                        {post.title}
                      </h3>
                      <p className="text-sm leading-relaxed text-neutral-600 line-clamp-2">{post.summary}</p>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-auto">
                      {post.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-neutral-100 text-neutral-700"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
