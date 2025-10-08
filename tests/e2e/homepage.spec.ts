import { test, expect } from '@playwright/test'

test.describe('Homepage', () => {
  test('should display site title and navigation', async ({ page }) => {
    await page.goto('/')

    // サイトタイトルの確認
    await expect(page.getByText('Fuyuto Web')).toBeVisible()

    // ナビゲーションの確認
    await expect(page.getByRole('link', { name: '記事' })).toBeVisible()
    await expect(page.getByRole('link', { name: '医療政策' })).toBeVisible()
    await expect(page.getByRole('link', { name: '実装（医療DX）' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'AI・データ活用' })).toBeVisible()
    await expect(page.getByRole('link', { name: '検索' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'About' })).toBeVisible()
  })

  test('should display featured posts', async ({ page }) => {
    await page.goto('/')

    // 注目記事セクションの確認
    const featuredSection = page.locator('text=注目記事').first()
    await expect(featuredSection).toBeVisible()
  })

  test('should display category cards', async ({ page }) => {
    await page.goto('/')

    // カテゴリカードの確認
    await expect(page.locator('text=医療政策')).toBeVisible()
    await expect(page.locator('text=実装（医療DX）')).toBeVisible()
    await expect(page.locator('text=AI・データ活用')).toBeVisible()
  })
})
