# 医療ニュース集約ブログ

Next.js 14 (App Router) + Supabase + Vercel で構築する、医療政策/医療DX専門のニュースサイト。

## 🎯 特徴

- **ペイウォール**: 記事ごとに無料範囲と価格を設定可能（マーカー/文字数/セクション）
- **Topics（特集）**: 関連記事をグルーピング、FAQ・用語集付き
- **全文検索**: PostgreSQL tsvector による高速検索、日本語対応
- **コメント機能**: 承認制/即時公開を管理画面で切替可能
- **SNS統合**: 7種類のSNSリンクを管理画面から設定
- **メール配信**: Resend + React Email（現在はDRY RUNモード）
- **Stripe準備**: Feature Flag で将来の有料化に備えた骨組み実装済み
- **セキュリティ**: Cloudflare Turnstile（CAPTCHA）+ Rate Limiting（Vercel KV）

---

## 📦 技術スタック

| カテゴリ | 技術 |
|---------|------|
| **フレームワーク** | Next.js 14 (App Router), React Server Components |
| **言語** | TypeScript (strict mode) |
| **DB** | Supabase (PostgreSQL) |
| **ORM** | Prisma |
| **KV/キャッシュ** | Vercel KV (Redis) |
| **ホスティング** | Vercel |
| **メール** | Resend + React Email |
| **決済** | Stripe (将来) |
| **CAPTCHA** | Cloudflare Turnstile |
| **監視** | Sentry, Vercel Analytics, GA4 |
| **テスト** | Playwright (E2E) |

---

## 🚀 セットアップ

### **必要要件**

- Node.js 18.x 以上
- pnpm 8.x 以上（または npm/yarn）
- Supabase アカウント
- Vercel アカウント

### **1. リポジトリのクローン**

```bash
git clone <repository-url>
cd 個人ブログ
```

### **2. 依存関係のインストール**

```bash
pnpm install
```

### **3. 環境変数の設定**

`.env.example` をコピーして `.env.local` を作成:

```bash
cp .env.example .env.local
```

必須の環境変数:

```bash
# Database (Supabase)
DATABASE_URL=postgresql://...

# Vercel KV (ローカル開発時は不要)
KV_URL=redis://...
KV_REST_API_URL=https://...
KV_REST_API_TOKEN=...

# Turnstile（テストキー）
NEXT_PUBLIC_TURNSTILE_SITEKEY=1x00000000000000000000AA
TURNSTILE_SECRET=1x0000000000000000000000000000000AA
E2E_TEST_MODE=true

# Feature Flags
FEATURE_STRIPE_ENABLED=false
FEATURE_EMAIL_ENABLED=false
EMAIL_TEST_MODE=true
```

### **4. データベースのセットアップ**

#### Supabase プロジェクト作成

