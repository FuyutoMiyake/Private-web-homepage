# Claude Code 実装指示プロンプト

このドキュメントは、Claude Code CLI に直接貼り付けて実行できる実装指示プロンプト集です。
各フェーズごとに分割されており、段階的に実装を進めることができます。

---

## 📋 実装フェーズ一覧

1. **Phase 1: プロジェクト基盤** - Next.js + Supabase + Vercel KV セットアップ
2. **Phase 2: コア機能** - 記事CRUD、ペイウォール、Topics、検索
3. **Phase 3: UI/管理画面** - トップページ、記事詳細、管理画面
4. **Phase 4: セキュリティ/メール** - Turnstile、Rate Limit、Resend、Stripe Seeds
5. **Phase 5: SNS/テスト** - SNS リンク、E2E テスト、GA4

---

## 🚀 Phase 1: プロジェクト基盤

### 実行コマンド

以下のプロンプトを Claude Code CLI にそのまま貼り付けてください。

```markdown
あなたは Next.js 14 (App Router) + TypeScript + Prisma + Supabase のプロジェクトを初期化する熟練エンジニアです。以下の仕様に忠実に実装してください。

## 0. 前提

* Stack: Next.js 14 (App Router), TypeScript (strict mode), Prisma, Supabase (PostgreSQL), Vercel KV
* デプロイ: Vercel
* スタイリング: TailwindCSS
* すべて TypeScript で型安全に実装

## 1. プロジェクト初期化

* `create-next-app` で Next.js 14 プロジェクトを作成
  - App Router 使用
  - TypeScript 有効
  - ESLint 有効
  - Tailwind CSS 有効
  - `src/` ディレクトリ不使用（`app/` 直下）
  - Import alias: `@/*`

```bash
npx create-next-app@latest . --typescript --tailwind --app --no-src-dir --import-alias "@/*"
```

## 2. 依存パッケージ追加

```bash
# Prisma
pnpm add prisma @prisma/client
pnpm add -D prisma

# Vercel KV
pnpm add @vercel/kv

# React Icons
pnpm add react-icons

# Markdown/MDX
pnpm add remark remark-strip-markdown
pnpm add @next/mdx @mdx-js/loader @mdx-js/react
pnpm add rehype-sanitize

# Validation
pnpm add zod

# Resend (メール)
pnpm add resend react-email @react-email/components

# Stripe
pnpm add stripe

# Sanitization
pnpm add isomorphic-dompurify

# Playwright (E2E)
pnpm add -D @playwright/test
```

## 3. 環境変数テンプレート作成

`.env.example` を作成:

```bash
# Next.js
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NODE_ENV=development

# Database (Supabase)
DATABASE_URL=postgresql://user:password@host:5432/database

# Vercel KV (本番環境で自動設定、ローカルは不要)
KV_URL=
KV_REST_API_URL=
KV_REST_API_TOKEN=
KV_REST_API_READ_ONLY_TOKEN=

# Notion API
NOTION_TOKEN=
NOTION_DATABASE_ID=

# Stripe (将来、現在は空でOK)
FEATURE_STRIPE_ENABLED=false
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_SUCCESS_URL=http://localhost:3000/thanks
STRIPE_CANCEL_URL=http://localhost:3000/cancel

# Resend (メール配信)
RESEND_API_KEY=
RESEND_WEBHOOK_SECRET=
EMAIL_FROM=no-reply@example.test
FEATURE_EMAIL_ENABLED=false
EMAIL_ALLOWLIST=
EMAIL_TEST_MODE=true

# Cloudflare Turnstile
NEXT_PUBLIC_TURNSTILE_SITEKEY=1x00000000000000000000AA
TURNSTILE_SECRET=1x0000000000000000000000000000000AA
E2E_TEST_MODE=false

# GA4
NEXT_PUBLIC_GA_MEASUREMENT_ID=

# Sentry
NEXT_PUBLIC_SENTRY_DSN=
SENTRY_AUTH_TOKEN=

# Admin (開発用)
ADMIN_JWT=your-dev-jwt-token

# Admin Access Control (いずれか必須)
ADMIN_BASIC_USER=admin
ADMIN_BASIC_PASS=change-me-in-production
# または
ADMIN_ALLOW_IPS=127.0.0.1,203.0.113.10
```

`.env.local` も同じ内容で作成（gitignore済み）

## 4. Prisma 初期化

```bash
npx prisma init
```

`prisma/schema.prisma` を以下の内容に置き換え:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Phase 1 では最小スキーマのみ（後続フェーズで拡張）
model Post {
  id        String   @id @default(uuid())
  slug      String   @unique
  title     String
  body      String
  summary   String?
  category  String   @default("other")
  tags      String[]
  status    String   @default("draft")
  publishAt DateTime?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([status, publishAt])
}

model SiteSettings {
  id        Int      @id @default(1)
  siteTitle String   @default("Medical News Site")
  updatedAt DateTime @updatedAt
}
```

## 5. Prisma Client セットアップ

`lib/db.ts` を作成:

```typescript
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error']
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
```

## 6. Vercel KV セットアップ

`lib/kv.ts` を作成:

```typescript
import { kv } from '@vercel/kv'

/**
 * レート制限チェック
 * @param key - 一意のキー（例: "rate:comment:192.168.1.1"）
 * @param limit - 制限回数
 * @param windowSec - 時間窓（秒）
 * @returns true: 許可, false: 制限超過
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowSec: number
): Promise<boolean> {
  // ローカル開発時は KV が利用不可の場合があるので常に許可
  if (process.env.NODE_ENV === 'development' && !process.env.KV_URL) {
    return true
  }

  try {
    const count = await kv.incr(key)

    if (count === 1) {
      await kv.expire(key, windowSec)
    }

    return count <= limit
  } catch (error) {
    console.error('Rate limit check failed:', error)
    return true // エラー時は許可（サービス継続優先）
  }
}
```

## 7. TypeScript 設定強化

`tsconfig.json` を更新:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./*"]
    },
    "strictNullChecks": true,
    "noUncheckedIndexedAccess": true
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

## 8. Tailwind 設定

`tailwind.config.ts` を更新:

```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8'
        }
      }
    }
  },
  plugins: []
}
export default config
```

## 9. ESLint 設定

`.eslintrc.json` を更新:

```json
{
  "extends": [
    "next/core-web-vitals",
    "plugin:@typescript-eslint/recommended"
  ],
  "rules": {
    "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
    "@typescript-eslint/no-explicit-any": "error"
  }
}
```

## 10. gitignore 追加

`.gitignore` に追記:

```
# Environment
.env
.env.local
.env*.local

# Vercel
.vercel

# Prisma
migrations/
*.db
*.db-journal
```

## 11. package.json スクリプト追加

`package.json` に以下を追加:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "prisma generate && next build",
    "start": "next start",
    "lint": "next lint",
    "lint:fix": "next lint --fix",
    "type-check": "tsc --noEmit",
    "db:migrate": "prisma migrate dev",
    "db:push": "prisma db push",
    "db:studio": "prisma studio",
    "db:seed": "prisma db seed",
    "email:dev": "email dev",
    "email:build": "email build",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui"
  }
}
```

## 12. 受け入れ条件

* [ ] `pnpm install` が成功
* [ ] `pnpm dev` でサーバーが起動（http://localhost:3000）
* [ ] `.env.local` が作成され、必須項目が設定されている
* [ ] `prisma/schema.prisma` が存在
* [ ] `lib/db.ts` と `lib/kv.ts` が存在
* [ ] TypeScript の型チェックが通る（`pnpm type-check`）
* [ ] ESLint でエラーなし（`pnpm lint`）

---

実装完了後、以下を出力してください:
1. 作成したファイル一覧
2. `pnpm dev` の実行結果（スクリーンショット or ログ）
3. 次のフェーズ（Phase 2）への準備完了確認
```

---

## 🗄️ Phase 2: コア機能（記事、ペイウォール、Topics、検索）

### 実行コマンド

```markdown
あなたは Next.js 14 (App Router) + Prisma + Supabase のプロジェクトに、記事管理、ペイウォール、Topics（特集）、検索機能を実装する熟練エンジニアです。Phase 1 で構築した基盤の上に実装してください。

## 0. 前提

* Phase 1 完了済み（Next.js, Prisma, Vercel KV セットアップ済み）
* 既存の `Post` モデルを拡張
* ペイウォールは SSR で preview のみ返却、paid は API 経由
* 検索は PostgreSQL tsvector + pg_trgm

## 1. Prisma スキーマ拡張

`prisma/schema.prisma` を以下に更新:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Post {
  id       String   @id @default(uuid())
  slug     String   @unique
  title    String
  body     String   // MDX/Markdown
  summary  String?
  category String   @default("other") // 'policy' | 'dx' | 'other'
  tags     String[]

  publishAt DateTime?
  status    String   @default("draft") // 'draft' | 'scheduled' | 'published'

  // Paywall
  paywallEnabled       Boolean  @default(true)
  freeMode             String   @default("marker") // 'marker' | 'chars' | 'sections'
  freeChars            Int?
  freeSections         Int?
  priceJpy             Int?
  isSubscriptionExempt Boolean  @default(false)

  // Featured
  isFeatured    Boolean   @default(false)
  featuredOrder Int?
  featuredUntil DateTime?

  // Search (PostgreSQLで自動生成)
  searchVector Unsupported("tsvector")?

  sourceUrls String[] // 一次情報URL (最大3つ)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  topicPosts TopicPost[]
  comments   Comment[]

  @@index([status, publishAt])
  @@index([isFeatured, featuredOrder])
  @@index([searchVector], type: Gin)
  @@index([title(ops: raw("gin_trgm_ops"))], type: Gin)
}

model Topic {
  id          String @id @default(uuid())
  slug        String @unique
  title       String
  description String // 100-200字の導入文
  coverImage  String?
  priority    Int    @default(0)

  searchVector Unsupported("tsvector")?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  posts    TopicPost[]
  faqs     TopicFaq[]
  glossary TopicGlossary[]

  @@index([priority])
  @@index([searchVector], type: Gin)
}

model TopicPost {
  topicId      String
  postId       String
  displayOrder Int     @default(0)
  isFeatured   Boolean @default(false) // "まず読む3本"

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

model ArticleAlias {
  id        String   @id @default(uuid())
  postId    String
  oldSlug   String   @unique
  createdAt DateTime @default(now())

  @@index([oldSlug])
}

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

model SiteSettings {
  id                 Int      @id @default(1)
  siteTitle          String   @default("Medical News Site")
  commentMode        String   @default("pre_moderation") // 'pre_moderation' | 'post_moderation'
  currency           String   @default("JPY")
  taxInclusive       Boolean  @default(true)
  defaultPriceJpy    Int?
  paywallDefaultMode String   @default("marker")
  featuredMax        Int      @default(4)
  updatedAt          DateTime @updatedAt
}
```

マイグレーション実行:

```bash
npx prisma migrate dev --name add_core_features
```

## 2. PostgreSQL 拡張（Supabase で実行）

Supabase Dashboard > SQL Editor で以下を実行:

```sql
-- pg_trgm 拡張（部分一致用）
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Posts 検索用カラム
ALTER TABLE "Post"
ADD COLUMN "searchVector" tsvector
GENERATED ALWAYS AS (
  setweight(to_tsvector('simple', coalesce(title,'')), 'A') ||
  setweight(to_tsvector('simple', coalesce(summary,'')), 'B') ||
  setweight(to_tsvector('simple', coalesce(body,'')), 'C') ||
  setweight(to_tsvector('simple', coalesce(array_to_string(tags, ' '),'')), 'D')
) STORED;

CREATE INDEX "Post_searchVector_idx" ON "Post" USING GIN("searchVector");
CREATE INDEX "Post_title_trgm_idx" ON "Post" USING GIN(title gin_trgm_ops);

-- Topics 検索用カラム
ALTER TABLE "Topic"
ADD COLUMN "searchVector" tsvector
GENERATED ALWAYS AS (
  setweight(to_tsvector('simple', coalesce(title,'')), 'A') ||
  setweight(to_tsvector('simple', coalesce(description,'')), 'B')
) STORED;

CREATE INDEX "Topic_searchVector_idx" ON "Topic" USING GIN("searchVector");
```

## 3. ペイウォールロジック

`lib/paywall.ts` を作成:

```typescript
import { Post } from '@prisma/client'

export type SplitContent = {
  preview: string
  paid: string
}

/**
 * 本文を無料部分と有料部分に分割
 */
