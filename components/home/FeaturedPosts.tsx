import Link from 'next/link'

type Post = {
  slug: string
  title: string
  summary: string | null
  excerpt?: string
  publishAt: Date | null
  tags: string[]
  isFeatured: boolean
}

type FeaturedPostsProps = {
  posts: Post[]
}

export function FeaturedPosts({ posts }: FeaturedPostsProps) {
  const featuredPosts = posts.filter((p) => p.isFeatured).slice(0, 3)
  const featuredPost = featuredPosts[0]
  const smallPosts = featuredPosts.slice(1, 3)

  if (!featuredPost) return null

  const formatDate = (date: Date | null) => {
    if (!date) return ''
    return new Date(date).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }


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
                <div className="w-full h-[280px] bg-gradient-to-br from-blue-50 to-neutral-100 flex items-center justify-center">
                  <span className="text-neutral-400 text-sm">画像</span>
                </div>
                <div className="absolute top-4 left-4">
                  <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-white/90 backdrop-blur-sm text-neutral-900 shadow-sm">
                    注目記事
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-4 p-6 pt-0">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-blue-600">{formatDate(featuredPost.publishAt)}</span>
                    <span className="text-neutral-500">•</span>
                    <span className="text-neutral-500">5分で読める</span>
                  </div>
                  <h3 className="text-2xl font-bold leading-tight text-neutral-900 hover:text-neutral-600 transition-colors">
                    {featuredPost.title}
                  </h3>
                  <p className="text-base leading-relaxed text-neutral-600">
                    {featuredPost.summary || featuredPost.excerpt}
                  </p>
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
                  <div className="w-full md:w-40 h-40 bg-gradient-to-br from-blue-50 to-neutral-100 flex items-center justify-center flex-shrink-0 rounded">
                    <span className="text-neutral-400 text-xs">画像</span>
                  </div>
                  <div className="flex flex-col gap-3 flex-1">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-blue-600">{formatDate(post.publishAt)}</span>
                      </div>
                      <h3 className="text-lg font-bold text-neutral-900 hover:text-neutral-600 transition-colors leading-snug">
                        {post.title}
                      </h3>
                      <p className="text-sm leading-relaxed text-neutral-600 line-clamp-2">
                        {post.summary || post.excerpt}
                      </p>
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
