/**
 * API経由で記事投稿をテストするスクリプト
 */

const API_URL = 'http://localhost:3000/api/admin/posts'
const API_KEY = 'blog_33inkdzl92i11c7ai3230lvfdtsev6s4'

async function testPost() {
  try {
    console.log('🧪 API投稿テスト開始')
    console.log('📍 API URL:', API_URL)
    console.log('🔑 API Key:', API_KEY.substring(0, 20) + '...')
    console.log()

    const testData = {
      slug: `test-post-${Date.now()}`,
      title: 'APIテスト投稿 - createdBy自動設定',
      summary: 'このテスト投稿では、APIキー認証時にcreatedByが自動設定されることを確認します。',
      body: `# APIテスト投稿

この記事は、API経由で投稿されたテスト記事です。

## 確認項目

- ✅ APIキー認証が正常に動作すること
- ✅ createdByフィールドが自動設定されること
- ✅ 記事が正常にデータベースに保存されること

投稿日時: ${new Date().toISOString()}
`,
      category: 'policy',
      tags: ['テスト', 'API', 'createdBy'],
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
    console.log('🔗 記事URL: http://localhost:3000/post/' + result.slug)
    console.log('🔗 編集URL: http://localhost:3000/admin/posts/' + result.id + '/edit')

  } catch (error) {
    console.error('❌ エラー:', error)
    process.exit(1)
  }
}

testPost()