export function split(post: Post): SplitContent {
  if (!post.paywallEnabled) {
    return { preview: post.body, paid: '' }
  }

  switch (post.freeMode) {
    case 'marker': {
      // "<!-- more -->" で分割
      const parts = post.body.split('<!-- more -->')
      return {
        preview: parts[0] || post.body.slice(0, 600),
        paid: parts[1] || ''
      }
    }

    case 'chars': {
      // 文字数で分割
      const chars = post.freeChars || 800
      return {
        preview: post.body.slice(0, chars),
        paid: post.body.slice(chars)
      }
    }

    case 'sections': {
      // セクション（H2見出し）で分割
      const sections = post.body.split(/(?=^## )/m)
      const freeSections = post.freeSections || 2
      const preview = sections.slice(0, freeSections).join('')
      const paid = sections.slice(freeSections).join('')
      return { preview, paid }
    }

    default:
      return { preview: post.body, paid: '' }
  }
}

/**
 * プレビュー部分をプレーンテキストに変換
 */
export function getPreviewText(post: Post): string {
  const { preview } = split(post)
  return stripMarkdown(preview)
}

/**
 * Markdownを除去（簡易版）
 */
function stripMarkdown(md: string): string {
  return md
    .replace(/^#+\s+/gm, '') // 見出し
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // リンク
    .replace(/[*_]{1,2}([^*_]+)[*_]{1,2}/g, '$1') // 強調
    .replace(/`([^`]+)`/g, '$1') // コード
    .replace(/<!--.*?-->/gs, '') // コメント
    .trim()
}
```

## 4. 抜粋生成

`lib/excerpt.ts` を作成:

```typescript
/**
 * プレビュー本文から抜粋を生成（句読点で丸め）
 */
export function excerptFromPreview(text: string, max = 160): string {
  // 連続空白を1つに
  const plain = text.replace(/\s+/g, ' ').trim()

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

## 5. 検索API

`app/api/search/route.ts` を作成:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q') || ''
  const limit = parseInt(searchParams.get('limit') || '20')

  if (q.length < 2) {
    return NextResponse.json({ results: [], total: 0, query: q })
  }

  // クエリのサニタイズ
  const sanitized = q.replace(/[^\w\s\u3000-\u9fff]/g, ' ').trim()
  const tsquery = sanitized.split(/\s+/).join(' & ')

  // Topics（2倍ブースト）
  const topics = await db.$queryRaw<Array<{ id: string; slug: string; title: string; type: string; rank: number }>>`
    SELECT
      id, slug, title, 'topic' as type,
      ts_rank("searchVector", to_tsquery('simple', ${tsquery})) * 2 AS rank
    FROM "Topic"
    WHERE "searchVector" @@ to_tsquery('simple', ${tsquery})
  `

  // Posts
  const posts = await db.$queryRaw<Array<{ id: string; slug: string; title: string; summary: string | null; type: string; rank: number }>>`
    SELECT
      id, slug, title, summary, 'post' as type,
      ts_rank("searchVector", to_tsquery('simple', ${tsquery})) AS rank
    FROM "Post"
    WHERE
      status = 'published'
      AND (
        "searchVector" @@ to_tsquery('simple', ${tsquery})
        OR title ILIKE ${`%${sanitized}%`}
        OR ${sanitized} = ANY(tags)
      )
  `

  const combined = [...topics, ...posts]
    .sort((a, b) => b.rank - a.rank)
    .slice(0, limit)

  return NextResponse.json({
    results: combined,
    total: combined.length,
    query: q
  })
}
```

## 6. 記事API（公開用）

`app/api/posts/route.ts` を作成:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getPreviewText } from '@/lib/paywall'
import { excerptFromPreview } from '@/lib/excerpt'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const limit = parseInt(searchParams.get('limit') || '20')
  const category = searchParams.get('category')

  const posts = await db.post.findMany({
    where: {
      status: 'published',
      category: category || undefined
    },
    orderBy: { publishAt: 'desc' },
    take: limit,
    select: {
      id: true,
      slug: true,
      title: true,
      summary: true,
      category: true,
      tags: true,
      publishAt: true
    }
  })

  const results = await Promise.all(
    posts.map(async (post) => {
      const fullPost = await db.post.findUnique({ where: { id: post.id } })
      const previewText = fullPost ? getPreviewText(fullPost) : ''
      const excerpt = excerptFromPreview(previewText, 120)

      return {
        ...post,
        previewText: excerpt
      }
    })
  )

  return NextResponse.json({ results, total: results.length })
}
```

`app/api/posts/[slug]/route.ts` を作成:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { split } from '@/lib/paywall'

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const post = await db.post.findUnique({
    where: { slug: params.slug }
  })

  if (!post || post.status !== 'published') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const { preview } = split(post)

  return NextResponse.json({
    id: post.id,
    slug: post.slug,
    title: post.title,
    summary: post.summary,
    category: post.category,
    tags: post.tags,
    publishedAt: post.publishAt,
    previewHtml: preview, // MDXレンダリングは後続で実装
    paywall: {
      enabled: post.paywallEnabled,
      priceJpy: post.priceJpy,
      freeMode: post.freeMode
    },
    sourceUrls: post.sourceUrls
  })
}
```

## 7. 受け入れ条件

* [ ] `npx prisma migrate dev` が成功
* [ ] Supabase で pg_trgm/tsvector が有効化
* [ ] `GET /api/posts` で記事一覧が取得できる
* [ ] `GET /api/posts/[slug]` で記事詳細が取得できる（preview のみ）
* [ ] `GET /api/search?q=医療` で検索結果が返る
* [ ] `lib/paywall.ts` で marker/chars/sections が正しく分割される
* [ ] すべて TypeScript で型安全

---

実装完了後、以下を出力してください:
1. 作成したファイル一覧
2. API のテストリクエスト例（curl or Postman）
3. 次のフェーズ（Phase 3）への準備完了確認
```

---

## 🎨 Phase 3: UI/管理画面

### 実行コマンド

```markdown
あなたは Next.js 14 (App Router) のプロジェクトに、トップページ、記事詳細ページ、管理画面を実装する熟練エンジニアです。Phase 2 で実装した API を使用してください。

## 0. 前提

* Phase 2 完了済み（API、ペイウォール、検索実装済み）
* Server Components 中心、必要な部分のみ Client Components
* Tailwind CSS でスタイリング
* アクセシビリティ対応（WCAG 2.1 AA）

## 1. 共通UIコンポーネント

`components/ui/Button.tsx` を作成:

```typescript
import { ButtonHTMLAttributes, forwardRef } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline'
  size?: 'sm' | 'md' | 'lg'
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', className = '', ...props }, ref) => {
    const baseStyles = 'rounded font-medium transition focus:outline-none focus:ring-2'
    const variants = {
      primary: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500',
      secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500',
      outline: 'border-2 border-primary-600 text-primary-600 hover:bg-primary-50 focus:ring-primary-500'
    }
    const sizes = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg'
    }

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      />
    )
  }
)

Button.displayName = 'Button'
```

同様に以下も作成:
- `components/ui/Card.tsx`
- `components/ui/Input.tsx`
- `components/ui/Select.tsx`
- `components/ui/Textarea.tsx`

（実装は省略、Button と同様のパターン）

## 2. トップページ

`app/(public)/page.tsx` を作成:

```typescript
import { db } from '@/lib/db'
import { TopicsGrid } from '@/components/home/TopicsGrid'
import { FeaturedRow } from '@/components/home/FeaturedRow'
import { LatestStream } from '@/components/home/LatestStream'

export const revalidate = 900 // 15分キャッシュ

async function getTopics() {
  return db.topic.findMany({
    take: 3,
    orderBy: { priority: 'desc' },
    include: {
      posts: {
        where: {
          post: { status: 'published' },
          isFeatured: true
        },
        take: 3,
        orderBy: { displayOrder: 'asc' },
        include: {
          post: {
            select: { id: true, slug: true, title: true, publishAt: true }
          }
        }
      }
    }
  })
}

async function getFeaturedPosts() {
  return db.post.findMany({
    where: {
      status: 'published',
      isFeatured: true,
      OR: [
        { featuredUntil: null },
        { featuredUntil: { gt: new Date() } }
      ]
    },
    orderBy: [
      { featuredOrder: 'asc' },
      { publishAt: 'desc' }
    ],
    take: 4
  })
}

async function getLatestPosts() {
  return db.post.findMany({
    where: { status: 'published' },
    orderBy: { publishAt: 'desc' },
    take: 10,
    select: {
      id: true,
      slug: true,
      title: true,
      summary: true,
      category: true,
      tags: true,
      publishAt: true
    }
  })
}

export default async function HomePage() {
  const [topics, featured, latest] = await Promise.allSettled([
    getTopics(),
    getFeaturedPosts(),
    getLatestPosts()
  ])

  return (
    <main className="container mx-auto px-4 py-8">
      {/* 特集 */}
      {topics.status === 'fulfilled' && (
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-6">特集</h2>
          <TopicsGrid topics={topics.value} />
        </section>
      )}

      {/* 注目記事 */}
      {featured.status === 'fulfilled' && (
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-6">注目記事</h2>
          <FeaturedRow posts={featured.value} />
        </section>
      )}

      {/* 最新記事 */}
      {latest.status === 'fulfilled' && (
        <section>
          <h2 className="text-3xl font-bold mb-6">最新記事</h2>
          <LatestStream posts={latest.value} />
        </section>
      )}
    </main>
  )
}
```

`components/home/TopicsGrid.tsx` を作成:

```typescript
import Link from 'next/link'
import { Topic, TopicPost, Post } from '@prisma/client'

type TopicWithPosts = Topic & {
  posts: Array<TopicPost & { post: Pick<Post, 'id' | 'slug' | 'title' | 'publishAt'> }>
}

interface Props {
  topics: TopicWithPosts[]
}

export function TopicsGrid({ topics }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {topics.map((topic) => (
        <Link
          key={topic.id}
          href={`/topics/${topic.slug}`}
          className="border rounded-lg p-6 hover:shadow-lg transition"
        >
          <h3 className="text-xl font-bold mb-2">{topic.title}</h3>
          <p className="text-gray-600 mb-4">{topic.description.slice(0, 100)}...</p>

          {/* 代表記事 */}
          {topic.posts.length > 0 && (
            <ul className="space-y-2 text-sm">
              {topic.posts.map(({ post }) => (
                <li key={post.id} className="text-primary-600 hover:underline">
                  → {post.title}
                </li>
              ))}
            </ul>
          )}
        </Link>
      ))}
    </div>
  )
}
```

`components/home/FeaturedRow.tsx` と `components/home/LatestStream.tsx` も同様に実装（省略）

## 3. 記事詳細ページ

`app/(public)/news/[slug]/page.tsx` を作成:

```typescript
import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { split } from '@/lib/paywall'
import { PaywallCTA } from '@/components/paywall/PaywallCTA'

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const post = await db.post.findUnique({ where: { slug: params.slug } })
  if (!post) return {}

  return {
    title: post.title,
    description: post.summary
  }
}

export default async function ArticlePage({ params }: { params: { slug: string } }) {
  const post = await db.post.findUnique({
    where: { slug: params.slug }
  })

  if (!post || post.status !== 'published') {
    notFound()
  }

  const { preview, paid } = split(post)

  return (
    <div className="container mx-auto px-4 py-8">
      <article className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold mb-4">{post.title}</h1>

        <div className="flex items-center gap-4 text-sm text-gray-600 mb-8">
          <span>{post.category}</span>
          <span>{new Date(post.publishAt || post.createdAt).toLocaleDateString()}</span>
        </div>

        {/* プレビュー部分 */}
        <div
          className="prose prose-lg max-w-none"
          dangerouslySetInnerHTML={{ __html: preview }}
        />

        {/* ペイウォール */}
        {post.paywallEnabled && paid && (
          <PaywallCTA post={post} />
        )}

        {/* 一次情報リンク */}
        {post.sourceUrls.length > 0 && (
          <div className="mt-8 border-t pt-4">
            <h3 className="font-bold mb-2">参考情報</h3>
            <ul className="space-y-1">
              {post.sourceUrls.map((url, i) => (
                <li key={i}>
                  <a href={url} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
                    {url}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </article>
    </div>
  )
}
```

`components/paywall/PaywallCTA.tsx` を作成:

```typescript
'use client'

import { Post } from '@prisma/client'
import { Button } from '@/components/ui/Button'

interface Props {
  post: Pick<Post, 'id' | 'title' | 'priceJpy'>
}

export function PaywallCTA({ post }: Props) {
  const handlePurchase = () => {
    // Phase 4 で Stripe 連携
    window.location.href = '/pricing'
  }

  return (
    <div className="border-t border-b py-8 my-8 text-center">
      <h3 className="text-2xl font-bold mb-4">ここから先は有料です</h3>

      <ul className="text-left max-w-md mx-auto mb-6 space-y-2">
        <li>✓ 独自の分析と解説</li>
        <li>✓ 一次情報へのリンク</li>
        <li>✓ 専門家の見解</li>
      </ul>

      <p className="text-3xl font-bold mb-6">
        ¥{post.priceJpy?.toLocaleString() || '980'}
      </p>

      <Button onClick={handlePurchase} size="lg">
        この記事を購入する
      </Button>

      <p className="text-sm text-gray-600 mt-4">
        月額プランに登録すると、すべての記事が読み放題です
      </p>
    </div>
  )
}
```

## 4. 管理画面（基礎）

`app/(admin)/admin/layout.tsx` を作成:

```typescript
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      {/* サイドバー */}
      <aside className="w-64 bg-gray-900 text-white p-6">
        <h1 className="text-2xl font-bold mb-8">管理画面</h1>
        <nav className="space-y-2">
          <a href="/admin" className="block py-2 px-4 rounded hover:bg-gray-800">
            ダッシュボード
          </a>
          <a href="/admin/posts" className="block py-2 px-4 rounded hover:bg-gray-800">
            記事管理
          </a>
          <a href="/admin/comments" className="block py-2 px-4 rounded hover:bg-gray-800">
            コメント
          </a>
          <a href="/admin/settings" className="block py-2 px-4 rounded hover:bg-gray-800">
            設定
          </a>
        </nav>
      </aside>

      {/* メインコンテンツ */}
      <main className="flex-1 bg-gray-50 p-8">
        {children}
      </main>
    </div>
  )
}
```

`app/(admin)/admin/posts/page.tsx` を作成:

```typescript
import Link from 'next/link'
import { db } from '@/lib/db'
import { Button } from '@/components/ui/Button'

export default async function AdminPostsPage() {
  const posts = await db.post.findMany({
    orderBy: { updatedAt: 'desc' },
    take: 50
  })

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">記事管理</h1>
        <Link href="/admin/posts/new">
          <Button>新規作成</Button>
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow">
        <table className="w-full">
          <thead className="border-b">
            <tr>
              <th className="text-left p-4">タイトル</th>
              <th className="text-left p-4">ステータス</th>
              <th className="text-left p-4">公開日時</th>
              <th className="text-left p-4">操作</th>
            </tr>
          </thead>
          <tbody>
            {posts.map((post) => (
              <tr key={post.id} className="border-b hover:bg-gray-50">
                <td className="p-4">{post.title}</td>
                <td className="p-4">
                  <span
                    className={`px-2 py-1 rounded text-sm ${
                      post.status === 'published'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {post.status}
                  </span>
                </td>
                <td className="p-4">
                  {post.publishAt ? new Date(post.publishAt).toLocaleString() : '-'}
                </td>
                <td className="p-4">
                  <Link href={`/admin/posts/${post.id}`}>
                    <Button variant="outline" size="sm">
                      編集
                    </Button>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

## 5. 受け入れ条件

* [ ] トップページ（`/`）が表示される
* [ ] 特集・注目記事・最新記事が表示される
* [ ] 記事詳細（`/news/[slug]`）が表示される
* [ ] ペイウォール CTA が表示される
* [ ] 管理画面（`/admin/posts`）で記事一覧が表示される
* [ ] レスポンシブデザイン（モバイル対応）
* [ ] アクセシビリティ（フォーカスリング、aria-label）

---

実装完了後、以下を出力してください:
1. 作成したファイル一覧
2. スクリーンショット（トップ、記事詳細、管理画面）
3. 次のフェーズ（Phase 4）への準備完了確認
```

---

## 🔒 Phase 4: セキュリティ/メール（Turnstile、Rate Limit、Resend、Stripe Seeds）

### 実行コマンド

```markdown
あなたは Next.js 14 のプロジェクトに、Cloudflare Turnstile（CAPTCHA）、Rate Limiting、Resend（メール配信）、Stripe Seeds を実装する熟練エンジニアです。Phase 3 で実装した UI にセキュリティ層を追加してください。

## 0. 前提

* Phase 3 完了済み（UI/管理画面実装済み）
* Turnstile は E2E_TEST_MODE で無効化可能
* Resend は FEATURE_EMAIL_ENABLED=false でDRY RUN
* Stripe は FEATURE_STRIPE_ENABLED=false で Seeds のみ
* Supabase RLS でデータベースレベルのアクセス制御
* 管理画面は Basic Auth または IP whitelist で保護
* Idempotency Key で重複操作を防止

## 0-1. Supabase RLS 設定

Supabase Dashboard > SQL Editor で以下を実行:

```sql
-- Posts: published のみ匿名 SELECT、管理者は全操作可能
ALTER TABLE "Post" ENABLE ROW LEVEL SECURITY;

CREATE POLICY posts_public_read
ON "Post" FOR SELECT
TO public
USING (status = 'published');

-- 管理者ポリシー（users.role = 'admin' がある場合）
-- users テーブルに role カラムがない場合、この部分は一旦スキップ
-- CREATE POLICY posts_admin_all
-- ON "Post" FOR ALL
-- TO authenticated
-- USING (EXISTS (
--   SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
-- ));

-- Comments: approved は全員 READ、INSERT は service_role のみ
ALTER TABLE "Comment" ENABLE ROW LEVEL SECURITY;

CREATE POLICY comments_public_read
ON "Comment" FOR SELECT
TO public
USING (status = 'approved');

CREATE POLICY comments_insert_service
ON "Comment" FOR INSERT
TO service_role
WITH CHECK (true);

-- Entitlements: 本人のみ SELECT、書き込みは service_role のみ
ALTER TABLE "Entitlement" ENABLE ROW LEVEL SECURITY;

CREATE POLICY entitlements_owner_read
ON "Entitlement" FOR SELECT
TO authenticated
USING (auth.uid() = "userId");

CREATE POLICY entitlements_insert_service
ON "Entitlement" FOR INSERT
TO service_role
WITH CHECK (true);
```

**注意**: 管理画面の記事作成・編集は `service_role` キーを使用してRLSをバイパスします。

`.env.local` に以下を追加:
```bash
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 0-2. 管理画面アクセス制御

管理画面（`/admin/*`）を Basic 認証または IP ホワイトリストで保護します。

### 方法 1: Basic 認証（推奨）

`middleware.ts` を作成:

```typescript
import { NextRequest, NextResponse } from 'next/server'

const ADMIN_PATH = /^\/admin(\/|$)/

export function middleware(req: NextRequest) {
  const url = req.nextUrl.pathname

  // 管理画面以外はスルー
  if (!ADMIN_PATH.test(url)) {
    return NextResponse.next()
  }

  const auth = req.headers.get('authorization')

  if (!auth || !auth.startsWith('Basic ')) {
    return new NextResponse('Unauthorized', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="Admin Panel"'
      }
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

`.env.local` に追加:
```bash
ADMIN_BASIC_USER=admin
ADMIN_BASIC_PASS=change-me-in-production
```

### 方法 2: IP ホワイトリスト

`middleware.ts` の代わりに IP チェック版を使用:

```typescript
import { NextRequest, NextResponse } from 'next/server'

const ADMIN_PATH = /^\/admin(\/|$)/

// 許可するIPアドレス（CIDR記法）
const ALLOWED_IPS = (process.env.ADMIN_ALLOW_IPS || '').split(',').map(ip => ip.trim())

export function middleware(req: NextRequest) {
  const url = req.nextUrl.pathname

  if (!ADMIN_PATH.test(url)) {
    return NextResponse.next()
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'

  // 簡易的なマッチング（本番では ip-cidr ライブラリ推奨）
  const allowed = ALLOWED_IPS.some(allowedIp => {
    if (allowedIp.includes('/')) {
      // CIDR記法（簡易実装、本番では ip-cidr を使用）
      return ip.startsWith(allowedIp.split('/')[0].split('.').slice(0, 3).join('.'))
    }
    return ip === allowedIp
  })

  if (!allowed) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*']
}
```

`.env.local` に追加:
```bash
# カンマ区切り、CIDR記法も可
ADMIN_ALLOW_IPS=127.0.0.1,203.0.113.10,192.168.1.0/24
```

## 0-3. Idempotency Key 実装

Prisma スキーマに `IdempotencyKey` モデルを追加:

```prisma
model IdempotencyKey {
  key       String   @id
  createdAt DateTime @default(now())

  @@index([createdAt])
}
```

マイグレーション:
```bash
npx prisma migrate dev --name add_idempotency_key
```

`lib/idempotency.ts` を作成:

```typescript
import { db } from './db'

/**
 * Idempotency Key を検証・記録
 * @throws Error('IDEMPOTENT_REPLAY') - 重複リクエスト
 */
export async function ensureIdempotent(key: string | null | undefined) {
  if (!key) return

  try {
    await db.idempotencyKey.create({
      data: { key }
    })
  } catch (e: any) {
    // P2002: Unique constraint violation
    if (e.code === 'P2002') {
      throw new Error('IDEMPOTENT_REPLAY')
    }
    throw e
  }
}
```

API ルートで使用例（`app/api/admin/posts/route.ts`）:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { ensureIdempotent } from '@/lib/idempotency'

export async function POST(req: NextRequest) {
  const idempotencyKey = req.headers.get('Idempotency-Key')

  try {
    await ensureIdempotent(idempotencyKey)
  } catch (e: any) {
    if (e.message === 'IDEMPOTENT_REPLAY') {
      return NextResponse.json(
        { error: 'Duplicate request detected' },
        { status: 409 }
      )
    }
    throw e
  }

  // 通常の処理
  // ...
}
```

## 1. Cloudflare Turnstile

`lib/captcha.ts` を作成:

```typescript
export function shouldVerifyCaptcha(): boolean {
  return process.env.NODE_ENV === 'production' && process.env.E2E_TEST_MODE !== 'true'
}

export function getTurnstileSitekey(): string {
  if (process.env.E2E_TEST_MODE === 'true') {
    return '1x00000000000000000000AA' // テストキー
  }
  return process.env.NEXT_PUBLIC_TURNSTILE_SITEKEY || ''
}

export async function verifyTurnstile(token: string): Promise<boolean> {
  if (!shouldVerifyCaptcha()) {
    return true
  }

  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      secret: process.env.TURNSTILE_SECRET,
      response: token
    })
  })

  const data = await response.json()
  return data.success === true
}
```

コメント投稿に統合（`app/api/comments/route.ts`）:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkRateLimit } from '@/lib/kv'
import { verifyTurnstile, shouldVerifyCaptcha } from '@/lib/captcha'

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || 'unknown'

  // Rate Limit
  if (!await checkRateLimit(`rate:comment:${ip}`, 5, 600)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const { postId, authorName, authorEmail, body, turnstileToken } = await req.json()

  // Turnstile 検証
  if (shouldVerifyCaptcha()) {
    const valid = await verifyTurnstile(turnstileToken)
    if (!valid) {
      return NextResponse.json({ error: 'Bot detected' }, { status: 403 })
    }
  }

  // サイト設定取得（承認制 or 即時公開）
  const settings = await db.siteSettings.findUnique({ where: { id: 1 } })
  const initialStatus = settings?.commentMode === 'post_moderation' ? 'approved' : 'pending'

  const comment = await db.comment.create({
    data: {
      postId,
      authorName,
      authorEmail,
      body,
      status: initialStatus,
      ipHash: hashIp(ip)
    }
  })

  return NextResponse.json({ id: comment.id, status: comment.status })
}

function hashIp(ip: string): string {
  // 簡易ハッシュ（本番では crypto.createHash('sha256') 推奨）
  return Buffer.from(ip).toString('base64').slice(0, 16)
}
```

## 2. Resend（メール配信、DRY RUN）

Prisma スキーマに `EmailEvent` 追加（Phase 2 で追加済みの場合はスキップ）:

```prisma
model EmailEvent {
  id        String   @id @default(uuid())
  type      String   // 'requested' | 'delivered' | 'opened' | etc.
  toMasked  String
  messageId String?  @unique
  dryRun    Boolean  @default(true)
  meta      Json?
  createdAt DateTime @default(now())

  @@index([type, createdAt])
}
```

`lib/email/resendProvider.ts` を作成:

```typescript
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

interface SendMailParams {
  to: string[]
  subject: string
  html: string
  text?: string
}

export async function sendMail(params: SendMailParams) {
  const { to, subject, html, text } = params

  // DRY RUN チェック
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

React Email テンプレート例（`emails/templates/PurchaseReceipt.tsx`）:

```typescript
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
      <Body style={{ fontFamily: 'sans-serif' }}>
        <Container>
          <Heading>ご購入ありがとうございます</Heading>
          <Text>
            {userName} 様<br />
            「{postTitle}」をご購入いただきありがとうございます。
          </Text>
          <Text>
            金額: ¥{amount.toLocaleString()}
          </Text>
          <Button href={receiptUrl} style={{ background: '#3b82f6', color: '#fff', padding: '12px 24px', borderRadius: '6px' }}>
            領収書をダウンロード
          </Button>
        </Container>
      </Body>
    </Html>
  )
}
```

## 3. Stripe Seeds

Prisma スキーマに追加:

```prisma
model Payment {
  id        String   @id @default(uuid())
  provider  String   // 'stripe'
  extId     String?  @unique
  amountJpy Int?
  currency  String?
  status    String   // 'created' | 'succeeded' | 'failed'
  meta      Json?
  userId    String?
  postId    String?
  createdAt DateTime @default(now())

  @@index([userId])
  @@index([status])
}

model Entitlement {
  id               String    @id @default(uuid())
  userId           String
  kind             String    // 'ppv' | 'sub'
  postId           String?
  source           String    // 'stripe' | 'manual'
  currentPeriodEnd DateTime?
  createdAt        DateTime  @default(now())

  @@index([userId, kind, postId])
}
```

`lib/flags.ts` を作成:

```typescript
export function isStripeEnabled(): boolean {
  return process.env.FEATURE_STRIPE_ENABLED === 'true'
}

export function isEmailEnabled(): boolean {
  return process.env.FEATURE_EMAIL_ENABLED === 'true'
}
```

`app/api/pay/checkout/route.ts` を作成:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { isStripeEnabled } from '@/lib/flags'

export async function POST(req: NextRequest) {
  const { postId } = await req.json()

  // Feature Flag チェック
  if (!isStripeEnabled()) {
    return NextResponse.json({ url: '/pricing' })
  }

  // TODO: 本実装（Stripe Checkout Session 作成）
  /**
   * Stripe 有効化手順:
   * 1. Stripe ダッシュボードで商品/価格作成
   * 2. FEATURE_STRIPE_ENABLED=true に設定
   * 3. 以下のコードを実装:
   *
   * const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
   * const session = await stripe.checkout.sessions.create({
   *   mode: 'payment',
   *   line_items: [{ price: post.stripePriceId, quantity: 1 }],
   *   success_url: process.env.STRIPE_SUCCESS_URL,
   *   cancel_url: process.env.STRIPE_CANCEL_URL
   * })
   * return NextResponse.json({ url: session.url })
   */

  return NextResponse.json({ url: '/pricing' })
}
```

`app/api/pay/webhook/route.ts` を作成:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(req: NextRequest) {
  // 署名検証（TODO: 本実装）
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    return new NextResponse(null, { status: 204 })
  }

  // TODO: イベント処理
  /**
   * const event = stripe.webhooks.constructEvent(body, signature, secret)
   *
   * if (event.type === 'checkout.session.completed') {
   *   await db.entitlement.create({
   *     data: {
   *       userId: session.customer,
   *       kind: 'ppv',
   *       postId: session.metadata.postId,
   *       source: 'stripe'
   *     }
   *   })
   * }
   */

  return NextResponse.json({ received: true })
}
```

## 4. SEO/配信ポリシー設定

### 4-1. 検索ページの noindex 設定

`app/(public)/search/page.tsx` を作成（または既存ファイルに追加）:

```typescript
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: '検索',
  robots: {
    index: false,
    follow: true
  }
}

export default function SearchPage() {
  // 検索UI実装
  return (
    <div>
      <h1>検索</h1>
      {/* 検索フォーム、結果表示など */}
    </div>
  )
}
```

### 4-2. NewsArticle 構造化データ

`lib/seo/structuredData.ts` を作成:

```typescript
import { Post } from '@prisma/client'
import { split } from '@/lib/paywall'

export function buildNewsArticleSchema(post: Post) {
  const { preview } = split(post)
  const isPaywalled = post.paywallEnabled

  const schema: any = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: post.title,
    description: post.summary || '',
    datePublished: post.publishAt?.toISOString() || post.createdAt.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    author: {
      '@type': 'Organization',
      name: 'Medical News Site'
    },
    isAccessibleForFree: !isPaywalled
  }

  // ペイウォールがある場合、無料プレビュー部分を明示
  if (isPaywalled) {
    schema.hasPart = {
      '@type': 'WebPageElement',
      isAccessibleForFree: true,
      cssSelector: '.article-preview'
    }
  }

  return schema
}
```

記事詳細ページに構造化データを追加（`app/(public)/news/[slug]/page.tsx`）:

```typescript
import { buildNewsArticleSchema } from '@/lib/seo/structuredData'

export default async function ArticlePage({ params }: { params: { slug: string } }) {
  const post = await db.post.findUnique({ where: { slug: params.slug } })

  if (!post || post.status !== 'published') {
    notFound()
  }

  const { preview, paid } = split(post)
  const structuredData = buildNewsArticleSchema(post)

  return (
    <>
      {/* 構造化データ */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <div className="container mx-auto px-4 py-8">
        <article className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold mb-4">{post.title}</h1>

          {/* プレビュー部分（構造化データ用クラス） */}
          <div
            className="prose prose-lg max-w-none article-preview"
            dangerouslySetInnerHTML={{ __html: preview }}
          />

          {/* ペイウォール */}
          {post.paywallEnabled && paid && (
            <>
              <PaywallCTA post={post} />
              {/* 有料部分のプレースホルダー（検索エンジンに表示させない） */}
              <div data-nosnippet className="text-gray-400 italic">
                この先は有料会員限定です
              </div>
            </>
          )}
        </article>
      </div>
    </>
  )
}
```

### 4-3. OGP/RSS プレビューのみ配信

`lib/seo/ogp.ts` を作成:

```typescript
import { Post } from '@prisma/client'
import { split } from '@/lib/paywall'
import { excerptFromPreview } from '@/lib/excerpt'

/**
 * OGP description を生成（プレビュー部分のみ）
 */
export function buildOgDescription(post: Post): string {
  const { preview } = split(post)
  const plainText = stripMarkdown(preview)
  return excerptFromPreview(plainText, 160)
}

function stripMarkdown(md: string): string {
  return md
    .replace(/^#+\s+/gm, '')
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
    .replace(/[*_]{1,2}([^*_]+)[*_]{1,2}/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/<!--.*?-->/gs, '')
    .trim()
}
```

記事詳細の metadata に適用:

```typescript
import { buildOgDescription } from '@/lib/seo/ogp'

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const post = await db.post.findUnique({ where: { slug: params.slug } })
  if (!post) return {}

  return {
    title: post.title,
    description: buildOgDescription(post),
    openGraph: {
      title: post.title,
      description: buildOgDescription(post),
      type: 'article',
      publishedTime: post.publishAt?.toISOString()
    }
  }
}
```

### 4-4. RSS フィード（プレビューのみ）

`app/(public)/rss.xml/route.ts` を作成:

```typescript
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { split } from '@/lib/paywall'
import { excerptFromPreview } from '@/lib/excerpt'

export async function GET() {
  const posts = await db.post.findMany({
    where: { status: 'published' },
    orderBy: { publishAt: 'desc' },
    take: 20
  })

  const items = posts.map(post => {
    const { preview } = split(post)
    const plainText = preview
      .replace(/^#+\s+/gm, '')
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
      .replace(/[*_]{1,2}([^*_]+)[*_]{1,2}/g, '$1')
      .trim()

    const description = excerptFromPreview(plainText, 200)
    const pubDate = (post.publishAt || post.createdAt).toUTCString()

    return `
      <item>
        <title><![CDATA[${post.title}]]></title>
        <link>${process.env.NEXT_PUBLIC_SITE_URL}/news/${post.slug}</link>
        <description><![CDATA[${description}]]></description>
        <pubDate>${pubDate}</pubDate>
        <guid>${process.env.NEXT_PUBLIC_SITE_URL}/news/${post.slug}</guid>
      </item>
    `
  }).join('')

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Medical News Site</title>
    <link>${process.env.NEXT_PUBLIC_SITE_URL}</link>
    <description>医療政策・医療DXの最新ニュース</description>
    <language>ja</language>
    <atom:link href="${process.env.NEXT_PUBLIC_SITE_URL}/rss.xml" rel="self" type="application/rss+xml" />
    ${items}
  </channel>
</rss>`

  return new NextResponse(rss, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600'
    }
  })
}
```

## 5. 受け入れ条件

### セキュリティ

* [ ] Supabase RLS ポリシーが有効化されている
* [ ] 管理画面（`/admin`）に Basic 認証または IP whitelist でアクセス制限がかかっている
* [ ] Idempotency Key で重複リクエストが 409 エラーになる
* [ ] コメント投稿で Turnstile 検証が動作
* [ ] E2E_TEST_MODE=true で Turnstile がスキップされる
* [ ] Rate Limit で 5回目の投稿が 429 エラー

### メール/決済

* [ ] メール送信で DRY RUN ログが出力される
* [ ] Stripe Checkout が /pricing へリダイレクト

### SEO/配信

* [ ] `/search` ページに `robots: { index: false }` が設定されている
* [ ] 記事詳細ページに NewsArticle 構造化データが出力される
* [ ] ペイウォール記事で `isAccessibleForFree: false` と `hasPart` が設定されている
* [ ] 有料部分プレースホルダーに `data-nosnippet` 属性がある
* [ ] OGP description がプレビュー部分のみから生成される
* [ ] RSS フィードがプレビュー部分のみを配信する
* [ ] `/rss.xml` が正しい XML を返す

### 全般

* [ ] すべて TypeScript で型安全

---

実装完了後、以下を出力してください:
1. 作成したファイル一覧
2. セキュリティ検証:
   - Supabase RLS ポリシー確認（SQL実行結果）
   - 管理画面アクセステスト（Basic Auth または IP whitelist）
   - Idempotency Key テスト（curl例）
3. SEO検証:
   - `/search` の robots メタタグ確認
   - 記事詳細の構造化データ確認（view-source で JSON-LD）
   - OGP description のプレビュー制限確認
   - `/rss.xml` の出力確認
4. テスト実行ログ（Turnstile/Rate Limit/Resend）
5. 次のフェーズ（Phase 5）への準備完了確認
```

