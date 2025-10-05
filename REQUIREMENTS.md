# ニュース集約ブログ 技術要件書 v2.1

最終更新: 2025-10-05 JST

---

## 0. ゴール/前提

* **用途**: 週次の医療政策/医療DXまとめ + 不定期記事、将来の動画販売
* **収益モデル**: 無料プレビュー + 有料本編（記事単位で価格設定）
* **コメント**: 承認制/即時公開を管理UIで切替可能
* **投稿経路**: (1) 管理API、(2) Notion API取り込み、(3) サイト内管理画面
* **段階的移行**: MVP（無料運用）→ Stripe有効化 → SSO → 動画配信

---

## 1. 技術スタック（確定版）

### **ホスティング/インフラ**
- **Vercel** (本番環境)
  - Next.js App Router ネイティブサポート
  - ISR (Incremental Static Regeneration)
  - Edge Runtime
  - Vercel Cron (UTC指定のスケジュールジョブ)
  - Vercel KV (Redis互換、レート制限/キャッシュ用)

### **フロントエンド**
- **Next.js 14** (App Router)
- **React** (Server Components 中心)
- **TypeScript** (strict mode)
- **MDX** (記事本文のリッチコンテンツ)
- **TailwindCSS** (スタイリング)

### **データベース/ORM**
- **Supabase** (PostgreSQL)
  - PostgreSQL拡張: `pg_trgm`, `tsvector` (全文検索用)
- **Prisma** (ORM、TypeScript完全対応)

### **キャッシュ/KV**
- **Vercel KV** (Redis)
  - レート制限 (Rate Limiting)
  - セッション管理（将来のSSO用）
  - Idempotency Key 管理
  - キャッシュ

### **外部サービス**

#### コンテンツ管理
- **Notion API** (下書き→自動取り込み、Pull型)

#### ストレージ/メディア
- **Google Drive** (当面の動画/ドキュメント配布)
- **将来**: Cloudflare Stream または Mux (署名付き動画再生)

#### 決済
- **Stripe** (将来実装、Feature Flag で無効化中)
  - サブスクリプション + PPV (単品購入)
  - Webhook: `checkout.session.completed`, `invoice.paid`

#### 認証 (将来)
- **Google OAuth** / **Microsoft OAuth** (SSO)
- ドメイン制限: `ALLOWED_EMAIL_DOMAINS`

#### メール配信
- **Resend** (React Email統合)
  - 現在: DRY RUN モード（`FEATURE_EMAIL_ENABLED=false`）
  - 独自ドメイン設定後に有効化

#### セキュリティ
- **Cloudflare Turnstile** (CAPTCHA)
  - E2Eテスト時は `E2E_TEST_MODE=true` で無効化
  - テストキー: `1x00000000000000000000AA`

#### 検索
- **Phase 1**: PostgreSQL (`tsvector` + `pg_trgm`)
- **Phase 2**: Algolia または Meilisearch（将来）

#### OGP画像生成
- **@vercel/og** (Edge Functionで動的生成)

#### 監視/分析
- **Sentry** (エラー追跡、エラー率監視)
- **Google Analytics 4** (GA4)
  - Consent Mode v2 対応
- **Vercel Analytics** (Core Web Vitals)

---

## 2. 環境変数

```bash
# Next.js
NEXT_PUBLIC_SITE_URL=https://example.com
NODE_ENV=production

# Database (Supabase)
DATABASE_URL=postgresql://...

# KV/Redis (Vercel KV)
KV_URL=redis://...
KV_REST_API_URL=https://...
KV_REST_API_TOKEN=...
KV_REST_API_READ_ONLY_TOKEN=...

# Notion API
NOTION_TOKEN=secret_xxx
NOTION_DATABASE_ID=xxx

# Stripe (将来、現在は空でOK)
FEATURE_STRIPE_ENABLED=false
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_SUCCESS_URL=https://example.com/thanks
STRIPE_CANCEL_URL=https://example.com/cancel

# Auth (将来のSSO)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
ALLOWED_EMAIL_DOMAINS=hospital.jp,other-hosp.jp

# Resend (メール配信)
RESEND_API_KEY=
RESEND_WEBHOOK_SECRET=
EMAIL_FROM=no-reply@example.test  # 独自ドメイン設定後に変更
FEATURE_EMAIL_ENABLED=false
EMAIL_ALLOWLIST=  # カンマ区切り（例: me@hospital.jp）
EMAIL_TEST_MODE=true

# Cloudflare Turnstile
NEXT_PUBLIC_TURNSTILE_SITEKEY=0x4AAAAAAA...
TURNSTILE_SECRET=0x4AAAAAAA...
E2E_TEST_MODE=false  # テスト時は true

# GA4
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXX

# Sentry
NEXT_PUBLIC_SENTRY_DSN=
SENTRY_AUTH_TOKEN=

# 管理画面保護（どちらか必須）
ADMIN_BASIC_USER=admin
ADMIN_BASIC_PASS=change-me-in-production
# または IP 許可リスト（カンマ区切り、CIDR可）
ADMIN_ALLOW_IPS=127.0.0.1/32,203.0.113.10

# Supabase (RLS 用)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 3. データモデル（Prisma Schema）

### **Users（将来用）**
```prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  role      String   @default("viewer") // 'admin' | 'editor' | 'viewer'
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### **Posts（記事本体）**
```prisma
model Post {
  id       String   @id @default(uuid())
  slug     String   @unique
  title    String
  body     String   // MDX/Markdown
  summary  String?
  category String   @default("other") // 'policy' | 'dx' | 'other' (注: AIは独立カテゴリではなく、dx + tags=['AI']で管理)
  tags     String[]

  publishAt DateTime?
  status    String   @default("draft") // 'draft' | 'scheduled' | 'published'

  // Paywall
  paywallEnabled         Boolean  @default(true)
  freeMode               String   @default("marker") // 'marker' | 'chars' | 'sections'
  freeChars              Int?
  freeSections           Int?
  priceJpy               Int?
  isSubscriptionExempt   Boolean  @default(false)

  // Featured (注目記事)
  isFeatured       Boolean   @default(false)
  featuredOrder    Int?
  featuredUntil    DateTime?

  // 検索用（DBで自動生成）
  searchVector     Unsupported("tsvector")?

  sourceUrls String[]  // 一次情報URL (最大3つ)

  createdBy String?   // User.id (将来)
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt

  topicPosts TopicPost[]
  comments   Comment[]

  @@index([status, publishAt])
  @@index([isFeatured, featuredOrder])
  @@index([searchVector], type: Gin)
  @@index([title(ops: raw("gin_trgm_ops"))], type: Gin)
}
```

#### **カテゴリ体系の詳細定義**

Post.category は以下の3値のいずれか:

- **`'policy'`**: 医療政策
  - 診療報酬改定、中医協、地域医療構想、医療保険制度、かかりつけ医機能など
  - ナビ表示: 「医療政策」
  - テーマカラー: 青系（例: `bg-blue-50 text-blue-700`）

