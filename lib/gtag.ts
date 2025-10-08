/**
 * Google Analytics (gtag.js) ヘルパー関数
 */

export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID

// Google Analytics が利用可能かチェック
export const isGAEnabled = (): boolean => {
  return !!GA_MEASUREMENT_ID && typeof window !== 'undefined' && 'gtag' in window
}

// gtag 関数の型定義
type GtagCommand = 'config' | 'event' | 'consent'

declare global {
  interface Window {
    gtag: (
      command: GtagCommand,
      targetId: string | 'default' | 'update',
      config?: Record<string, any>
    ) => void
    dataLayer: any[]
  }
}

/**
 * ページビューを送信
 */
export const pageview = (url: string) => {
  if (!isGAEnabled()) return

  window.gtag('config', GA_MEASUREMENT_ID!, {
    page_path: url,
  })
}

/**
 * カスタムイベントを送信
 */
export const event = ({
  action,
  category,
  label,
  value,
}: {
  action: string
  category?: string
  label?: string
  value?: number
}) => {
  if (!isGAEnabled()) return

  window.gtag('event', action, {
    event_category: category,
    event_label: label,
    value: value,
  })
}

/**
 * Cookie同意状態を更新（Consent Mode v2）
 */
export const grantConsent = () => {
  if (!isGAEnabled()) return

  window.gtag('consent', 'update', {
    analytics_storage: 'granted',
    ad_storage: 'granted',
  })
}

/**
 * Cookie同意を拒否（Consent Mode v2）
 */
export const denyConsent = () => {
  if (!isGAEnabled()) return

  window.gtag('consent', 'update', {
    analytics_storage: 'denied',
    ad_storage: 'denied',
  })
}

/**
 * Consent Modeのデフォルト設定（ページロード時に呼び出す）
 */
export const setDefaultConsent = () => {
  if (!isGAEnabled()) return

  window.gtag('consent', 'default', {
    analytics_storage: 'denied',
    ad_storage: 'denied',
    wait_for_update: 500,
  })
}
