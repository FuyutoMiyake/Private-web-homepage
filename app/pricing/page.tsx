import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: '購読プラン - Fuyuto Web',
  description: '医療政策・医療DX・AIに関する記事の購読プランをご紹介',
}

export default function PricingPage() {
  const isStripeEnabled = process.env.FEATURE_STRIPE_ENABLED === 'true'

  return (
    <main className="min-h-screen bg-neutral-50">
      <div className="max-w-[1216px] mx-auto px-4 lg:px-8 py-16 lg:py-24">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl lg:text-5xl font-extrabold text-neutral-900 mb-4">
            購読プラン
          </h1>
          <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
            医療政策・医療DX・AIに関する深掘り記事やニュースレターを購読できます
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Free Plan */}
          <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-neutral-900 mb-2">無料プラン</h2>
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-4xl font-extrabold text-neutral-900">¥0</span>
                <span className="text-neutral-600">/月</span>
              </div>
            </div>

            <ul className="space-y-3 mb-8">
              <li className="flex items-start gap-2 text-neutral-700">
                <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>記事のプレビュー閲覧</span>
              </li>
              <li className="flex items-start gap-2 text-neutral-700">
                <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>週次まとめ記事の閲覧</span>
              </li>
              <li className="flex items-start gap-2 text-neutral-700">
                <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>カテゴリ別記事検索</span>
              </li>
            </ul>

            <Link
              href="/post"
              className="block w-full text-center px-6 py-3 bg-neutral-100 text-neutral-900 font-semibold rounded-lg hover:bg-neutral-200 transition-colors"
            >
              記事を読む
            </Link>
          </div>

          {/* Premium Plan */}
          <div className="bg-white rounded-lg shadow-lg border-2 border-neutral-900 p-8 relative">
            <div className="absolute top-0 right-0 bg-neutral-900 text-white px-4 py-1 text-sm font-semibold rounded-bl-lg rounded-tr-lg">
              おすすめ
            </div>

            <div className="mb-6">
              <h2 className="text-2xl font-bold text-neutral-900 mb-2">プレミアムプラン</h2>
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-4xl font-extrabold text-neutral-900">¥500</span>
                <span className="text-neutral-600">/月</span>
              </div>
            </div>

            <ul className="space-y-3 mb-8">
              <li className="flex items-start gap-2 text-neutral-700">
                <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="font-semibold">すべての記事の全文閲覧</span>
              </li>
              <li className="flex items-start gap-2 text-neutral-700">
                <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="font-semibold">週次ニュースレター配信</span>
              </li>
              <li className="flex items-start gap-2 text-neutral-700">
                <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>記事へのコメント機能</span>
              </li>
              <li className="flex items-start gap-2 text-neutral-700">
                <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>アーカイブへの無制限アクセス</span>
              </li>
            </ul>

            {isStripeEnabled ? (
              <Link
                href="/api/pay/checkout"
                className="block w-full text-center px-6 py-3 bg-neutral-900 text-white font-semibold rounded-lg hover:bg-neutral-800 transition-colors"
              >
                購読を開始する
              </Link>
            ) : (
              <button
                disabled
                className="block w-full text-center px-6 py-3 bg-neutral-300 text-neutral-500 font-semibold rounded-lg cursor-not-allowed"
              >
                準備中
              </button>
            )}
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-12 text-center text-neutral-600 text-sm max-w-2xl mx-auto">
          <p>
            ※ プレミアムプランはクレジットカード決済（Stripe）でのお支払いとなります
            <br />
            ※ いつでもキャンセル可能です
          </p>
        </div>
      </div>
    </main>
  )
}