- **`'dx'`**: 医療DX実装
  - 電子カルテ標準化、PHR、オンライン診療、オンライン資格確認、セキュリティ、AI・データ活用含む
  - ナビ表示: 「実装（医療DX）」
  - テーマカラー: 緑系（例: `bg-emerald-50 text-emerald-700`）
  - **注意**: AI・データ活用は `category='dx'` + `tags` に `'AI'` を含めることで管理

- **`'other'`**: その他
  - 上記に該当しない記事
  - デフォルト値

**AI・データ活用の扱い**:
- `/topics/ai` ページは表示上独立したテーマLPとして存在
- しかし記事のカテゴリは `'dx'`、タグに `'AI'` を付与して管理
- `/topics/ai` では `category='dx' AND 'AI' IN tags` でフィルタ表示

### **Topics（特集）**
```prisma
model Topic {
  id          String   @id @default(uuid())
  slug        String   @unique
  title       String
  description String   // 100-200字の導入文
  coverImage  String?
  priority    Int      @default(0)  // 表示順序（高い方が上）

  searchVector Unsupported("tsvector")?

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  posts       TopicPost[]
  faqs        TopicFaq[]
  glossary    TopicGlossary[]

  @@index([priority])
  @@index([searchVector], type: Gin)
}

model TopicPost {
  topicId      String
  postId       String
  displayOrder Int     @default(0)
  isFeatured   Boolean @default(false)  // "まず読む3本" フラグ

  topic Topic @relation(fields: [topicId], references: [id], onDelete: Cascade)
  post  Post  @relation(fields: [postId], references: [id], onDelete: Cascade)

  @@id([topicId, postId])
  @@index([topicId, isFeatured, displayOrder])
}

model TopicFaq {
  id           String @id @default(uuid())
  topicId      String
  question     String
  answer       String
  displayOrder Int    @default(0)

  topic Topic @relation(fields: [topicId], references: [id], onDelete: Cascade)

  @@index([topicId, displayOrder])
}

model TopicGlossary {
  id         String @id @default(uuid())
  topicId    String
  term       String
  definition String

  topic Topic @relation(fields: [topicId], references: [id], onDelete: Cascade)

  @@index([topicId])
}
```

### **ArticleAlias（スラッグ変更の301用）**
```prisma
model ArticleAlias {
  id        String @id @default(uuid())
  postId    String
  oldSlug   String @unique
  createdAt DateTime @default(now())

  @@index([oldSlug])
}
```

### **Comments（承認制/即時切替）**
```prisma
model Comment {
  id          String   @id @default(uuid())
  postId      String
  authorName  String?
  authorEmail String?
  body        String
  status      String   @default("pending") // 'pending' | 'approved' | 'rejected'
  ipHash      String?
  createdAt   DateTime @default(now())

  post Post @relation(fields: [postId], references: [id], onDelete: Cascade)

  @@index([postId, status])
  @@index([status, createdAt])
}
```

### **Videos（将来用）**
```prisma
model Video {
  id              String   @id @default(uuid())
  provider        String   @default("drive") // 'drive' | 'stream' | 'mux'
  providerAssetId String?  @unique
  title           String?
  isPublicPreview Boolean  @default(false)
  createdAt       DateTime @default(now())
}
```

### **Plans / Entitlements（Stripe Seeds）**
```prisma
model Plan {
  id            String @id @default(uuid())
  type          String // 'subscription' | 'one_time'
  stripePriceId String?
}

model Entitlement {
  id               String    @id @default(uuid())
  userId           String
  kind             String    // 'ppv' | 'sub'
  postId           String?   // PPVの時のみ
  source           String    // 'stripe' | 'manual'
  currentPeriodEnd DateTime?
  createdAt        DateTime  @default(now())

  @@index([userId, kind, postId])
}
```

### **Payment（Stripe Seeds）**
```prisma
model Payment {
  id        String   @id @default(uuid())
  provider  String   // 'stripe'
  extId     String?  @unique
  amountJpy Int?
  currency  String?  // 'jpy'
  status    String   // 'created' | 'succeeded' | 'failed' | 'refunded'
  meta      Json?
  userId    String?
  postId    String?
  createdAt DateTime @default(now())

  @@index([userId])
  @@index([status])
}
```

### **SiteSettings（サイト設定）**
```prisma
model SiteSettings {
  id          Int     @id @default(1)
  siteTitle   String  @default("Medical News Site")

  // コメント
  commentMode String  @default("pre_moderation") // 'pre_moderation' | 'post_moderation'

  // 課金
  currency         String  @default("JPY")
  taxInclusive     Boolean @default(true)
  defaultPriceJpy  Int?
  paywallDefaultMode String @default("marker")

  // 注目記事
  featuredMax Int @default(4)

  // SNS Links
  snsTwitter   String @default("")
  snsLinkedin  String @default("")
  snsLine      String @default("")
  snsInstagram String @default("")
  snsYoutube   String @default("")
  snsTiktok    String @default("")
  snsFacebook  String @default("")

  updatedAt DateTime @updatedAt
}
```

### **EmailEvent（メール配信ログ）**
```prisma
model EmailEvent {
  id        String   @id @default(uuid())
  type      String   // 'requested' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'complained'
  toMasked  String
  messageId String?  @unique
  dryRun    Boolean  @default(true)
  meta      Json?
  createdAt DateTime @default(now())

  @@index([type, createdAt])
  @@index([messageId])
}
```

### **NewsletterSubscriber（将来用）**
```prisma
model NewsletterSubscriber {
  id             String    @id @default(uuid())
  email          String    @unique
  status         String    @default("active") // 'active' | 'unsubscribed' | 'bounced'
  confirmToken   String?
  subscribedAt   DateTime?
  unsubscribedAt DateTime?
  topics         String[]  // 興味のある特集タグ

  @@index([status])
}
```

### **AuditLog（軽量監査ログ）**
```prisma
model AuditLog {
  id         String   @id @default(uuid())
  occurredAt DateTime @default(now())
  event      String
  userId     String?
  payload    Json?

  @@index([event, occurredAt])
}
```

---

## 4. API設計

### **4.1 公開API（SSR/クライアント用）**

#### `GET /api/posts`
記事一覧（プレビューのみ）

**パラメータ:**
- `cursor`: ページネーション用（opaque token）
- `limit`: 取得件数（default: 20, max: 100）
- `q`: 検索クエリ
- `category`: カテゴリフィルタ（'policy' | 'dx' | 'other'）
- `tags`: タグフィルタ（カンマ区切り）

**レスポンス:**
```json
{
  "results": [
    {
      "id": "uuid",
      "slug": "2025-10-12-policy-weekly",
      "title": "今週の医療政策まとめ",
      "summary": "要点3つ...",
      "category": "policy",
      "tags": ["中医協", "診療報酬"],
      "publishedAt": "2025-10-12T00:30:00Z",
      "previewText": "無料部分の抜粋...",
      "ogImage": "https://..."
    }
  ],
  "nextCursor": "opaque-token",
  "total": 42
}
```

#### `GET /api/posts/[slug]`
記事詳細（プレビュー + ペイウォール情報）

**レスポンス:**
```json
{
  "id": "uuid",
  "slug": "...",
  "title": "...",
  "summary": "...",
  "category": "policy",
  "tags": ["..."],
  "publishedAt": "...",
  "previewHtml": "<p>無料部分...</p>",
  "paywall": {
    "enabled": true,
    "priceJpy": 980,
    "freeMode": "marker"
  },
  "sourceUrls": ["https://..."]
}
```