---

## 📱 Phase 5: SNS/テスト（SNS リンク、E2E、GA4）

### 実行コマンド

```markdown
あなたは Next.js 14 のプロジェクトに、SNS リンク集、Playwright E2E テスト、GA4 統合を実装する熟練エンジニアです。Phase 4 で実装したセキュリティ機能をテストしてください。

## 0. 前提

* Phase 4 完了済み（Turnstile, Rate Limit, Resend, Stripe Seeds 実装済み）
* SNS リンクは管理画面から設定可能
* E2E テストは Playwright
* GA4 イベント送信

## 1. SNS リンク集

Prisma スキーマに追加（`SiteSettings` に統合）:

```prisma
model SiteSettings {
  id                 Int      @id @default(1)
  siteTitle          String   @default("Medical News Site")
  commentMode        String   @default("pre_moderation")
  currency           String   @default("JPY")
  taxInclusive       Boolean  @default(true)
  defaultPriceJpy    Int?
  paywallDefaultMode String   @default("marker")
  featuredMax        Int      @default(4)

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

`components/sns/SocialLinks.tsx` を作成:

```typescript
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
    { key: 'line', url: links.line, Icon: RiLineFill, label: 'LINE', color: '#06C755' },
    { key: 'instagram', url: links.instagram, Icon: Instagram, label: 'Instagram', color: '#E4405F' },
    { key: 'youtube', url: links.youtube, Icon: Youtube, label: 'YouTube', color: '#FF0000' },
    { key: 'tiktok', url: links.tiktok, Icon: TikTok, label: 'TikTok', color: '#000000' },
    { key: 'facebook', url: links.facebook, Icon: Facebook, label: 'Facebook', color: '#1877F2' }
  ].filter(p => p.url)

  if (platforms.length === 0) return null

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-11 h-11',
    lg: 'w-14 h-14'
  }

  return (
    <div className={`flex gap-3 ${variant === 'vertical' ? 'flex-col' : 'flex-row'}`}>
      {platforms.map(({ key, url, Icon, label, color }) => (
        <a
          key={key}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${label}でフォロー`}
          className={`
            ${sizeClasses[size]}
            flex items-center justify-center
            rounded-full
            bg-gray-100 dark:bg-gray-800
            text-gray-700 dark:text-gray-300
            hover:bg-[${color}] hover:text-white
            transition-colors duration-200
            focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[${color}]
          `}
        >
          <Icon className="w-5 h-5" />
        </a>
      ))}
    </div>
  )
}

