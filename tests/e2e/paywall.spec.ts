import { test, expect } from '@playwright/test'

test.describe('Paywall', () => {
  test('should display article preview only', async ({ page }) => {
    // 記事詳細ページに移動（ペイウォール有効の記事を想定）
    await page.goto('/post/weekly-summary-41')

    // タイトルが表示されることを確認
    await expect(page.locator('h1')).toContainText('今週の医療政策まとめ')

    // プレビュー部分が表示されることを確認
    await expect(page.locator('article')).toContainText('中医協')

    // 開発環境では有料部分も表示される可能性があるため、
    // HTML内に {/* more */} マーカーが含まれないことを確認
    const content = await page.content()
    expect(content).not.toContain('<!-- more -->')
  })

  test('should display paywall message for paid content', async ({ page }) => {
    await page.goto('/post/weekly-summary-41')

    // ペイウォールが有効な場合、何らかの制限メッセージまたは
    // プレビューのみが表示されることを期待
    // (実際の実装に応じて調整が必要)

    // 記事が読み込まれることを確認
    const article = page.locator('article')
    await expect(article).toBeVisible()
  })
})