**注意:** `paidHtml` は含まれない（有料本文は `/api/posts/[id]/paid` でのみ取得）

#### `GET /api/posts/[id]/paid`
有料本文の取得（認証必須、将来実装）

**ヘッダー:**
- `Authorization: Bearer <token>`

**レスポンス:**
```json
{
  "paidHtml": "<p>有料部分...</p>"
}
```

#### `GET /api/search`
検索（PostgreSQL tsvector）

**パラメータ:**
- `q`: 検索クエリ（必須、2文字以上）
- `limit`: 取得件数（default: 20）
- `offset`: オフセット

**レスポンス:**
```json
{
  "results": [
    {
      "id": "uuid",
      "type": "topic" | "post",
      "slug": "...",
      "title": "...",
      "summary": "...",
      "rank": 0.8
    }
  ],
  "total": 15,
  "query": "診療報酬"
}
```

#### `POST /api/comments`
コメント投稿

**Body:**
```json
{
  "postId": "uuid",
  "authorName": "テスト太郎",
  "authorEmail": "test@example.com",
  "body": "すばらしい記事です",
  "turnstileToken": "..."
}
```

**レスポンス:**
```json
{
  "id": "uuid",
  "status": "pending" | "approved"
}
```

### **4.2 管理API（Admin/JWT + IP許可推奨）**

#### `POST /api/admin/posts`
記事作成

**ヘッダー:**
- `Authorization: Bearer <admin-jwt>`
- `Idempotency-Key: <uuid>`（推奨）

**Body:**
```json
{
  "slug": "2025-10-12-policy-weekly",
  "title": "今週の医療政策まとめ",
  "summary": "要点3つ...",
  "body": "# 見出し...\n\n<!-- more -->\n\n有料...",
  "category": "policy",
  "tags": ["中医協", "診療報酬"],
  "publishAt": "2025-10-12T00:30:00Z",
  "status": "scheduled",
  "sourceUrls": ["https://..."],
  "paywallEnabled": true,
  "freeMode": "sections",
  "freeSections": 2,
  "priceJpy": 980
}
```

#### `PUT /api/admin/posts/:id`
記事更新

#### `DELETE /api/admin/posts/:id`
記事削除

#### `POST /api/admin/posts/:id/publish`
即時/予約公開

#### `PUT /api/admin/posts/:id/paywall`
ペイウォール設定更新

#### `GET /api/admin/comments`
コメント一覧（管理用）

**パラメータ:**
- `status`: 'pending' | 'approved' | 'rejected'
- `limit`, `offset`

#### `PUT /api/admin/comments/:id/approve`
コメント承認

#### `PUT /api/admin/comments/:id/reject`
コメント却下

#### `PUT /api/admin/settings`
サイト設定更新

**Body:**
```json
{
  "commentMode": "pre_moderation" | "post_moderation",
  "defaultPriceJpy": 500,
  "snsTwitter": "https://twitter.com/...",
  ...
}
```

### **4.3 決済API（Stripe Seeds、現在無効）**

#### `POST /api/pay/checkout`
決済開始

**Body:**
```json
{
  "postId": "uuid"
}
```

**レスポンス（FEATURE_STRIPE_ENABLED=false）:**
```json
{
  "url": "/pricing"
}
```

**レスポンス（将来、FEATURE_STRIPE_ENABLED=true）:**
```json
{
  "url": "https://checkout.stripe.com/c/pay/..."
}
```

#### `POST /api/pay/webhook`
Stripe Webhook受信

**ヘッダー:**
- `stripe-signature`: HMAC署名

**処理:**
- 署名検証
- Idempotency（KV SETNX）
- `Payment` テーブルに記録
- `checkout.session.completed` → `Entitlement` 付与（将来）

#### `GET /api/entitlements/check`
権利確認

**パラメータ:**
- `postId`: uuid

**レスポンス（現在、常に false）:**
```json
{
  "hasAccess": false
}
```

### **4.4 メールAPI**

#### `POST /api/email/send`
メール送信（内部API）

**ヘッダー:**
- `Authorization: Bearer <admin-jwt>`

**Body:**
```json
{
  "to": ["user@example.com"],
  "type": "purchase_receipt" | "entitlement_granted" | "password_change_notice" | "ops_alert",
  "payload": { ... }
}
```

**レスポンス（FEATURE_EMAIL_ENABLED=false）:**
```json
{
  "success": true,
  "dryRun": true,
  "messageId": "dry-run-123456789"
}
```

#### `POST /api/email/webhook`
Resend Webhook受信（Svix署名検証）

**ヘッダー:**
- `svix-signature`
- `svix-timestamp`
- `svix-id`

**処理:**
- 署名検証（HMAC-SHA256）
- タイムスタンプ検証（5分以内）
- Idempotency（KV SETNX）
- `EmailEvent` テーブルに記録

---

## 5. ペイウォール仕様

### **5.1 本文分割ロジック**

```typescript
// lib/paywall.ts
export function split(post: Post): { preview: string; paid: string } {
  switch (post.freeMode) {
    case 'marker':
      // "<!-- more -->" で分割
      const parts = post.body.split('<!-- more -->')
      return {
        preview: parts[0] || post.body.slice(0, 600),
        paid: parts[1] || ''
      }

    case 'chars':
      // 文字数で分割（freeChars文字まで無料）
      const chars = post.freeChars || 800
      return {
        preview: post.body.slice(0, chars),
        paid: post.body.slice(chars)
      }

    case 'sections':
      // セクション（H2見出し）で分割
      const sections = post.body.split(/(?=^## )/m)
      const freeSections = post.freeSections || 2
      const preview = sections.slice(0, freeSections).join('')
      const paid = sections.slice(freeSections).join('')
      return { preview, paid }
  }
}
```

### **5.2 抜粋生成（句読点丸め）**

```typescript
// lib/excerpt.ts
export function excerptFromPreview(text: string, max = 160): string {
  // MDX除去
  const plain = stripMarkdown(text)
    .replace(/<!--.*?-->/gs, '')
    .replace(/\s+/g, ' ')
    .trim()

  if (plain.length <= max) return plain

  const cut = plain.slice(0, max + 20)

  // 句読点で丸め（優先順位: 。> ！？ > 、）
  const rounded =
    cut.match(/^.+[。．]/)?.[0] ||
    cut.match(/^.+[！？!?]/)?.[0] ||
    cut.match(/^.+[、，]/)?.[0] ||
    cut.slice(0, max)

  return rounded.length < 40
    ? plain.slice(0, max) + '…'
    : rounded + (rounded.endsWith('…') ? '' : '…')
}
```

### **5.3 アクセス判定（将来）**

```typescript
// lib/paywall.ts
export function canViewPaid(user: User | null, post: Post): boolean {
  if (!post.paywallEnabled) return true
  if (!user) return false

  // サブスク有効 & 対象外フラグなし
  if (hasActiveSubscription(user) && !post.isSubscriptionExempt) return true

  // PPV購入済み
  if (hasEntitlementForPost(user.id, post.id)) return true

  return false
}
```

