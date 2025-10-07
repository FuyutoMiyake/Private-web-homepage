/**
 * 本番環境（Vercel）へのAPI投稿テスト
 */

const API_URL = 'https://fuyuto-web-medai.vercel.app/api/admin/posts'
const API_KEY = 'blog_33inkdzl92i11c7ai3230lvfdtsev6s4'

async function testPost() {
  try {
    console.log('🧪 本番環境API投稿テスト開始')
    console.log('📍 API URL:', API_URL)
    console.log('🔑 API Key:', API_KEY.substring(0, 20) + '...')
    console.log()

    const testData = {
      slug: `test-production-post-${Date.now()}`,
      title: 'API投稿テスト（本番環境） - createdBy自動設定',
      summary: 'Vercel本番環境へのAPI投稿テストです。createdByが自動設定されることを確認します。',
      body: `# API投稿テスト（本番環境）

この記事は、Vercelにデプロイされた本番環境にAPI経由で投稿されたテスト記事です。

## 確認項目

- ✅ 本番環境でAPIキー認証が正常に動作すること
- ✅ createdByフィールドが自動設定されること
- ✅ 記事が正常にデータベースに保存されること
- ✅ 記事一覧に表示されること

投稿日時: ${new Date().toISOString()}
環境: Vercel Production
`,
      category: 'policy',
      tags: ['テスト', 'API', '本番環境', 'createdBy'],
      status: 'published',
      publishAt: new Date().toISOString(),
      headerImageUrl: '',
      paywallEnabled: false,
      freeMode: 'chars',
      freeChars: 300,
      freeSections: 0,
      sourceUrls: [],
    }

    console.log('📦 送信データ:')
    console.log(JSON.stringify(testData, null, 2))
    console.log()

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY,
      },
      body: JSON.stringify(testData),
    })

    console.log('📬 レスポンス:', response.status, response.statusText)
    console.log()

    if (!response.ok) {
      const error = await response.text()
      console.error('❌ エラー:', error)
      process.exit(1)
    }

    const result = await response.json()
    console.log('✅ 投稿成功！')
    console.log()
    console.log('📄 作成された記事:')
    console.log(JSON.stringify(result, null, 2))
    console.log()

    // createdByフィールドの確認
    if (result.createdBy) {
      console.log('✅ createdByフィールドが正常に設定されています:', result.createdBy)
    } else {
      console.log('⚠️  createdByフィールドがnullです')
    }

    console.log()
    console.log('🔗 記事URL: https://fuyuto-web-medai.vercel.app/post/' + result.slug)
    console.log('🔗 編集URL: https://fuyuto-web-medai.vercel.app/admin/posts/' + result.id + '/edit')
    console.log('🔗 記事一覧: https://fuyuto-web-medai.vercel.app/admin/posts')

  } catch (error) {
    console.error('❌ エラー:', error)
    process.exit(1)
  }
}

testPost()
