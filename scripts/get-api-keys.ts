import { db } from '../lib/db'

async function getApiKeys() {
  const keys = await db.apiKey.findMany()
  console.log(JSON.stringify(keys, null, 2))
  process.exit(0)
}

getApiKeys()
