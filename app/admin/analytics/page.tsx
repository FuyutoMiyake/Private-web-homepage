import { fetchAnalyticsData } from '@/lib/analytics'

export default async function AnalyticsPage() {
  const data = await fetchAnalyticsData()

  if (!data) {
    return (
      <div className="max-w-6xl">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">アクセス解析</h1>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-yellow-900 mb-2">
            Google Analytics未設定
          </h2>
          <p className="text-yellow-800 mb-4">
            Google Analytics 4を接続するには、以下の環境変数を設定してください:
          </p>
          <ul className="list-disc list-inside text-sm text-yellow-800 space-y-2">
            <li>
              <code className="bg-yellow-100 px-2 py-1 rounded">GA4_PROPERTY_ID</code> -
              Google Analytics 4 プロパティID（例: 123456789）
            </li>
            <li>
              <code className="bg-yellow-100 px-2 py-1 rounded">GA4_CREDENTIALS</code> -
              サービスアカウントJSONをBase64エンコードした文字列
            </li>
          </ul>
          <div className="mt-4 text-sm text-yellow-800">
            <p className="font-semibold mb-1">設定手順:</p>
            <ol className="list-decimal list-inside space-y-1 ml-2">
              <li>Google Cloud Consoleでサービスアカウントを作成</li>
              <li>Google Analytics Data API を有効化</li>
              <li>サービスアカウントにGA4プロパティへのアクセス権を付与</li>
              <li>サービスアカウントのJSONキーをダウンロード</li>
              <li>
                JSONをBase64エンコード:{' '}
                <code className="bg-yellow-100 px-1">
                  cat service-account.json | base64
                </code>
              </li>
            </ol>
          </div>
        </div>
      </div>
    )
  }

  const formatNumber = (num: number) => num.toLocaleString('ja-JP')

  return (
    <div className="max-w-6xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">アクセス解析</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Today */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-1">今日</h3>
          <p className="text-3xl font-bold text-gray-900">{formatNumber(data.todayUsers)}</p>
          <p className="text-sm text-gray-600 mt-1">訪問者数</p>
          <p className="text-sm text-gray-500 mt-2">
            PV: {formatNumber(data.todayPageViews)}
          </p>
        </div>

        {/* This Week */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-1">過去7日間</h3>
          <p className="text-3xl font-bold text-gray-900">{formatNumber(data.weekUsers)}</p>
          <p className="text-sm text-gray-600 mt-1">訪問者数</p>
          <p className="text-sm text-gray-500 mt-2">
            PV: {formatNumber(data.weekPageViews)}
          </p>
        </div>

        {/* This Month */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-1">過去30日間</h3>
          <p className="text-3xl font-bold text-gray-900">{formatNumber(data.monthUsers)}</p>
          <p className="text-sm text-gray-600 mt-1">訪問者数</p>
          <p className="text-sm text-gray-500 mt-2">
            PV: {formatNumber(data.monthPageViews)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Pages */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">人気記事（過去7日間）</h2>
          </div>
          <div className="p-6">
            {data.topPages.length === 0 ? (
              <p className="text-gray-500 text-center py-4">データがありません</p>
            ) : (
              <div className="space-y-3">
                {data.topPages.map((page, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {page.path}
                      </p>
                    </div>
                    <div className="ml-4 flex-shrink-0">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {formatNumber(page.views)} PV
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Traffic Sources */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              流入元（過去7日間）
            </h2>
          </div>
          <div className="p-6">
            {data.trafficSources.length === 0 ? (
              <p className="text-gray-500 text-center py-4">データがありません</p>
            ) : (
              <div className="space-y-3">
                {data.trafficSources.map((source, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {source.source === '(direct)' ? 'ダイレクト' : source.source}
                      </p>
                    </div>
                    <div className="ml-4 flex-shrink-0">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {formatNumber(source.users)} ユーザー
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
