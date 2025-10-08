import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding SiteSettings...')

  const siteSettings = await prisma.siteSettings.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      siteTitle: 'Fuyuto Web',
      snsTwitter: 'https://x.com/fuyuto_med',
      snsLinkedin: '',
      snsLine: '',
      snsInstagram: '',
      snsYoutube: '',
      snsTiktok: '',
      snsFacebook: '',
    },
  })

  console.log(`✅ Created/Updated site settings with ID: ${siteSettings.id}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
