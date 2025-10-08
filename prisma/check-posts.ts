import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const post = await prisma.post.findUnique({
    where: { slug: 'weekly-summary-41' },
  })

  console.log('Post body:')
  console.log(post?.body)
  console.log('\n\nContains <!--:', post?.body.includes('<!--'))
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
