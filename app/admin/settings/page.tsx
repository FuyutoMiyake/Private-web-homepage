import { db } from '@/lib/db'
import { SettingsForm } from './SettingsForm'

export default async function SettingsPage() {
  let settings = await db.siteSettings.findUnique({
    where: { id: 1 }
  })

  // 初期レコードがない場合は作成
  if (!settings) {
    settings = await db.siteSettings.create({
      data: {
        id: 1,
        siteTitle: 'Fuyuto Web',
        commentMode: 'pre_moderation',
        paywallDefaultMode: 'marker'
      }
    })
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">サイト設定</h1>
      <SettingsForm settings={settings} />
    </div>
  )
}
