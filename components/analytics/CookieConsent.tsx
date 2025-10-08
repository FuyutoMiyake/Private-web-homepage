'use client'

import { useState, useEffect } from 'react'
import { grantConsent, denyConsent, isGAEnabled } from '@/lib/gtag'

const CONSENT_KEY = 'cookie-consent'

export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    // Google Analytics が無効な場合は何も表示しない
    if (!isGAEnabled()) {
      return
    }

    // ローカルストレージから同意状態をチェック
    const consent = localStorage.getItem(CONSENT_KEY)

    if (!consent) {
      // 同意状態が保存されていない場合、バナーを表示
      setShowBanner(true)
    } else if (consent === 'granted') {
      // 以前に同意していた場合、同意を付与
      grantConsent()
    }
  }, [])

  const handleAccept = () => {
    localStorage.setItem(CONSENT_KEY, 'granted')
    grantConsent()
    setShowBanner(false)
  }

  const handleReject = () => {
    localStorage.setItem(CONSENT_KEY, 'denied')
    denyConsent()
    setShowBanner(false)
  }

  if (!showBanner) {
    return null
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
      <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex-1">
            <p className="text-sm text-gray-700">
              当サイトでは、サイトの利用状況を把握するためにGoogle Analyticsを使用しています。
              Cookieの使用に同意いただける場合は「同意する」をクリックしてください。
              <a
                href="/legal/privacy"
                className="text-blue-600 hover:text-blue-800 underline ml-1"
              >
                プライバシーポリシー
              </a>
            </p>
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <button
              onClick={handleReject}
              className="flex-1 sm:flex-none px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              拒否する
            </button>
            <button
              onClick={handleAccept}
              className="flex-1 sm:flex-none px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
            >
              同意する
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
