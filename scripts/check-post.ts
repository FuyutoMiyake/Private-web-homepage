import { db } from '../lib/db'

async function checkPost() {
  const post = await db.post.findUnique({
    where: { slug: 'github-trend-ai-code-reviewer-1759922119' },
    select: {
      id: true,
      title: true,
      slug: true,
      headerImageUrl: true,
      createdAt: true,
    }
  })

  console.log(JSON.stringify(post, null, 2))
  process.exit(0)
}

checkPost()