1. [Supabase Dashboard](https://app.supabase.com/) でプロジェクト作成
2. `Settings > Database` から接続文字列を取得
3. `.env.local` の `DATABASE_URL` に設定

#### マイグレーション実行

```bash
# PostgreSQL拡張を有効化（Supabaseダッシュボード > SQL Editor で実行）
CREATE EXTENSION IF NOT EXISTS pg_trgm;

# Prismaマイグレーション
npx prisma migrate dev

# 初期データ投入（任意）
npx prisma db seed
```

#### Prisma Studio で確認

```bash
npx prisma studio
# http://localhost:5555 で開く
```

### **5. 開発サーバー起動**

```bash
pnpm dev
```

ブラウザで http://localhost:3000 を開く

---

## 📁 プロジェクト構造

```
/
├── app/
│   ├── (public)/          # 公開ページ
│   │   ├── page.tsx       # トップページ
│   │   ├── topics/        # 特集一覧・詳細
│   │   ├── news/          # 記事一覧・詳細
│   │   ├── search/        # 検索ページ
│   │   └── newsletter/    # ニュースレター
│   ├── (admin)/           # 管理画面
│   │   └── admin/
│   │       ├── posts/     # 記事管理
│   │       ├── comments/  # コメント承認
│   │       ├── settings/  # サイト設定
│   │       └── email/     # メールログ
│   └── api/               # API Routes
│       ├── posts/         # 記事API
│       ├── admin/         # 管理API
│       ├── comments/      # コメントAPI
│       ├── search/        # 検索API
│       ├── email/         # メールAPI
│       └── pay/           # 決済API（Seeds）
├── components/
│   ├── home/              # トップページ用
│   ├── paywall/           # ペイウォール
│   ├── sns/               # SNSリンク
│   └── ui/                # 共通UIコンポーネント
├── lib/
│   ├── db.ts              # Prisma Client
│   ├── kv.ts              # Vercel KV ヘルパー
│   ├── paywall.ts         # ペイウォールロジック
│   ├── excerpt.ts         # 抜粋生成
│   ├── captcha.ts         # Turnstile検証
│   ├── email/             # メール送信
│   ├── payments/          # Stripe（Seeds）
│   └── queries/           # DBクエリ
├── emails/
│   ├── templates/         # React Email テンプレート
│   └── components/        # メール用コンポーネント
├── prisma/
│   └── schema.prisma      # DBスキーマ
├── tests/
│   └── e2e/               # Playwright テスト
├── .env.example           # 環境変数テンプレート
├── REQUIREMENTS.md        # 技術要件書
├── CLAUDE_IMPLEMENTATION.md  # 実装指示プロンプト
└── README.md              # このファイル
```

---

## 🛠️ 主要コマンド

### **開発**

```bash
# 開発サーバー起動
pnpm dev

# 型チェック
pnpm type-check

# Linter実行
pnpm lint

# Linter自動修正
pnpm lint:fix
```

### **データベース**

```bash
# マイグレーション作成
npx prisma migrate dev --name <migration-name>

# Prisma Client 再生成
npx prisma generate

# Prisma Studio起動（DB GUI）
npx prisma studio

# スキーマ同期（開発用、データ削除注意）
npx prisma db push
```

### **メールテンプレート**

```bash
# メールプレビュー開発サーバー
pnpm email:dev
# http://localhost:3000 で開く

# メールテンプレートをHTMLにビルド
pnpm email:build
```

### **テスト**

```bash
# Playwright E2Eテスト実行
pnpm test:e2e

# UI モードでテスト
pnpm test:e2e:ui

# 特定のテストファイルのみ実行
pnpm test:e2e tests/e2e/paywall.spec.ts

# Playwright Inspector（デバッグ）
PWDEBUG=1 pnpm test:e2e
```

### **ビルド/デプロイ**

```bash
# 本番ビルド
pnpm build

# 本番サーバー起動（ローカル確認用）
pnpm start

# Vercel デプロイ
vercel deploy

# 本番デプロイ
vercel deploy --prod
```

---

## 🔐 セキュリティ

### **Cloudflare Turnstile（CAPTCHA）**

- **本番環境**: 実際のサイトキーを使用
- **テスト環境**: `E2E_TEST_MODE=true` で無効化
- **テストキー**: `1x00000000000000000000AA`（Cloudflare公式）

### **Rate Limiting（Vercel KV）**

| エンドポイント | 制限 |
|---------------|------|
| コメント投稿 | 5件/10分/IP |
| 検索 | 30件/分/IP |
| 管理API | 10件/分/APIキー |
| メール送信 | 10件/分/IP |

### **XSS対策**

- すべてのユーザー入力を `DOMPurify` でサニタイズ
- MDX レンダリングは `rehype-sanitize` 使用

### **CSRF対策**

- Server Actions: Next.js 自動保護
- API Routes: `next-csrf` ミドルウェア（推奨）

### **Supabase RLS（Row Level Security）**

#### 有効化手順

1. Supabase Dashboard > SQL Editor で以下を実行:

```sql
-- Posts: published のみ公開
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY posts_public_read
ON posts FOR SELECT
TO public
USING (status = 'published');

-- Comments: approved のみ公開
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY comments_public_read_approved
ON comments FOR SELECT
TO public
USING (status = 'approved');

-- Entitlements: 本人のみ参照可
ALTER TABLE entitlements ENABLE ROW LEVEL SECURITY;

CREATE POLICY entitlements_owner_read
ON entitlements FOR SELECT
TO authenticated
USING (auth.uid() = user_id);
```

2. 環境変数に service_role キーを設定:

```bash
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### 確認方法

```bash
# 未認証で draft 記事が読めないことを確認
curl https://yoursite.com/api/posts?status=draft
# → 空配列が返る（RLS が有効）

# service_role キーで読めることを確認
curl -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  https://yourproject.supabase.co/rest/v1/posts?status=eq.draft
# → draft 記事が返る
```

### **管理画面アクセス制御**

#### 方式A: Basic 認証

```bash
ADMIN_BASIC_USER=admin
ADMIN_BASIC_PASS=your-secure-password
```

ブラウザで `/admin` にアクセス → ユーザー名/パスワード入力

#### 方式B: IP 許可リスト（推奨）

```bash
ADMIN_ALLOW_IPS=203.0.113.10,198.51.100.0/24
```

- カンマ区切りで複数指定可
- CIDR 表記対応（`/24` など）
- IP 許可リストが設定されている場合、Basic 認証はスキップされる

#### 確認方法

```bash
# 許可されていない IP からアクセス
curl https://yoursite.com/admin
# → 403 Forbidden

# 許可された IP からアクセス（または Basic 認証）
curl -u admin:password https://yoursite.com/admin
# → 200 OK
```

### **Idempotency Key（多重処理防止）**

#### 使い方

```bash
# 同じ Idempotency-Key で2回実行
curl -X POST https://yoursite.com/api/admin/posts \
  -H "Authorization: Bearer $ADMIN_JWT" \
  -H "Idempotency-Key: 550e8400-e29b-41d4-a716-446655440000" \
  -d '{"title":"テスト","slug":"test",...}'

# 1回目: 201 Created
# 2回目: 409 Conflict（重複検知）
```

#### 適用対象

- `POST /api/admin/posts`
- `PUT /api/admin/posts/:id`
- `DELETE /api/admin/posts/:id`
- `POST /api/admin/publish/:id`

---

## 🔍 SEO/メタデータ

### **検索ページの noindex 設定**

検索結果ページは noindex にして、検索エンジンのクロール負荷を軽減。

```typescript
// app/search/page.tsx
export const metadata = {
  robots: {
    index: false,
    follow: true
  }
}
```

### **NewsArticle 構造化データ**

ペイウォール記事には `isAccessibleForFree: false` を設定。

```typescript
const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'NewsArticle',
  headline: post.title,
  datePublished: post.publishAt?.toISOString(),
  isAccessibleForFree: !post.paywallEnabled,
  hasPart: post.paywallEnabled ? {
    '@type': 'WebPageElement',
    isAccessibleForFree: true,
    cssSelector: '.article-preview'
  } : undefined
}
```

### **OGP/RSS のプレビュー限定**

#### OGP

```typescript
// generateMetadata
export async function generateMetadata({ params }) {
  const post = await getPostBySlug(params.slug)
  const { preview } = split(post)

  return {
    title: post.title,
    description: excerptFromPreview(preview, 160), // プレビューのみ
    openGraph: {
      title: post.title,
      description: excerptFromPreview(preview, 160)
    }
  }
}
```

#### RSS

```typescript
// app/rss.xml/route.ts
const items = posts.map(post => {
  const { preview } = split(post)
  const description = excerptFromPreview(preview, 200) // プレビューのみ

  return `
    <item>
      <title><![CDATA[${post.title}]]></title>
      <description><![CDATA[${description}]]></description>
    </item>
  `
})
```

### **data-nosnippet 属性**

有料部分には `data-nosnippet` を付与して、検索結果のスニペットに含まれないようにする。

```tsx
{isPaywalled && (
  <div className="paid-content" data-nosnippet hidden>
    {/* 実際のコンテンツは API 経由で取得 */}
  </div>
)}
```

### **確認方法**

```bash
# 検索ページの noindex 確認
curl -I https://yoursite.com/search | grep "X-Robots-Tag"
# → X-Robots-Tag: noindex, follow