---

## 6. 検索実装（PostgreSQL Phase 1）

### **6.1 DB拡張**

```sql
-- pg_trgm 拡張（部分一致用）
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Posts テーブル
ALTER TABLE posts
ADD COLUMN search_vector tsvector
GENERATED ALWAYS AS (
  setweight(to_tsvector('simple', coalesce(title,'')), 'A') ||
  setweight(to_tsvector('simple', coalesce(summary,'')), 'B') ||
  setweight(to_tsvector('simple', coalesce(body,'')), 'C') ||
  setweight(to_tsvector('simple', coalesce(array_to_string(tags, ' '),'')), 'D')
) STORED;

CREATE INDEX posts_search_idx ON posts USING GIN(search_vector);
CREATE INDEX posts_title_trgm_idx ON posts USING GIN(title gin_trgm_ops);

-- Topics テーブル（同様）
ALTER TABLE topics ADD COLUMN search_vector tsvector ...;
CREATE INDEX topics_search_idx ON topics USING GIN(search_vector);
```

### **6.2 検索クエリ**

```typescript
// app/api/search/route.ts
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q') || ''

  if (q.length < 2) {
    return Response.json({ results: [], total: 0 })
  }

  const sanitized = q.replace(/[^\w\s\u3000-\u9fff]/g, ' ').trim()
  const tsquery = sanitized.split(/\s+/).join(' & ')

  // Topics（2倍ブースト）
  const topics = await db.$queryRaw`
    SELECT
      id, slug, title, 'topic' as type,
      ts_rank(search_vector, to_tsquery('simple', ${tsquery})) * 2 AS rank
    FROM topics
    WHERE search_vector @@ to_tsquery('simple', ${tsquery})
  `

  // Posts
  const posts = await db.$queryRaw`
    SELECT
      id, slug, title, summary, 'post' as type,
      ts_rank(search_vector, to_tsquery('simple', ${tsquery})) AS rank
    FROM posts
    WHERE
      status = 'published'
      AND (
        search_vector @@ to_tsquery('simple', ${tsquery})
        OR title ILIKE ${`%${sanitized}%`}
        OR ${sanitized} = ANY(tags)
      )
  `

  const combined = [...topics, ...posts]
    .sort((a, b) => b.rank - a.rank)
    .slice(0, 20)

  return Response.json({ results: combined, total: combined.length, query: q })
}
```

---

## 7. セキュリティ

### **7.1 Cloudflare Turnstile（CAPTCHA）**

#### フロントエンド
```tsx
// components/CommentForm.tsx
'use client'

export function CommentForm({ postId }: { postId: string }) {
  return (
    <form>
      <textarea name="body" required />

      {/* Turnstile Widget */}
      <div
        className="cf-turnstile"
        data-sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITEKEY}
      />

      <button type="submit">送信</button>

      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer />
    </form>
  )
}
```

#### バックエンド
```typescript
// app/api/comments/route.ts
import { shouldVerifyCaptcha, verifyTurnstile } from '@/lib/captcha'

export async function POST(req: Request) {
  const { turnstileToken, ...data } = await req.json()

  if (shouldVerifyCaptcha()) {
    const valid = await verifyTurnstile(turnstileToken)
    if (!valid) {
      return Response.json({ error: 'Bot detected' }, { status: 403 })
    }
  }

  // コメント保存処理...
}
```

#### 環境変数制御
```typescript
// lib/captcha.ts
export function shouldVerifyCaptcha(): boolean {
  return process.env.NODE_ENV === 'production' && !process.env.E2E_TEST_MODE
}

export function getTurnstileSitekey(): string {
  if (process.env.E2E_TEST_MODE === 'true') {
    return '1x00000000000000000000AA' // Cloudflare公式テストキー
  }
  return process.env.NEXT_PUBLIC_TURNSTILE_SITEKEY!
}
```

### **7.2 Rate Limiting（Vercel KV）**

```typescript
// lib/kv.ts
import { kv } from '@vercel/kv'

export async function checkRateLimit(
  key: string,
  limit: number,
  windowSec: number
): Promise<boolean> {
  const count = await kv.incr(key)

  if (count === 1) {
    await kv.expire(key, windowSec)
  }

  return count <= limit
}
```

**適用箇所:**
- コメント投稿: 5件/10分/IP
- 検索: 30件/分/IP
- 管理API: 10件/分/APIキー
- メール送信: 10件/分/IP

### **7.3 XSS対策**

```typescript
// lib/sanitize.ts
import DOMPurify from 'isomorphic-dompurify'

export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'a', 'strong', 'em', 'ul', 'ol', 'li', 'h2', 'h3', 'h4'],
    ALLOWED_ATTR: ['href', 'target', 'rel']
  })
}
```

### **7.4 CSRF対策**

Next.js App Router の Server Actions は自動的にCSRF保護あり。
API Routes は `next-csrf` 等のミドルウェア追加を推奨。

### **7.5 Supabase RLS（Row Level Security）**

#### 基本方針
- **posts**: `status='published'` のみ匿名読み取り可、管理者は全操作可
- **comments**: `status='approved'` のみ公開、書き込みは service_role のみ
- **entitlements**: 本人のみ読み取り可、書き込みは service_role のみ

#### RLS ポリシー（SQL）

```sql
-- Posts: published のみ匿名 SELECT
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY posts_public_read
ON posts FOR SELECT
TO public
USING (status = 'published');

-- 管理者用（users.role='admin' のみ全操作可）
CREATE POLICY posts_admin_full
ON posts FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid() AND u.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid() AND u.role = 'admin'
  )
);

-- Comments: approved は全員 READ、INSERT は service_role のみ
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY comments_public_read_approved
ON comments FOR SELECT
TO public
USING (status = 'approved');

CREATE POLICY comments_owner_read_pending
ON comments FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY comments_insert_service
ON comments FOR INSERT
TO service_role
WITH CHECK (true);

CREATE POLICY comments_admin_update
ON comments FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid() AND u.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid() AND u.role = 'admin'
  )
);

-- Entitlements: 本人のみ SELECT、書き込みは service_role のみ
ALTER TABLE entitlements ENABLE ROW LEVEL SECURITY;

CREATE POLICY entitlements_owner_read
ON entitlements FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY entitlements_write_service
ON entitlements FOR INSERT
TO service_role
WITH CHECK (true);

CREATE POLICY entitlements_update_service
ON entitlements FOR UPDATE
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY entitlements_delete_service
ON entitlements FOR DELETE
TO service_role
USING (true);
```

**注意:**
- `users` テーブルに `role` カラムがない場合、管理者ポリシーは一旦スキップ
- service_role キーは環境変数 `SUPABASE_SERVICE_ROLE_KEY` で管理

### **7.6 管理画面アクセス制御**

#### 方式A: Basic 認証（簡易）

