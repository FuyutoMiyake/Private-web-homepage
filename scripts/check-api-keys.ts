import { db } from '../lib/db'

async function main() {
  try {
    const keys = await db.apiKey.findMany()
    console.log('=== APIキー一覧 ===')
    console.log(JSON.stringify(keys, null, 2))
  } catch (error) {
    console.error('エラー:', error)
  } finally {
    await db.$disconnect()
  }
}

main()
