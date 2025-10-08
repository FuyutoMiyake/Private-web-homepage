# トラブルシューティングガイド

このドキュメントは、プロジェクトで発生した過去の問題と解決策をまとめたものです。

## Next.js Image: 画像が表示されない

### 症状
- ブラウザで画像が壊れたアイコンとして表示される
- DevToolsのNetworkタブで画像リクエストが404またはエラー
- 直接画像URLにアクセスすると成功する（curl等）

### 原因
Next.js Imageコンポーネントの`remotePatterns`設定に、画像ドメインが含まれていない。

Next.jsは、外部URLからの画像を最適化する前に、`next.config.js`で明示的に許可する必要があります。

### 診断方法

1. **画像URLを確認**
   ```bash
   # 直接アクセスで画像が存在するか確認
   curl -I https://example.com/images/header.png
   # → HTTP 200 なら画像は存在する
   ```

2. **Next.js最適化URLを確認**
   ```bash
   # Next.jsが生成する最適化URLをテスト
   curl -I "https://your-site.vercel.app/_next/image?url=https%3A%2F%2Fexample.com%2Fimage.png&w=1200&q=75"
   # → HTTP 200 なら設定OK、エラーなら remotePatterns が不足
   ```

3. **現在の設定を確認**
   ```bash
   cat next.config.js | grep -A 10 "remotePatterns"
   ```

### 解決方法

`next.config.js`の`images.remotePatterns`に画像ドメインを追加：

```javascript
// next.config.js
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'your-domain.com',
      },
      // ワイルドカード使用可能
      {
        protocol: 'https',
        hostname: '*.vercel.app',
      },
    ],
  },
}
```

### 実際のケース: GitHub Trend画像（2025-10-08）

**問題**:
- 画像URL: `https://fuyuto-web-medai.vercel.app/images/github-trend-header.png`
- `*.vercel.app`が`remotePatterns`に含まれていなかった

**解決**:
```javascript
{
  protocol: 'https',
  hostname: '*.vercel.app',
}
```
を追加

**結果**: 画像が正常に表示され、1.1MB → 233KBに自動最適化された

### 予防策

新しい画像ホスティング先を追加する場合：
1. 画像URLのドメインを確認
2. `next.config.js`の`remotePatterns`に追加
3. デプロイ
4. ブラウザでハードリロード（Cmd+Shift+R）

### 関連ドキュメント
- [Next.js Image Optimization](https://nextjs.org/docs/app/building-your-application/optimizing/images)
- [remotePatterns設定](https://nextjs.org/docs/app/api-reference/components/image#remotepatterns)