# 構造化データ検証
# Google Rich Results Test:
# https://search.google.com/test/rich-results

# OGP 確認
curl https://yoursite.com/news/some-article | grep og:description
# → プレビューのみが含まれる

# RSS フィード確認
curl https://yoursite.com/rss.xml
# → description にプレビューのみが含まれる
```

---

## 📧 メール配信

### **現在の状態（DRY RUNモード）**

```bash
FEATURE_EMAIL_ENABLED=false
EMAIL_TEST_MODE=true
```

- 実際のメール送信なし
- ログ出力のみ（JSON Lines形式）
- `EmailEvent` テーブルに記録

### **本番切替手順**

1. 独自ドメイン取得
2. Resend でドメイン追加
3. DNS に SPF/DKIM 設定
4. 環境変数更新:
   ```bash
   EMAIL_FROM=no-reply@yourdomain.com
   FEATURE_EMAIL_ENABLED=true
   EMAIL_TEST_MODE=false
   ```
5. Webhook URL を Resend に登録

### **テンプレート一覧**

- `purchase-receipt` - 購入完了・領収書
- `entitlement-granted` - 視聴権限付与
- `password-change-notice` - パスワード変更通知
- `ops-alert` - 運用アラート

---

## 💳 Stripe（将来の有料化）

### **現在の状態（Seeds）**

```bash
FEATURE_STRIPE_ENABLED=false
```

- DB/API/UIの受け口のみ実装
- 決済は実行されない
- `/api/pay/checkout` → `/pricing` へリダイレクト

### **有効化手順**

1. Stripe ダッシュボードで商品/価格作成
2. 環境変数更新:
   ```bash
   FEATURE_STRIPE_ENABLED=true
   STRIPE_SECRET_KEY=sk_live_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```
3. `app/api/pay/checkout/route.ts` の TODO を実装
4. `app/api/pay/webhook/route.ts` の TODO を実装
5. Webhook URL を Stripe に登録
6. デプロイ

詳細は `CLAUDE_IMPLEMENTATION.md` の Stripe セクション参照。

---

## 🔍 検索機能

### **Phase 1: PostgreSQL（現在）**

- `tsvector` + `pg_trgm` による全文検索
- 日本語対応（文字単位トークン化）
- Topics を 2倍ブースト
- タイトル完全一致/部分一致サポート

**制限:**
- 形態素解析なし（「医療政策」→「医療」「政策」に分割されない）
- タイポ許容なし
- ファセット検索なし

### **Phase 2: Algolia（将来）**

記事数が1000本を超えたら移行を検討:

- リアルタイム同期
- 形態素解析（日本語）
- タイポ許容
- ファセット検索（カテゴリ/タグ）
- ハイライト表示

---

## 📊 監視/分析

### **Sentry（エラー追跡）**

```bash
NEXT_PUBLIC_SENTRY_DSN=https://...
SENTRY_AUTH_TOKEN=...
```

**アラート設定:**
- エラー率 > 1%
- Stripe決済失敗
- Webhook署名エラー

### **Vercel Analytics（パフォーマンス）**

**アラート設定:**
- LCP > 2.5秒
- FID > 100ms
- CLS > 0.1

### **Google Analytics 4**

```bash
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXX
```

**主要イベント:**
- `post_view` - 記事閲覧
- `scroll_50` - 50%スクロール
- `paywall_view` - ペイウォール表示
- `purchase_click` - 購入ボタンクリック
- `comment_posted` - コメント投稿
- `search_performed` - 検索実行

---

## 🧪 テスト

### **E2E テスト（Playwright）**

#### 環境変数

```bash
# playwright.config.ts で自動設定
E2E_TEST_MODE=true
TURNSTILE_SITEKEY=1x00000000000000000000AA
```

#### 主要テスト

```bash
# 全テスト実行
pnpm test:e2e