```typescript
// middleware.ts
import { NextRequest, NextResponse } from 'next/server'

const ADMIN_PATH = /^\/admin(\/|$)/

export function middleware(req: NextRequest) {
  const url = req.nextUrl.pathname

  if (!ADMIN_PATH.test(url)) return NextResponse.next()

  // Basic 認証
  const auth = req.headers.get('authorization')
  if (!auth || !auth.startsWith('Basic ')) {
    return new NextResponse('Unauthorized', {
      status: 401,
      headers: { 'WWW-Authenticate': 'Basic realm="Admin"' }
    })
  }

  const [user, pass] = Buffer.from(auth.replace('Basic ', ''), 'base64')
    .toString()
    .split(':')

  if (
    user !== process.env.ADMIN_BASIC_USER ||
    pass !== process.env.ADMIN_BASIC_PASS
  ) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*']
}
```

**環境変数:**
```bash
ADMIN_BASIC_USER=admin
ADMIN_BASIC_PASS=change-me-in-production
```

#### 方式B: IP 許可リスト（推奨）

```typescript
// middleware.ts（IP制限版）
export function middleware(req: NextRequest) {
  const url = req.nextUrl.pathname

  if (!ADMIN_PATH.test(url)) return NextResponse.next()

  const allowList = (process.env.ADMIN_ALLOW_IPS || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)

  if (allowList.length > 0) {
    const ip = req.ip ?? req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    if (!ip) return new NextResponse('Forbidden (no IP)', { status: 403 })

    // 簡易チェック（CIDR対応は ip-cidr ライブラリ使用推奨）
    const allowed = allowList.some(a => a === ip || a === `${ip}/32`)
    if (!allowed) return new NextResponse('Forbidden (IP)', { status: 403 })
  }

  return NextResponse.next()
}
```

**環境変数:**
```bash
ADMIN_ALLOW_IPS=127.0.0.1/32,203.0.113.10
```

### **7.7 Idempotency Key（多重処理防止）**

#### Prisma スキーマ追加

```prisma
model Idempotency {
  key       String   @id
  createdAt DateTime @default(now())
}
```

#### 実装例

```typescript
// lib/idempotency.ts
import { db } from './db'

export async function ensureIdempotent(key: string | null | undefined) {
  if (!key) return // キー未指定は許可（将来は 400 エラーでも可）

  try {
    await db.idempotency.create({ data: { key } })
  } catch (e: any) {
    // 既存キー = 多重実行
    if (e.code === 'P2002') {
      throw new Error('IDEMPOTENT_REPLAY')
    }
    throw e
  }
}
```

#### API での使用例

```typescript
// app/api/admin/posts/route.ts
import { ensureIdempotent } from '@/lib/idempotency'

export async function POST(req: Request) {
  const idempotencyKey = req.headers.get('Idempotency-Key')

  try {
    await ensureIdempotent(idempotencyKey)
  } catch {
    return Response.json({ error: 'Duplicate request' }, { status: 409 })
  }

  // 通常の処理...
}
```

**適用対象:**
- `POST /api/admin/posts`
- `PUT /api/admin/posts/:id`
- `DELETE /api/admin/posts/:id`
- `POST /api/admin/publish/:id`

---

## 8. SEO/配信ポリシー

### **8.1 検索ページの noindex 設定**

検索結果ページは常に noindex にして、検索エンジンのクロール負荷を軽減。

```typescript
// app/search/page.tsx
export const metadata = {
  robots: {
    index: false,
    follow: true
  }
}

export default function SearchPage() {
  // 検索 UI
}
```

### **8.2 NewsArticle 構造化データ**

ペイウォール記事には `isAccessibleForFree: false` と `hasPart` を設定。

```typescript
// app/news/[slug]/page.tsx
import Script from 'next/script'

export default async function ArticlePage({ params }) {
  const post = await getPostBySlug(params.slug)
  const { preview, paid } = split(post)

  const isPaywalled = post.paywallEnabled

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: post.title,
    datePublished: post.publishAt?.toISOString(),
    dateModified: post.updatedAt?.toISOString(),
    isAccessibleForFree: !isPaywalled,
    ...(isPaywalled && {
      hasPart: {
        '@type': 'WebPageElement',
        isAccessibleForFree: true,
        cssSelector: '.article-preview'
      }
    })
  }

  return (
    <>
      <Script
        id="article-structured-data"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <article>
        {/* 無料部分 */}
        <div className="article-preview">
          {/* sanitized preview HTML */}
        </div>

        {/* ペイウォール */}
        {isPaywalled && (
          <>
            <div className="paywall-cta">
              {/* 購入/購読ボタン */}
            </div>

            {/* 有料部分は SSR で含めない */}
            {/* クライアント側で認証後に API から取得 */}
          </>
        )}

        {/* 無料記事の場合 */}
        {!isPaywalled && (
          <div>{/* paid content */}</div>
        )}
      </article>
    </>
  )
}
```

### **8.3 OGP/RSS でのプレビュー限定**

#### OGP（Open Graph Protocol）

```typescript
// lib/og.ts
export function buildOgDescription(post: Post): string {
  const { preview } = split(post)
  return excerptFromPreview(preview, 160) // プレビューのみ
}
```

```typescript
// app/news/[slug]/page.tsx
export async function generateMetadata({ params }) {
  const post = await getPostBySlug(params.slug)

  return {
    title: post.title,
    description: buildOgDescription(post), // プレビューのみ
    openGraph: {
      title: post.title,
      description: buildOgDescription(post),
      type: 'article',
      publishedTime: post.publishAt?.toISOString(),
      modifiedTime: post.updatedAt?.toISOString()
    }
  }
}
```

#### RSS フィード

```typescript
// app/rss.xml/route.ts
export async function GET() {
  const posts = await db.post.findMany({
    where: { status: 'published' },
    orderBy: { publishAt: 'desc' },
    take: 20
  })

  const items = posts.map(post => {
    const { preview } = split(post)
    const description = excerptFromPreview(preview, 200)

    return `
      <item>
        <title><![CDATA[${post.title}]]></title>
        <link>${process.env.NEXT_PUBLIC_SITE_URL}/news/${post.slug}</link>
        <description><![CDATA[${description}]]></description>
        <pubDate>${post.publishAt?.toUTCString()}</pubDate>
        <guid isPermaLink="true">${process.env.NEXT_PUBLIC_SITE_URL}/news/${post.slug}</guid>
      </item>
    `
  }).join('\n')

  const feed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Medical News Site</title>
    <link>${process.env.NEXT_PUBLIC_SITE_URL}</link>
    <description>医療政策・医療DXニュース</description>
    ${items}
  </channel>
</rss>`

  return new Response(feed, {
    headers: {
      'Content-Type': 'application/xml'
    }
  })
}
```

### **8.4 data-nosnippet 属性**

有料部分のプレースホルダーには `data-nosnippet` を付与して、検索結果のスニペットに含まれないようにする。

```tsx
{isPaywalled && (
  <div className="paid-content" data-nosnippet hidden>
    {/* 占位のみ、実際のコンテンツは API 経由 */}
  </div>
)}
```

### **8.5 受け入れ条件**

**SEO:**
- [ ] `/search` に `noindex, follow` が設定される
- [ ] ペイウォール記事に `isAccessibleForFree: false` が出力される
- [ ] `hasPart` で無料部分の CSS セレクタが指定される
- [ ] OGP の description はプレビューのみ
- [ ] RSS の description はプレビューのみ
- [ ] 有料部分に `data-nosnippet` が付与される

**セキュリティ:**
- [ ] SSR HTML に有料本文が含まれない
- [ ] 未認証で `status='published'` 以外の posts が読めない（RLS）
- [ ] comments の INSERT は service_role のみ成功
- [ ] `/admin` に Basic 認証または IP 制限がかかる
- [ ] Idempotency-Key で多重実行が 409 エラー

---

## 9. メール配信（Resend + React Email）

### **8.1 現在の状態（DRY RUN モード）**

- `FEATURE_EMAIL_ENABLED=false`
- `EMAIL_TEST_MODE=true`
- 実際のメール送信なし、ログ出力のみ

### **8.2 テンプレート（React Email）**

```tsx
// emails/templates/PurchaseReceipt.tsx
import { Html, Head, Body, Container, Heading, Text, Button } from '@react-email/components'