// TikTok アイコン（react-iconsにない場合）
function TikTok({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
    </svg>
  )
}
```

管理画面に SNS 設定追加（`app/(admin)/admin/settings/page.tsx`）:

```typescript
import { db } from '@/lib/db'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

async function updateSettings(formData: FormData) {
  'use server'

  await db.siteSettings.update({
    where: { id: 1 },
    data: {
      snsTwitter: formData.get('snsTwitter') as string || '',
      snsLinkedin: formData.get('snsLinkedin') as string || '',
      snsLine: formData.get('snsLine') as string || '',
      snsInstagram: formData.get('snsInstagram') as string || '',
      snsYoutube: formData.get('snsYoutube') as string || '',
      snsTiktok: formData.get('snsTiktok') as string || '',
      snsFacebook: formData.get('snsFacebook') as string || ''
    }
  })
}

export default async function SettingsPage() {
  const settings = await db.siteSettings.findUnique({ where: { id: 1 } })

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">設定</h1>

      <form action={updateSettings} className="space-y-6 bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold">SNS リンク</h2>

        <div>
          <label className="block text-sm font-medium mb-1">X (Twitter)</label>
          <Input
            name="snsTwitter"
            type="url"
            defaultValue={settings?.snsTwitter}
            placeholder="https://twitter.com/yourhandle"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">LinkedIn</label>
          <Input
            name="snsLinkedin"
            type="url"
            defaultValue={settings?.snsLinkedin}
            placeholder="https://linkedin.com/company/yourcompany"
          />
        </div>

        {/* 他のSNSも同様 */}

        <Button type="submit">保存</Button>
      </form>
    </div>
  )
}
```

## 2. GA4 統合

`lib/analytics.ts` を作成:

```typescript
export function trackEvent(eventName: string, params?: Record<string, any>) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, params)
  }
}