# UIモード（デバッグに便利）
pnpm test:e2e:ui

# 特定テスト
pnpm test:e2e tests/e2e/paywall.spec.ts
```

#### カバレッジ

- [x] ペイウォール表示（marker/chars/sections）
- [x] HTML に有料本文が含まれない検証
- [x] コメント投稿（承認制/即時公開）
- [x] 検索（日本語クエリ）
- [x] 特集ページ（代表3本表示）
- [x] 管理画面（記事作成/公開）
- [x] Rate Limit（5回目で429エラー）
- [x] Stripe Checkout（/pricing へ遷移）
- [x] メール送信（DRY RUN ログ）

---

## 🚢 デプロイ

### **Vercel（推奨）**

#### 1. プロジェクト作成

```bash
# Vercel CLI インストール
npm i -g vercel

# ログイン
vercel login

# プロジェクト初期化
vercel
```

#### 2. 環境変数設定

Vercel ダッシュボード > Settings > Environment Variables:

- `DATABASE_URL` - Supabase接続文字列
- `KV_URL` - Vercel KV が自動設定
- `NEXT_PUBLIC_TURNSTILE_SITEKEY` - 本番キー
- `TURNSTILE_SECRET` - 本番シークレット
- `ADMIN_BASIC_USER` / `ADMIN_BASIC_PASS` - 管理画面 Basic 認証
- または `ADMIN_ALLOW_IPS` - 管理画面 IP 許可リスト
- `SUPABASE_SERVICE_ROLE_KEY` - RLS バイパス用
- その他、`.env.example` の全項目

#### 3. デプロイ

```bash
# プレビューデプロイ
vercel

