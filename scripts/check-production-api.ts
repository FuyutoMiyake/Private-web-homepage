/**
 * 本番環境のAPIエンドポイントが最新コードか確認
 */

const API_URL = 'https://fuyuto-web-medai.vercel.app/api/admin/posts'

async function checkApi() {
  try {
    console.log('🔍 本番環境のAPIエンドポイントを確認中...')
    console.log()

    // APIキーなしでアクセス
    console.log('テスト1: APIキーなしでアクセス')
    const response1 = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        slug: 'test',
        title: 'Test',
        body: 'Test',
        category: 'policy',
      }),
    })

    const result1 = await response1.json()
    console.log('ステータス:', response1.status)
    console.log('レスポンス:', result1)
    console.log()

    if (response1.status === 401) {
      console.log('✅ 最新コードがデプロイされています（APIキー認証が必須）')
    } else if (response1.status === 400 || response1.status === 201) {
      console.log('⚠️  古いコードがまだデプロイされています（APIキー認証なし）')
    }
    console.log()

    // 現在のデプロイタイムスタンプを確認（HTMLにビルド時間が含まれていることがある）
    console.log('本番サイトのトップページを確認中...')
    const homeResponse = await fetch('https://fuyuto-web-medai.vercel.app/')
    console.log('ホームページステータス:', homeResponse.status)

  } catch (error) {
    console.error('❌ エラー:', error)
  }
}

checkApi()