interface Props {
  userName: string
  postTitle: string
  amount: number
  receiptUrl: string
}

export default function PurchaseReceipt({ userName, postTitle, amount, receiptUrl }: Props) {
  return (
    <Html>
      <Head />
      <Body>
        <Container>
          <Heading>ご購入ありがとうございます</Heading>
          <Text>
            {userName} 様<br />
            「{postTitle}」をご購入いただきありがとうございます。
          </Text>
          <Text>
            金額: ¥{amount.toLocaleString()}
          </Text>
          <Button href={receiptUrl}>領収書をダウンロード</Button>

          {/* Footer */}
          <Text style={{ fontSize: '12px', color: '#666', marginTop: '32px' }}>
            このメールに心当たりがない場合は、support@example.com までご連絡ください。
          </Text>
        </Container>
      </Body>
    </Html>
  )
}
```

### **8.3 送信処理（ガード付き）**

```typescript
// lib/email/resendProvider.ts
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendMail(params: SendMailParams) {
  const { to, subject, html, text } = params

  // ガード
  if (process.env.FEATURE_EMAIL_ENABLED !== 'true') {
    console.log(JSON.stringify({
      event: 'email.dry_run',
      to: to.map(maskEmail),
      subject,
      timestamp: new Date().toISOString()
    }))
    return { success: true, messageId: 'dry-run-' + Date.now() }
  }

  // 実送信
  const result = await resend.emails.send({
    from: process.env.EMAIL_FROM!,
    to,
    subject,
    html,
    text
  })

  return result
}

function maskEmail(email: string): string {
  const [local, domain] = email.split('@')
  return `${local.slice(0, 2)}***@${domain}`
}
```

### **8.4 Webhook受信（Svix署名検証）**

```typescript
// app/api/email/webhook/route.ts
import { createHmac } from 'crypto'
import { kv } from '@vercel/kv'

export async function POST(req: Request) {
  const signature = req.headers.get('svix-signature')
  const timestamp = req.headers.get('svix-timestamp')
  const id = req.headers.get('svix-id')

  if (!signature || !timestamp || !id) {
    return Response.json({ error: 'Missing headers' }, { status: 401 })
  }

  const body = await req.text()

  // 署名検証
  const secret = process.env.RESEND_WEBHOOK_SECRET!
  const signedContent = `${id}.${timestamp}.${body}`
  const expectedSig = createHmac('sha256', secret)
    .update(signedContent)
    .digest('base64')

  const [version, sig] = signature.split(' ')
  if (sig !== expectedSig) {
    return Response.json({ error: 'Invalid signature' }, { status: 401 })
  }

  // タイムスタンプ検証（5分以内）
  const now = Math.floor(Date.now() / 1000)
  if (Math.abs(now - parseInt(timestamp)) > 300) {
    return Response.json({ error: 'Timestamp too old' }, { status: 401 })
  }

  // Idempotency
  const idempotencyKey = id
  const existing = await kv.get(`webhook:email:${idempotencyKey}`)
  if (existing) {
    return Response.json({ message: 'Already processed' })
  }

  // イベント保存
  const event = JSON.parse(body)
  await db.emailEvent.create({
    data: {
      type: event.type,
      toMasked: maskEmail(event.data.to),
      messageId: event.data.email_id,
      dryRun: false,
      meta: event.data
    }
  })

  await kv.set(`webhook:email:${idempotencyKey}`, '1', { ex: 600 })

  return Response.json({ success: true })
}
```

---

## 9. Stripe Seeds（将来の有料化準備）

### **9.1 現在の状態**

- `FEATURE_STRIPE_ENABLED=false`
- DB/API/UIの受け口のみ実装
- 決済は実行されない

### **9.2 Checkout フロー（骨組み）**

```typescript
// app/api/pay/checkout/route.ts
import { isStripeEnabled } from '@/lib/flags'

export async function POST(req: Request) {
  const { postId } = await req.json()

  // Feature Flag チェック
  if (!isStripeEnabled()) {
    return Response.json({ url: '/pricing' })
  }

  // TODO: 本実装
  // const session = await stripe.checkout.sessions.create({
  //   mode: 'payment',
  //   line_items: [{ price: post.stripePriceId, quantity: 1 }],
  //   success_url: process.env.STRIPE_SUCCESS_URL,
  //   cancel_url: process.env.STRIPE_CANCEL_URL
  // })
  // return Response.json({ url: session.url })

  return Response.json({ url: '/pricing' })
}
```

### **9.3 Webhook受信（骨組み）**

```typescript
// app/api/pay/webhook/route.ts
export async function POST(req: Request) {
  const signature = req.headers.get('stripe-signature')

  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return new Response(null, { status: 204 })
  }

  // TODO: 署名検証
  // const event = stripe.webhooks.constructEvent(body, signature, secret)

  // TODO: イベント処理
  // if (event.type === 'checkout.session.completed') {
  //   await db.entitlement.create({ ... })
  // }

  return Response.json({ received: true })
}
```

### **9.4 有効化手順（コメントで記載）**

```typescript
/**
 * Stripe 有効化手順:
 *
 * 1. Stripe ダッシュボードで商品/価格を作成
 * 2. .env に以下を設定:
 *    FEATURE_STRIPE_ENABLED=true
 *    STRIPE_SECRET_KEY=sk_live_...
 *    STRIPE_WEBHOOK_SECRET=whsec_...
 * 3. このファイルの TODO を実装:
 *    - stripe.checkout.sessions.create
 *    - stripe.webhooks.constructEvent
 *    - Entitlement 付与ロジック
 * 4. Vercel で環境変数を更新
 * 5. デプロイ
 */
