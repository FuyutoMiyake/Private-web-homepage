import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { PostForm } from '../../PostForm'

type Props = {
  params: { id: string }
}

export default async function EditPostPage({ params }: Props) {
  const post = await db.post.findUnique({
    where: { id: params.id },
  })

  if (!post) {
    notFound()
  }

  // PostFormに渡すためのデータ整形
  const initialData = {
    id: post.id,
    slug: post.slug,
    title: post.title,
    summary: post.summary || '',
    body: post.body,
    category: post.category,
    tags: post.tags,
    status: post.status,
    publishAt: post.publishAt ? new Date(post.publishAt).toISOString().slice(0, 16) : '',
    headerImageUrl: post.headerImageUrl || '',
    paywallEnabled: post.paywallEnabled,
    freeMode: post.freeMode,
    freeChars: post.freeChars || 300,
    freeSections: post.freeSections || 0,
    sourceUrls: post.sourceUrls,
    isFeatured: post.isFeatured,
    featuredOrder: post.featuredOrder || 0,
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">記事編集</h1>
      <PostForm mode="edit" initialData={initialData} />
    </div>
  )
}