declare global {
  interface Window {
    gtag?: (...args: any[]) => void
  }
}
```

`app/layout.tsx` に GA4 スクリプト追加:

```typescript
import Script from 'next/script'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <head>
        {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}');
              `}
            </Script>
          </>
        )}
      </head>
      <body>{children}</body>
    </html>
  )
}
```

## 3. Playwright E2E テスト

`playwright.config.ts` を作成:

```typescript
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry'
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    }
  ],
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI
  },
  env: {
    E2E_TEST_MODE: 'true',
    TURNSTILE_SITEKEY: '1x00000000000000000000AA'
  }
})
```

`tests/e2e/paywall.spec.ts` を作成:

```typescript
import { test, expect } from '@playwright/test'

test('ペイウォールが正しく表示される', async ({ page, request }) => {
  // 1. API で記事を作成
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
  await expect(page.locator('article')).toContainText('無料部分')

  // 4. 有料部分が隠れている
  const html = await page.content()
  expect(html).not.toContain('有料部分')

  // 5. 壁が表示される
  await expect(page.locator('text=ここから先は有料です')).toBeVisible()
  await expect(page.locator('text=¥500')).toBeVisible()
})
```

## 4. 受け入れ条件

* [ ] SNS リンクが管理画面から設定できる
* [ ] 空欄の SNS は非表示
* [ ] フッターに SNS アイコンが横並びで表示
* [ ] GA4 イベントが送信される（DevTools で確認）
* [ ] Playwright テストが成功（`pnpm test:e2e`）
* [ ] ペイウォールテストが成功

