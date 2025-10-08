# トラブルシューティングガイド

このドキュメントは、プロジェクトで発生した問題とその解決策をまとめた技術リファレンスです。

## 目次

- [画像表示の問題](#画像表示の問題)
  - [Next.js Image最適化エラー](#nextjs-image最適化エラー)

---

## 画像表示の問題

### Next.js Image最適化エラー

**発生日**: 2025-10-08
**影響範囲**: GitHub Trendプロジェクトから投稿された記事のヘッダー画像

#### 症状

1. ブラウザで画像が壊れたアイコン（🖼️❌）として表示される
2. Chrome DevToolsのConsoleにエラーが表示される
3. NetworkタブでNext.js最適化URL（`/_next/image?url=...`）が失敗
4. しかし、直接画像URL（`/images/xxx.png`）にアクセスすると成功する

**実際のケース**:
```
画像URL: https://fuyuto-web-medai.vercel.app/images/github-trend-header.png
→ 直接アクセス: HTTP 200 OK ✅
→ Next.js経由: エラー ❌
```

#### 原因

Next.js の `<Image>` コンポーネントは、画像を自動的に最適化（リサイズ、圧縮、WebP変換）します。

しかし、**セキュリティ上の理由**から、外部URLからの画像を最適化する前に、`next.config.js` の `remotePatterns` で明示的に許可する必要があります。

**技術的背景**:
- Next.js Imageは`/_next/image`エンドポイントで画像最適化を処理
- リクエスト時に`remotePatterns`をチェック
- マッチしないドメインはセキュリティリスクとして拒否

**本ケースでの問題**:
```javascript
// 元の next.config.js
images: {
  remotePatterns: [
    { protocol: 'https', hostname: 'placehold.co' },
    { protocol: 'https', hostname: '*.supabase.co' },
    // ❌ *.vercel.app が含まれていない
  ],
}
```

画像URL（`https://fuyuto-web-medai.vercel.app/...`）のドメインが許可リストになかったため、Next.jsが拒否。

#### 診断手順

##### 1. 画像ファイルの存在確認

```bash
# 直接アクセスで画像が存在するか確認
curl -I https://fuyuto-web-medai.vercel.app/images/github-trend-header.png

# 期待される結果
HTTP/2 200
content-type: image/png
content-length: 1191128
```

✅ HTTP 200 なら画像ファイルは正常に配置されている

##### 2. Next.js最適化エンドポイントのテスト

```bash
# URLエンコードされたNext.js最適化URL
curl -I "https://fuyuto-web-medai.vercel.app/_next/image?url=https%3A%2F%2Ffuyuto-web-medai.vercel.app%2Fimages%2Fgithub-trend-header.png&w=1200&q=75"

# 成功時
HTTP/2 200
content-type: image/png
x-vercel-cache: HIT

# 失敗時（remotePatterns不足）
HTTP/2 400 Bad Request
または
HTTP/2 403 Forbidden
```

##### 3. 現在の設定確認

```bash
# remotePatterns設定を確認
cat next.config.js | grep -A 15 "remotePatterns"

# または
node -e "console.log(require('./next.config.js').images.remotePatterns)"
```

##### 4. ブラウザDevToolsでの確認

**Networkタブ**:
1. F12でDevToolsを開く
2. Networkタブを選択
3. ページをリロード
4. `github-trend-header.png`をフィルタ
5. リクエストURLとステータスコードを確認

**Consoleタブ**:
画像読み込みエラーが表示される：
```
GET https://fuyuto-web-medai.vercel.app/_next/image?url=... 400 (Bad Request)
```

#### 解決方法

##### ステップ1: next.config.jsを編集

```javascript
// next.config.js
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
      // ✅ 追加: Vercelドメイン
      {
        protocol: 'https',
        hostname: '*.vercel.app',
      },
    ],
  },
}

module.exports = nextConfig
```

**オプション**: 特定のサブドメインのみ許可する場合：
```javascript
{
  protocol: 'https',
  hostname: 'fuyuto-web-medai.vercel.app',
}
```

##### ステップ2: 変更をコミット

```bash
git add next.config.js
git commit -m "Fix: Add *.vercel.app to Next.js Image remotePatterns"
git push
```

##### ステップ3: デプロイ

Vercelが自動的にデプロイを開始。または手動で：
```bash
npx vercel --prod
```

##### ステップ4: 確認

デプロイ完了後（2〜3分）：

```bash
# 最適化URLが成功するか確認
curl -I "https://fuyuto-web-medai.vercel.app/_next/image?url=https%3A%2F%2Ffuyuto-web-medai.vercel.app%2Fimages%2Fgithub-trend-header.png&w=1200&q=75"

# 期待される結果
HTTP/2 200
content-type: image/png
```

ブラウザで確認：
1. 該当ページにアクセス
2. ハードリロード（Cmd+Shift+R / Ctrl+Shift+R）
3. 画像が表示されることを確認

#### 結果

**Before (修正前)**:
- 画像サイズ: 1.1MB（最適化なし）
- ステータス: エラー

**After (修正後)**:
- 画像サイズ: 233KB（Next.jsが自動圧縮）
- ステータス: 成功
- キャッシュ: 有効

#### 予防策

##### 新しい画像ホスティング先を追加する際のチェックリスト

- [ ] 画像URLのドメイン/ホスト名を確認
- [ ] `next.config.js`の`remotePatterns`に追加
- [ ] ローカルで動作確認（`npm run dev`）
- [ ] 変更をコミット
- [ ] デプロイ
- [ ] 本番環境で動作確認

##### よくあるパターン

| 画像ホスト | remotePattern設定 |
|-----------|------------------|
| Supabase Storage | `*.supabase.co` |
| Vercel本番環境 | `*.vercel.app` |
| Cloudinary | `res.cloudinary.com` |
| AWS S3 | `*.s3.amazonaws.com` |
| 独自ドメイン | `your-domain.com` |

#### 関連するエラーパターン

##### 1. キャッシュ問題

**症状**: 設定変更後も画像が表示されない

**原因**: ブラウザまたはVercelのキャッシュ

**解決**:
```bash
# ブラウザ: ハードリロード
# Mac: Cmd + Shift + R
# Windows: Ctrl + Shift + R

# Vercel: キャッシュクリア（必要に応じて）
npx vercel --prod --force
```

##### 2. タイムアウト問題

**症状**: 大きな画像で504 Gateway Timeout

**原因**: 画像最適化処理がタイムアウト

**解決**:
```javascript
// next.config.js
images: {
  deviceSizes: [640, 750, 828, 1080, 1200], // デフォルトサイズを減らす
  imageSizes: [16, 32, 48, 64, 96],
  minimumCacheTTL: 3600,
}
```

##### 3. CORS問題

**症状**: Chrome DevToolsのConsoleに「CORS policy」エラー

**原因**: 画像ホスト側のCORS設定

**解決**: 画像ホスト（S3, Cloudinaryなど）でCORSヘッダーを設定

#### 参考リンク

- [Next.js Image Optimization](https://nextjs.org/docs/app/building-your-application/optimizing/images)
- [remotePatterns API Reference](https://nextjs.org/docs/app/api-reference/components/image#remotepatterns)
- [Next.js Image Component](https://nextjs.org/docs/app/api-reference/components/image)

---

## その他のトラブルシューティング

今後、新しい問題が発生した場合はこのセクションに追加してください。

### テンプレート

```markdown
### [問題のタイトル]

**発生日**: YYYY-MM-DD
**影響範囲**: [影響を受けた機能やコンポーネント]

#### 症状
[何が起こったか]

#### 原因
[なぜ起こったか]

#### 診断手順
[問題を特定する方法]

#### 解決方法
[どのように修正したか]

#### 予防策
[今後同じ問題を防ぐ方法]
```
