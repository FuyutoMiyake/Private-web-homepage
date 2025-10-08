import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔧 Fixing HTML comments in posts...')

  const posts = await prisma.post.findMany()

  for (const post of posts) {
    // Replace HTML comments with MDX-compatible comment syntax
    const fixedBody = post.body.replace(/<!--\s*more\s*-->/gi, '{/* more */}')

    await prisma.post.update({
      where: { id: post.id },
      data: { body: fixedBody },
    })

    console.log(`✅ Fixed: ${post.slug}`)
  }

  console.log(`✅ Fixed ${posts.length} posts`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
