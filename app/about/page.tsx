export const metadata = {
  title: 'About - Fuyuto Web',
  description: 'Fuyuto Webについて',
}

export default function AboutPage() {
  return (
    <main className="bg-neutral-50 py-12">
      <div className="max-w-3xl mx-auto px-8">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-neutral-900 mb-4">About</h1>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-8 space-y-6">
          <section>
            <h2 className="text-2xl font-bold text-neutral-900 mb-4">サイト概要</h2>
            <p className="text-neutral-700 leading-relaxed">
              Fuyuto Webは、医療DX・医療政策・AIに関する情報を発信する個人ブログです。
              週次のニュースまとめを中心に、中医協速報や医療現場からの視点を提供しています。
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-neutral-900 mb-4">コンテンツカテゴリ</h2>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <span className="text-neutral-900 font-bold">医療政策：</span>
                <span className="text-neutral-700">
                  診療報酬改定、中医協の議論、地域医療構想など
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-neutral-900 font-bold">実装（医療DX）：</span>
                <span className="text-neutral-700">
                  電子カルテ標準化、PHR、オンライン診療など
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-neutral-900 font-bold">AI・データ活用：</span>
                <span className="text-neutral-700">
                  AI問診、画像診断支援、ビッグデータ解析など
                </span>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-neutral-900 mb-4">お問い合わせ</h2>
            <p className="text-neutral-700 leading-relaxed">
              ご質問・ご意見は
              <a href="mailto:contact@example.com" className="text-blue-600 hover:underline ml-1">
                contact@example.com
              </a>
              までお願いします。
            </p>
          </section>
        </div>
      </div>
    </main>
  )
}
