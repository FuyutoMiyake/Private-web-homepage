import { db } from '@/lib/db'
import { PostForm } from '../../PostForm'
import { notFound } from 'next/navigation'

export default async function EditPostPage({ params }: { params: { id: string } }) {
  const post = await db.post.findUnique({
    where: { id: params.id }
  })

  if (!post) {
    notFound()
  }

  const initialData = {
    id: post.id,
    slug: post.slug,
    title: post.title,
    summary: post.summary || undefined,
    body: post.body,
    category: post.category,
    tags: post.tags,
    status: post.status,
    publishAt: post.publishAt ? post.publishAt.toISOString().slice(0, 16) : null,
    headerImageUrl: post.headerImageUrl,
    paywallEnabled: post.paywallEnabled,
    freeMode: post.freeMode,
    freeChars: post.freeChars ?? 300,
    freeSections: post.freeSections ?? 0,
    sourceUrls: post.sourceUrls,
    isFeatured: post.isFeatured,
    featuredOrder: post.featuredOrder
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">記事編集</h1>
      <PostForm initialData={initialData} mode="edit" />
    </div>
  )
}