---

実装完了後、以下を出力してください:
1. 作成したファイル一覧
2. Playwright テスト実行結果
3. 全フェーズ完了確認
```

---

## ✅ 全フェーズ完了後の確認事項

すべてのフェーズが完了したら、以下を確認してください:

1. **ビルド成功**: `pnpm build` が成功する
2. **型チェック成功**: `pnpm type-check` でエラーなし
3. **E2E テスト成功**: `pnpm test:e2e` ですべて成功
4. **ローカル起動**: `pnpm dev` で http://localhost:3000 が開く
5. **管理画面アクセス**: `/admin` で管理画面が表示される
6. **記事作成**: 管理画面から記事を作成し、公開できる
7. **ペイウォール表示**: 記事詳細でペイウォールが表示される
8. **コメント投稿**: Turnstile 検証が動作する
9. **SNS リンク**: 設定したSNSアイコンが表示される
10. **GA4 イベント**: DevTools の Network タブで GA4 イベントを確認

---

## 📝 トラブルシューティング

### よくある問題と解決策

#### 1. Prisma マイグレーションエラー

```bash
# Prisma Client を再生成
npx prisma generate

# マイグレーションをリセット（開発時のみ、データ削除注意）
npx prisma migrate reset
```

#### 2. Vercel KV がローカルで動かない

`.env.local` に以下を追加:
```bash
# ローカルでは KV を無効化
KV_URL=
```

`lib/kv.ts` でフォールバック処理が動作します。

#### 3. Turnstile が動かない

```bash
# テストモードを有効化
E2E_TEST_MODE=true
NEXT_PUBLIC_TURNSTILE_SITEKEY=1x00000000000000000000AA
```

#### 4. Playwright テストが失敗する

```bash
# ブラウザをインストール
npx playwright install

