import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting seed...')

  // Featured Posts (注目記事)
  const post1 = await prisma.post.create({
    data: {
      slug: 'weekly-summary-41',
      title: '今週の医療政策まとめ（第41週）',
      summary:
        '中医協における診療報酬改定の議論、オンライン診療の規制緩和、医療DX推進本部の最新動向をまとめました。',
      body: `# 今週の医療政策まとめ（第41週）

中医協における診療報酬改定の議論、オンライン診療の規制緩和、医療DX推進本部の最新動向をまとめました。

<!-- more -->

## 診療報酬改定の議論

2024年度の診療報酬改定に向けた議論が本格化しています...

## オンライン診療の規制緩和

厚生労働省は...`,
      category: 'policy',
      tags: ['医療政策', '診療報酬', '中医協'],
      status: 'published',
      publishAt: new Date('2025-10-05'),
      paywallEnabled: false,
      isFeatured: true,
      featuredOrder: 1,
      sourceUrls: ['https://example.com/source1'],
    },
  })

  const post2 = await prisma.post.create({
    data: {
      slug: 'ehr-standardization',
      title: '電子カルテ標準化の最新動向',
      summary: 'HL7 FHIR規格の採用が加速。2026年までに全国の医療機関での導入を目指す...',
      body: `# 電子カルテ標準化の最新動向

HL7 FHIR規格の採用が加速しています。

<!-- more -->

## FHIR規格とは

Fast Healthcare Interoperability Resources...`,
      category: 'dx',
      tags: ['医療DX', '電子カルテ', 'FHIR'],
      status: 'published',
      publishAt: new Date('2025-09-28'),
      paywallEnabled: false,
      isFeatured: true,
      featuredOrder: 2,
      sourceUrls: [],
    },
  })

  const post3 = await prisma.post.create({
    data: {
      slug: 'online-qualification',
      title: 'オンライン資格確認の義務化',
      summary: 'マイナ保険証の普及に向け、2025年4月からオンライン資格確認が原則義務化...',
      body: `# オンライン資格確認の義務化

マイナ保険証の普及に向け、2025年4月からオンライン資格確認が原則義務化されます。

<!-- more -->

## 義務化のスケジュール

2025年4月1日から...`,
      category: 'policy',
      tags: ['医療政策', '保険証', 'マイナンバーカード'],
      status: 'published',
      publishAt: new Date('2025-09-20'),
      paywallEnabled: false,
      isFeatured: true,
      featuredOrder: 3,
      sourceUrls: [],
    },
  })

  // Regular Posts
  const post4 = await prisma.post.create({
    data: {
      slug: 'ai-diagnostics-2025',
      title: 'AI画像診断の最新事例',
      summary: '2025年に承認されたAI画像診断システムの紹介と臨床での活用事例',
      body: `# AI画像診断の最新事例

2025年に承認されたAI画像診断システムを紹介します。

## 最新の承認事例

...`,
      category: 'dx',
      tags: ['AI', '画像診断', '医療DX'],
      status: 'published',
      publishAt: new Date('2025-10-03'),
      paywallEnabled: true,
      freeMode: 'marker',
      priceJpy: 500,
      isFeatured: false,
      sourceUrls: [],
    },
  })

  const post5 = await prisma.post.create({
    data: {
      slug: 'regional-medical-vision',
      title: '地域医療構想の進捗状況',
      summary: '各都道府県における地域医療構想の進捗と課題',
      body: `# 地域医療構想の進捗状況

2025年を目標とした地域医療構想の進捗状況を都道府県別に分析します。

## 全国的な傾向

...`,
      category: 'policy',
      tags: ['医療政策', '地域医療構想'],
      status: 'published',
      publishAt: new Date('2025-10-01'),
      paywallEnabled: false,
      isFeatured: false,
      sourceUrls: [],
    },
  })

  const post6 = await prisma.post.create({
    data: {
      slug: 'phr-platform-comparison',
      title: 'PHRプラットフォーム比較',
      summary: '主要なPHR（Personal Health Record）プラットフォームの機能比較',
      body: `# PHRプラットフォーム比較

主要なPHRプラットフォームの機能を比較します。

## 比較対象

1. マイナポータル
2. Google Health
3. Apple Health

...`,
      category: 'dx',
      tags: ['医療DX', 'PHR'],
      status: 'published',
      publishAt: new Date('2025-09-25'),
      paywallEnabled: false,
      isFeatured: false,
      sourceUrls: [],
    },
  })

  const post7 = await prisma.post.create({
    data: {
      slug: 'online-diagnosis-guidelines',
      title: 'オンライン診療のガイドライン改定',
      summary: 'オンライン診療の適切な実施に関する指針の改定内容',
      body: `# オンライン診療のガイドライン改定

オンライン診療の適切な実施に関する指針が改定されました。

## 主な改定内容

...`,
      category: 'dx',
      tags: ['医療DX', 'オンライン診療'],
      status: 'published',
      publishAt: new Date('2025-09-18'),
      paywallEnabled: false,
      isFeatured: false,
      sourceUrls: [],
    },
  })

  const post8 = await prisma.post.create({
    data: {
      slug: 'medical-fee-revision-2024',
      title: '2024年度診療報酬改定の全体像',
      summary: '診療報酬改定の改定率と主要項目の解説',
      body: `# 2024年度診療報酬改定の全体像

2024年度診療報酬改定の全体像を解説します。

## 改定率

医科: +0.88%
歯科: +0.82%
調剤: +0.16%

...`,
      category: 'policy',
      tags: ['医療政策', '診療報酬'],
      status: 'published',
      publishAt: new Date('2025-09-15'),
      paywallEnabled: false,
      isFeatured: false,
      sourceUrls: [],
    },
  })

  // Site Settings
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

  console.log('✅ Seed completed!')
  console.log(`Created posts:`)
  console.log(`  - ${post1.slug}`)
  console.log(`  - ${post2.slug}`)
  console.log(`  - ${post3.slug}`)
  console.log(`  - ${post4.slug}`)
  console.log(`  - ${post5.slug}`)
  console.log(`  - ${post6.slug}`)
  console.log(`  - ${post7.slug}`)
  console.log(`  - ${post8.slug}`)
  console.log(`Created site settings with ID: ${siteSettings.id}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