```

---

## 10. Topics（特集）機能

### **10.1 主要3テーマの固定トピック**

サイト開設時に必ず作成する3つの固定トピック:

#### 1. **医療政策** (`slug: 'policy'`)
```typescript
{
  slug: 'policy',
  title: '医療政策',
  description: '診療報酬改定、中医協の議論、地域医療構想、医療保険制度の変遷など、医療政策の最新動向を追います。',
  priority: 100,
  // 対応カテゴリ: 'policy'
}
```

#### 2. **実装（医療DX）** (`slug: 'dx'`)
```typescript
{
  slug: 'dx',
  title: '実装（医療DX）',
  description: '電子カルテ標準化、PHR、オンライン診療、オンライン資格確認など、医療DXの現場実装を解説します。',
  priority: 90,
  // 対応カテゴリ: 'dx'（AIタグなし）
}
```

#### 3. **AI・データ活用** (`slug: 'ai'`)
```typescript
{
  slug: 'ai',
  title: 'AI・データ活用',
  description: 'AI問診、画像診断支援、ビッグデータ解析、予測モデルなど、医療現場でのAI・データ活用事例を紹介します。',
  priority: 80,
  // 対応カテゴリ: 'dx' AND tags=['AI']
  // 注: このトピックの記事一覧は category='dx' かつ tags に 'AI' を含む記事をフィルタ表示
}
```

**運用方針**:
- これら3つのトピックは削除不可（管理画面で保護）
- 記事との紐付けは `TopicPost` テーブル経由で手動管理
- `/topics/ai` では `category='dx' AND 'AI' IN tags` の記事を自動表示

### **10.2 特集ハブページ**

**URL:** `/topics/[slug]`

**構成:**
- タイトル + 導入文（100-200字）
- 「まず読む3本」（`TopicPost.isFeatured=true`）
- 最新記事一覧（同特集内）
- FAQ（`TopicFaq`）
- 用語集（`TopicGlossary`）
- 一次情報リンク

### **10.3 代表記事の選定**

```typescript
// lib/queries/topics.ts
export async function getTopicWithPosts(slug: string) {
  const topic = await db.topic.findUnique({
    where: { slug },
    include: {
      posts: {
        where: {
          post: { status: 'published' },
          isFeatured: true
        },
        take: 3,
        orderBy: { displayOrder: 'asc' },
        include: { post: true }
      }
    }
  })

  // 3本未満の場合、最新記事で埋める
  if (topic.posts.length < 3) {
    const additional = await db.topicPost.findMany({
      where: {
        topicId: topic.id,
        post: { status: 'published' },
        isFeatured: false
      },
      take: 3 - topic.posts.length,
      orderBy: { post: { publishedAt: 'desc' } },
      include: { post: true }
    })
    topic.posts.push(...additional)
  }

  return topic
}
```

---

## 11. SNS リンク集

### **11.1 対象SNS（7種類）**

- X (Twitter)
- LinkedIn
- LINE公式アカウント
- Instagram
- YouTube
- TikTok
- Facebook

### **11.2 表示箇所**

1. **フッター**: 全ページ共通、横並び
2. **記事詳細サイドバー**: デスクトップのみ、縦並び
3. **記事詳細末尾**: モバイルのみ、横並び

### **11.3 コンポーネント**

```tsx
// components/sns/SocialLinks.tsx
'use client'

import { Twitter, Linkedin, Instagram, Youtube, Facebook } from 'react-icons/si'
import { RiLineFill } from 'react-icons/ri'

type Props = {
  variant: 'horizontal' | 'vertical'
  size?: 'sm' | 'md' | 'lg'
  links: {
    twitter?: string
    linkedin?: string
    line?: string
    instagram?: string
    youtube?: string
    tiktok?: string
    facebook?: string
  }
}