# UIモードでデバッグ
pnpm test:e2e:ui
```

---

## 🎯 Phase 6: ナビゲーション刷新・カテゴリLP実装

**最終更新**: 2025-10-05 JST
**対応REQUIREMENTS**: v2.1 セクション15「ナビゲーション・情報アーキテクチャ」

### 実行コマンド

以下のプロンプトを Claude Code CLI にそのまま貼り付けてください。

```markdown
あなたは医療政策・医療DXニュースサイトのフロントエンド実装を担当する熟練エンジニアです。
REQUIREMENTS.md v2.1 に基づき、ナビゲーション構造の刷新とカテゴリLPを実装してください。

## 📋 実装概要

### 主要な変更点
1. グローバルナビを「記事 / 医療政策 / 実装（医療DX） / AI・データ活用 / 検索 / About」に更新
2. フラット構造 + 視覚的階層（主軸=濃色、テーマ軸=薄色）
3. `/topics/policy`, `/topics/dx`, `/topics/ai` の3つの固定LPを整備
4. カテゴリチップ表示（色分け・WCAG AA準拠）
5. SEO強化（構造化データ、パンくず）

## 🎨 カテゴリ体系

### 採用する設計
- **3カテゴリ制**: `'policy'` / `'dx'` / `'other'`
- **AIの扱い**: `category='dx'` + `tags=['AI']` で管理
- `/topics/ai` は表示上独立LPだが、裏側は `dx` カテゴリのフィルタビュー

## 📁 実装タスク

### Task 1: データ準備 - 固定トピック作成

**ファイル**: `scripts/seed-topics.ts`

```typescript
// scripts/seed-topics.ts
import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

const CORE_TOPICS = [
  {
    slug: 'policy',
    title: '医療政策',
    description: '診療報酬改定、中医協の議論、地域医療構想、医療保険制度の変遷など、医療政策の最新動向を追います。',
    priority: 100,
  },
  {
    slug: 'dx',
    title: '実装（医療DX）',
    description: '電子カルテ標準化、PHR、オンライン診療、オンライン資格確認など、医療DXの現場実装を解説します。',
    priority: 90,
  },
  {
    slug: 'ai',
    title: 'AI・データ活用',
    description: 'AI問診、画像診断支援、ビッグデータ解析、予測モデルなど、医療現場でのAI・データ活用事例を紹介します。',
    priority: 80,
  },
]

async function main() {
  console.log('🌱 Seeding core topics...')

  for (const topic of CORE_TOPICS) {
    await db.topic.upsert({
      where: { slug: topic.slug },
      update: topic,
      create: topic,
    })
    console.log(`✓ Topic: ${topic.slug}`)
  }

  console.log('✅ Core topics seeded successfully')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
```

**実行**:
```bash
npx tsx scripts/seed-topics.ts
```

### Task 2: カテゴリヘルパー関数

**ファイル**: `lib/categories.ts`

```typescript
// lib/categories.ts
export type Category = 'policy' | 'dx' | 'other'

export interface CategoryConfig {
  value: Category
  label: string
  slug: string
  colorClass: string
  description: string
}

export const CATEGORIES: Record<Category, CategoryConfig> = {
  policy: {
    value: 'policy',
    label: '医療政策',
    slug: 'policy',
    colorClass: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
    description: '診療報酬改定、中医協、地域医療構想など',
  },
  dx: {
    value: 'dx',
    label: '実装（医療DX）',
    slug: 'dx',
    colorClass: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
    description: '電子カルテ、PHR、オンライン診療など',
  },
  other: {
    value: 'other',
    label: 'その他',
    slug: 'other',
    colorClass: 'bg-gray-100 text-gray-700 ring-1 ring-gray-200',
    description: 'その他の記事',
  },
}

export const AI_TAG_COLOR_CLASS = 'bg-violet-50 text-violet-700 ring-1 ring-violet-200'

export function getCategoryConfig(category: Category): CategoryConfig {
  return CATEGORIES[category]
}
```

### Task 3: CategoryChip Component

**ファイル**: `components/post/CategoryChip.tsx`

```tsx
// components/post/CategoryChip.tsx
import { getCategoryConfig, Category, AI_TAG_COLOR_CLASS } from '@/lib/categories'

interface CategoryChipProps {
  category: Category
  className?: string
}

export function CategoryChip({ category, className = '' }: CategoryChipProps) {
  const config = getCategoryConfig(category)

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${config.colorClass} ${className}`}>
      {config.label}
    </span>
  )
}

interface TagChipsProps {
  tags: string[]
  className?: string
}

