import { db } from '../lib/db'

async function main() {
  const post = await db.post.findFirst({
    where: { slug: 'weekly-summary-41' },
    select: { id: true }
  })
  console.log(post?.id || 'not found')
  await db.$disconnect()
}

main().catch(console.error)