export function SocialLinks({ variant, size = 'md', links }: Props) {
  const platforms = [
    { key: 'twitter', url: links.twitter, Icon: Twitter, label: 'X', color: '#000000' },
    { key: 'linkedin', url: links.linkedin, Icon: Linkedin, label: 'LinkedIn', color: '#0A66C2' },
    // ... 他のSNS
  ].filter(p => p.url)

  if (platforms.length === 0) return null

  return (
    <div className={`flex gap-3 ${variant === 'vertical' ? 'flex-col' : 'flex-row'}`}>
      {platforms.map(({ key, url, Icon, label, color }) => (
        <a
          key={key}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${label}でフォロー`}
          className="w-11 h-11 flex items-center justify-center rounded-full bg-gray-100 hover:bg-[${color}] hover:text-white transition"
        >
          <Icon className="w-5 h-5" />
        </a>
      ))}
    </div>
  )
}
```

---

## 12. テスト戦略

### **12.1 Playwright E2E**

#### API + UI ハイブリッドアプローチ

```typescript
// tests/e2e/paywall.spec.ts
import { test, expect } from '@playwright/test'

test('ペイウォールが正しく表示される', async ({ page, request }) => {
  // 1. API で記事を作成（高速）
  const response = await request.post('/api/admin/posts', {
    headers: { 'Authorization': `Bearer ${process.env.ADMIN_JWT}` },
    data: {
      slug: 'paywall-test',
      title: 'ペイウォールテスト',
      body: '無料部分\n\n<!-- more -->\n\n有料部分',
      status: 'published',
      paywallEnabled: true,
      freeMode: 'marker',
      priceJpy: 500
    }
  })
  const post = await response.json()

  // 2. ブラウザで表示確認
  await page.goto(`/news/${post.slug}`)

  // 3. 無料部分が表示される
  await expect(page.locator('.preview')).toContainText('無料部分')

  // 4. 有料部分が隠れている
  await expect(page.locator('.paid-content')).toBeHidden()

  // 5. 壁が表示される
  await expect(page.locator('.paywall-cta')).toContainText('¥500')

  // 6. HTML に有料本文が含まれない（重要）
  const html = await page.content()
  expect(html).not.toContain('有料部分')

  // 7. API でクリーンアップ
  await request.delete(`/api/admin/posts/${post.id}`, {
    headers: { 'Authorization': `Bearer ${process.env.ADMIN_JWT}` }
  })
})
```

#### Turnstile テストモード

```typescript
// playwright.config.ts
export default defineConfig({
  use: {
    baseURL: 'http://localhost:3000'
  },
  env: {
    E2E_TEST_MODE: 'true',
    TURNSTILE_SITEKEY: '1x00000000000000000000AA'
  }
})
```

### **12.2 テストカバレッジ**

**必須テスト:**
- [ ] ペイウォール表示（marker/chars/sections）
- [ ] HTML に有料本文が含まれない
- [ ] コメント投稿（承認制/即時公開）
- [ ] 検索（日本語クエリ）
- [ ] 特集ページ（代表3本表示）
- [ ] 管理画面（記事作成/公開/コメント承認）
- [ ] Rate Limit（5回目で429エラー）
- [ ] Stripe Checkout（/pricing へ遷移）
- [ ] メール送信（DRY RUN ログ出力）

---

## 13. デプロイ/運用

### **13.1 Vercel設定**

#### 環境変数
- Production: 本番用のキー（Stripe/Turnstile/Resend）
- Preview: テスト用のキー
- Development: `.env.local`

#### ISR設定
```typescript
// app/(public)/page.tsx
export const revalidate = 900 // 15分
```

#### Cron設定（将来）
```typescript
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/publish",
      "schedule": "30 0 * * 1" // 月曜 09:30 JST (00:30 UTC)
    },
    {
      "path": "/api/cron/notion-sync",
      "schedule": "*/5 * * * *" // 5分毎
    }
  ]
}
```

### **13.2 監視**

#### Sentry
- エラー率 > 1% でアラート
- 特定エラー（Stripe失敗、Webhook署名エラー）で即時通知

#### Vercel Analytics
- LCP > 2.5秒でアラート
- FID > 100ms でアラート

#### Healthcheck
```typescript
// app/api/health/route.ts
export async function GET() {
  // DB接続確認
  await db.$queryRaw`SELECT 1`

  // KV接続確認
  await kv.ping()

  return Response.json({ status: 'ok' })
}
```

---

## 14. 段階的移行ロードマップ

### **Sprint 1（MVP、2週間）**
- [x] Next.js + Supabase + Vercel KV セットアップ
- [x] DB スキーマ実装
- [x] 記事 CRUD API
- [x] ペイウォール（preview/paid 分離）
- [x] トップページ UI
- [x] 管理画面（投稿、設定）
- [x] Turnstile + Rate Limit
- [x] SNS リンク集

### **Sprint 2（コア機能、2週間）**
- [x] Topics 機能
- [x] 検索（PostgreSQL tsvector）
- [x] コメント（承認制/即時切替）
- [x] Resend 統合（DRY RUN）
- [x] Stripe Seeds
- [x] Playwright E2E

### **Sprint 3（拡張、2週間）**
- [ ] Notion API 取り込み
- [ ] Stripe 本実装（Checkout + Webhook）
- [ ] ニュースレター配信
- [ ] 外部オーケストレーター連携

### **Sprint 4（高度化、2週間）**
- [ ] SSO（Google/Microsoft OAuth）
- [ ] 動画配信（Cloudflare Stream/Mux）
- [ ] Algolia 移行
- [ ] パフォーマンス最適化

---

## 15. ナビゲーション・情報アーキテクチャ

### **15.1 グローバルナビゲーション構造**

#### フラット構造 + 視覚的階層

```
記事 / 医療政策 / 実装（医療DX） / AI・データ活用 / 検索 / About
```

**視覚的階層の定義**:
- **主軸**（濃色・標準フォント）: 記事、検索、About
- **テーマ軸**（薄色・小さめフォント）: 医療政策、実装（医療DX）、AI・データ活用

**Tailwind実装例**:
```tsx
<nav className="flex items-center gap-6">
  {/* 主軸 */}
  <Link href="/news" className="text-gray-900 hover:text-black font-medium text-[15px]">
    記事
  </Link>

  {/* テーマ軸 */}
  <Link href="/topics/policy" className="text-gray-500 hover:text-gray-800 text-[14px]">
    医療政策
  </Link>
  <Link href="/topics/dx" className="text-gray-500 hover:text-gray-800 text-[14px]">
    実装（医療DX）
  </Link>
  <Link href="/topics/ai" className="text-gray-500 hover:text-gray-800 text-[14px]">
    AI・データ活用
  </Link>

  {/* 主軸 */}
  <Link href="/search" className="text-gray-900 hover:text-black font-medium text-[15px]">
    検索
  </Link>
  <Link href="/about" className="text-gray-900 hover:text-black font-medium text-[15px]">
    About
  </Link>
</nav>
```

**設計意図**:
- UX: 一瞬で「主要機能」と「コンテンツテーマ」が識別可能
- SEO: すべてのリンクがトップ階層に存在し、クローラビリティ最大化
- 拡張性: 将来カテゴリ追加時も視覚グループに追加するだけ
- モバイル: ハンバーガーメニュー内でも同じ順序を維持

#### モバイルナビゲーション

```tsx
<MobileNav>
  {/* 検索アイコンは常時表示（ヘッダー右上固定） */}
  <SearchButton />

  {/* ハンバーガーメニュー内 */}
  <NavLink href="/news" primary>記事</NavLink>
  <NavDivider label="テーマ" />
  <NavLink href="/topics/policy">医療政策</NavLink>
  <NavLink href="/topics/dx">実装（医療DX）</NavLink>
  <NavLink href="/topics/ai">AI・データ活用</NavLink>
  <NavDivider />
  <NavLink href="/about" primary>About</NavLink>
</MobileNav>
```

### **15.2 主要ページ構成**

| URL | ページ | 説明 | revalidate |
|-----|--------|------|------------|
| `/` | トップ | Hero + 3テーマカード + 新着記事 | 900秒 |
| `/news` | 記事一覧 | 全記事・カテゴリタブ付き | 900秒 |
| `/topics` | 特集ハブ | 3テーマの紹介カード | 1800秒 |
| `/topics/policy` | 医療政策LP | 導入文 + 記事一覧 | 900秒 |
| `/topics/dx` | 医療DX LP | 導入文 + 記事一覧 | 900秒 |
| `/topics/ai` | AI LP | 導入文 + dx+AIタグ記事 | 900秒 |
| `/news/[slug]` | 記事詳細 | ペイウォール対応 | 900秒 |
| `/search` | 検索 | 全文検索（noindex） | - |
| `/about` | About | サイト概要 | 3600秒 |

### **15.3 カテゴリチップ表示**

記事カード上に表示するカテゴリチップ:

```tsx
// components/post/CategoryChip.tsx
export function CategoryChip({ category }: { category: 'policy' | 'dx' | 'other' }) {
  const config = {
    policy: {
      label: '医療政策',
      className: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200'
    },
    dx: {
      label: '実装（医療DX）',
      className: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
    },
    other: {
      label: 'その他',
      className: 'bg-gray-100 text-gray-700 ring-1 ring-gray-200'
    }
  }

  const { label, className } = config[category]

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${className}`}>
      {label}
    </span>
  )
}

// AIタグがある場合は追加でAIチップも表示
{tags.includes('AI') && (
  <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium bg-violet-50 text-violet-700 ring-1 ring-violet-200">
    AI
  </span>
)}
```

**アクセシビリティ要件**:
- コントラスト比 WCAG AA以上（4.5:1以上）
- ダークモード対応時も同様の基準維持

### **15.4 パンくずナビゲーション**

記事詳細ページでのパンくず例:

```
Home > 特集 > 医療政策 > 今週の医療政策まとめ（第41週）
```

構造化データ（BreadcrumbList）も同時出力:
```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://example.com/" },
    { "@type": "ListItem", "position": 2, "name": "特集", "item": "https://example.com/topics" },
    { "@type": "ListItem", "position": 3, "name": "医療政策", "item": "https://example.com/topics/policy" },
    { "@type": "ListItem", "position": 4, "name": "今週の医療政策まとめ（第41週）" }
  ]
}
```

---

## 16. 付録

### **16.1 法務ページ**

必須ページ:
- `/about` - サイト概要
- `/legal/privacy` - プライバシーポリシー
- `/legal/terms` - 利用規約
- `/legal/tokusho` - 特定商取引法表記
- `/status` - 稼働情報

### **16.2 PHI（保護医療情報）ポリシー**

**メール本文に含めてはいけない情報:**
- 患者氏名
- 診断名・病名
- 処方内容
- 検査結果
- カルテ番号

**許可される情報:**
- 購入したコンテンツのタイトル
- 領収書ダウンロードリンク（署名付きURL）
- ログインリンク（セッショントークン）

### **16.3 主要コマンド**

```bash
# 開発サーバー起動
npm run dev

# DB マイグレーション
npx prisma migrate dev

# Prisma Studio（DB GUI）
npx prisma studio

# メールテンプレートプレビュー
npm run email:dev

# E2E テスト
npx playwright test

# ビルド
npm run build

# 本番起動
npm start
```

---

以上が最終版の技術要件書です。