# 本番デプロイ
vercel --prod
```

### **カスタムドメイン設定**

1. Vercel ダッシュボード > Domains
2. ドメイン追加
3. DNS設定（A/CNAMEレコード）
4. SSL自動設定（Let's Encrypt）

---

## 🐛 トラブルシューティング

### **Q: `prisma generate` が失敗する**

```bash
# Prisma Client を削除して再生成
rm -rf node_modules/.prisma
npx prisma generate
```

### **Q: Vercel KV に接続できない**

**ローカル開発時:**
- Vercel KV はローカルでは不要（モック化推奨）
- または `@upstash/redis` でローカルRedisに接続

**本番環境:**
- Vercel ダッシュボードで KV Database 作成
- 環境変数が自動設定されるか確認

### **Q: Turnstile が動かない**

**テスト環境:**
```bash
E2E_TEST_MODE=true
NEXT_PUBLIC_TURNSTILE_SITEKEY=1x00000000000000000000AA
```

**本番環境:**
- Cloudflare ダッシュボードで Turnstile サイト作成
- 実際のサイトキー/シークレットを環境変数に設定

### **Q: メールが送信されない**

**意図的な挙動です**（現在はDRY RUNモード）

```bash
FEATURE_EMAIL_ENABLED=false  # これが false の間は送信されない
EMAIL_TEST_MODE=true
```

ログを確認:
```bash
vercel logs
# または
tail -f .next/server.log | grep email.dry_run
```

### **Q: Stripe Checkout に遷移しない**

**意図的な挙動です**（現在はSeeds状態）

```bash
FEATURE_STRIPE_ENABLED=false  # これが false の間は /pricing にリダイレクト
```

有効化は `REQUIREMENTS.md` の Stripe セクション参照。

---

## 📚 ドキュメント

- **技術要件書**: `REQUIREMENTS.md` - 全機能の詳細仕様
- **実装指示**: `CLAUDE_IMPLEMENTATION.md` - Claude Code CLI向けプロンプト
- **API仕様**: `REQUIREMENTS.md` の「4. API設計」参照
- **DB スキーマ**: `prisma/schema.prisma`

---

## 🤝 コントリビューション

### **ブランチ戦略**

- `main` - 本番環境
- `develop` - 開発環境
- `feature/*` - 機能開発
- `fix/*` - バグ修正

### **コミットメッセージ**

```
feat: 新機能追加
fix: バグ修正
docs: ドキュメント更新
style: フォーマット変更
refactor: リファクタリング
test: テスト追加
chore: ビルド/設定変更
```

### **Pull Request**

1. `develop` から feature ブランチを作成
2. 変更をコミット
3. PR作成（テンプレートに従う）
4. レビュー承認後、`develop` にマージ
5. `develop` → `main` は管理者のみ

---

## 📄 ライセンス

MIT License - 詳細は `LICENSE` ファイル参照

---

## 📞 サポート

- **Issue**: GitHub Issues でバグ報告・機能要望
- **Discussion**: GitHub Discussions で質問・議論
- **Email**: support@example.com

---

## 🎯 ロードマップ

### **Sprint 1（完了）**
- [x] Next.js + Supabase セットアップ
- [x] 記事CRUD + ペイウォール
- [x] トップページ + 管理画面
- [x] Turnstile + Rate Limit
- [x] SNS リンク集

### **Sprint 2（完了）**
- [x] Topics 機能
- [x] 検索（PostgreSQL）
- [x] コメント機能
- [x] Resend 統合（DRY RUN）
- [x] Stripe Seeds

### **Sprint 3（予定）**
- [ ] Notion API 取り込み
- [ ] Stripe 本実装
- [ ] ニュースレター配信
- [ ] 外部オーケストレーター連携

### **Sprint 4（予定）**
- [ ] SSO（Google/Microsoft）
- [ ] 動画配信（Cloudflare Stream）
- [ ] Algolia 移行
- [ ] パフォーマンス最適化

---

**Happy Coding! 🚀**