export function TagChips({ tags, className = '' }: TagChipsProps) {
  if (tags.length === 0) return null

  return (
    <div className={`flex flex-wrap gap-1.5 ${className}`}>
      {tags.includes('AI') && (
        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${AI_TAG_COLOR_CLASS}`}>
          AI
        </span>
      )}
      {tags.filter(tag => tag !== 'AI').slice(0, 3).map(tag => (
        <span key={tag} className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium bg-gray-100 text-gray-700 ring-1 ring-gray-200">
          {tag}
        </span>
      ))}
    </div>
  )
}
```

### Task 4: MainNav Component

**ファイル**: `components/nav/MainNav.tsx`

```tsx
// components/nav/MainNav.tsx
import Link from 'next/link'

export function MainNav() {
  return (
    <nav className="flex items-center gap-6" aria-label="グローバルナビゲーション">
      {/* 主軸 */}
      <Link href="/news" className="text-gray-900 hover:text-black font-medium text-[15px] transition-colors">
        記事
      </Link>

      {/* テーマ軸 */}
      <Link href="/topics/policy" className="text-gray-500 hover:text-gray-800 text-[14px] transition-colors">
        医療政策
      </Link>
      <Link href="/topics/dx" className="text-gray-500 hover:text-gray-800 text-[14px] transition-colors">
        実装（医療DX）
      </Link>
      <Link href="/topics/ai" className="text-gray-500 hover:text-gray-800 text-[14px] transition-colors">
        AI・データ活用
      </Link>

      {/* 主軸 */}
      <Link href="/search" className="text-gray-900 hover:text-black font-medium text-[15px] transition-colors">
        検索
      </Link>
      <Link href="/about" className="text-gray-900 hover:text-black font-medium text-[15px] transition-colors">
        About
      </Link>
    </nav>
  )
}
```

### Task 5: `/news` ページ

**ファイル**: `app/news/page.tsx`

```tsx
// app/news/page.tsx
import { db } from '@/lib/db'
import { Category } from '@/lib/categories'
import { PostCard } from '@/components/post/PostCard'
import { CollectionJsonLd } from '@/components/seo/CollectionJsonLd'

export const revalidate = 900 // 15分

interface NewsPageProps {
  searchParams: { category?: string }
}

export default async function NewsPage({ searchParams }: NewsPageProps) {
  const category = searchParams.category as Category | undefined

  const posts = await db.post.findMany({
    where: {
      status: 'published',
      ...(category && category !== 'other' && { category }),
    },
    orderBy: { publishAt: 'desc' },
    take: 20,
  })

  return (
    <div className="max-w-[1280px] mx-auto px-8 py-16">
      <h1 className="text-4xl font-bold mb-8">記事一覧</h1>

      {/* カテゴリタブ */}
      <div className="flex gap-2 mb-12">
        <CategoryTab href="/news" active={!category}>全部</CategoryTab>
        <CategoryTab href="/news?category=policy" active={category === 'policy'}>医療政策</CategoryTab>
        <CategoryTab href="/news?category=dx" active={category === 'dx'}>実装（医療DX）</CategoryTab>
        {/* AIはdxのサブセットなのでタブは不要、または /topics/ai へのリンクを表示 */}
      </div>

      {/* 記事グリッド */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {posts.map(post => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>

      <CollectionJsonLd
        name="記事一覧"
        description="医療政策・医療DXの最新記事"
        url={`${process.env.NEXT_PUBLIC_SITE_URL}/news`}
      />
    </div>
  )
}
```

### Task 6: `/topics` ページ

**ファイル**: `app/topics/page.tsx`

```tsx
// app/topics/page.tsx
import { db } from '@/lib/db'
import { TopicCard } from '@/components/TopicCard'
import { CollectionJsonLd } from '@/components/seo/CollectionJsonLd'

export const revalidate = 1800 // 30分

export default async function TopicsPage() {
  const topics = await db.topic.findMany({
    where: {
      slug: { in: ['policy', 'dx', 'ai'] },
    },
    orderBy: { priority: 'desc' },
  })

  return (
    <div className="max-w-[1280px] mx-auto px-8 py-16">
      <h1 className="text-4xl font-bold mb-4">特集</h1>
      <p className="text-lg text-gray-600 mb-12">
        医療政策・医療DXの主要テーマをまとめています
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {topics.map(topic => (
          <TopicCard key={topic.id} topic={topic} />
        ))}
      </div>

      <CollectionJsonLd
        name="特集"
        description="医療政策・医療DXの主要テーマ"
        url={`${process.env.NEXT_PUBLIC_SITE_URL}/topics`}
      />
    </div>
  )
}
```

### Task 7: `/topics/[slug]` ページ

**ファイル**: `app/topics/[slug]/page.tsx`

```tsx
// app/topics/[slug]/page.tsx
import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import { PostCard } from '@/components/post/PostCard'
import { Breadcrumbs } from '@/components/seo/Breadcrumbs'
import { CollectionJsonLd } from '@/components/seo/CollectionJsonLd'

export const revalidate = 900 // 15分

interface TopicPageProps {
  params: { slug: string }
}

export default async function TopicPage({ params }: TopicPageProps) {
  const topic = await db.topic.findUnique({
    where: { slug: params.slug },
  })

  if (!topic) notFound()

  // AI特集の場合は category='dx' + tags=['AI'] でフィルタ
  const posts = params.slug === 'ai'
    ? await db.post.findMany({
        where: {
          status: 'published',
          category: 'dx',
          tags: { has: 'AI' },
        },
        orderBy: { publishAt: 'desc' },
      })
    : await db.post.findMany({
        where: {
          status: 'published',
          category: params.slug === 'policy' ? 'policy' : 'dx',
        },
        orderBy: { publishAt: 'desc' },
      })

  return (
    <div className="max-w-[1280px] mx-auto px-8 py-16">
      <Breadcrumbs
        items={[
          { name: 'Home', url: '/' },
          { name: '特集', url: '/topics' },
          { name: topic.title, url: `/topics/${topic.slug}` },
        ]}
      />

      <h1 className="text-4xl font-bold mt-8 mb-4">{topic.title}</h1>
      <p className="text-lg text-gray-600 mb-12">{topic.description}</p>

      <h2 className="text-2xl font-bold mb-6">記事一覧</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {posts.map(post => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>

      <CollectionJsonLd
        name={topic.title}
        description={topic.description}
        url={`${process.env.NEXT_PUBLIC_SITE_URL}/topics/${topic.slug}`}
      />
    </div>
  )
}
```

### Task 8: Breadcrumbs Component

**ファイル**: `components/seo/Breadcrumbs.tsx`

```tsx
// components/seo/Breadcrumbs.tsx
interface BreadcrumbItem {
  name: string
  url: string
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[]
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <>
      <nav aria-label="パンくずリスト" className="text-sm text-gray-600">
        {items.map((item, i) => (
          <span key={i}>
            {i > 0 && <span className="mx-2">&gt;</span>}
            {i === items.length - 1 ? (
              <span>{item.name}</span>
            ) : (
              <a href={item.url} className="hover:text-gray-900">{item.name}</a>
            )}
          </span>
        ))}
      </nav>

      <BreadcrumbsJsonLd items={items} />
    </>
  )
}

function BreadcrumbsJsonLd({ items }: BreadcrumbsProps) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}
```

### Task 9: CollectionPage JSON-LD

**ファイル**: `components/seo/CollectionJsonLd.tsx`

```tsx
// components/seo/CollectionJsonLd.tsx
interface CollectionJsonLdProps {
  name: string
  description: string
  url: string
}

export function CollectionJsonLd({ name, description, url }: CollectionJsonLdProps) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name,
    description,
    url,
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}
```

## ✅ 受け入れ条件

実装完了の判定基準:

### 必須要件
- [ ] ナビが「記事 / 医療政策 / 実装（医療DX） / AI・データ活用 / 検索 / About」（PC/モバイル）
- [ ] 視覚的階層が正しく表示される（主軸=濃色、テーマ軸=薄色）
- [ ] `/topics` が特集ハブとして機能する
- [ ] `/topics/policy`, `/topics/dx`, `/topics/ai` が正しく表示される
- [ ] `/topics/ai` は `category='dx' AND tags=['AI']` の記事を表示する
- [ ] カテゴリチップが色分け表示される（コントラスト比 AA以上）
- [ ] `/news` でカテゴリタブによる絞り込みが機能する
- [ ] 記事詳細にパンくず（JSON-LD含む）が表示される
- [ ] `/search` が `noindex,follow` のまま維持される

### アクセシビリティ
- [ ] Lighthouse アクセシビリティ 90点以上
- [ ] カラーコントラスト WCAG AA準拠（4.5:1以上）
- [ ] キーボードナビゲーション可能

### パフォーマンス
- [ ] 全ページが revalidate 設定済み
- [ ] LCP < 2.5秒

## 🚀 実行手順

1. 固定トピックを作成
```bash
npx tsx scripts/seed-topics.ts
```

2. ビルド確認
```bash
npm run build
```

3. ローカルで動作確認
```bash
npm run dev
```

4. Lighthouse実行
```bash
npm run lighthouse
```

5. デプロイ
```bash
vercel --prod
```
```

---

**Phase 6 実装完了！**
