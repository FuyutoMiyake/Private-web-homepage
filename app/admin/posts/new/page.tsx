import { PostForm } from '../PostForm'

export default function NewPostPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">新規記事作成</h1>
      <PostForm mode="create" />
    </div>
  )
}
