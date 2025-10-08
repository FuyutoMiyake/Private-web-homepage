# Supabaseセットアップガイド

このガイドでは、プロジェクトをSupabaseに接続する手順を説明します。

## セットアップ方法の選択

以下の2つの方法があります：
- **方法A**: Supabase MCP（Model Context Protocol）を使用した自動セットアップ（推奨）
- **方法B**: 手動セットアップ

---

## 方法A: Supabase MCPを使用（推奨）

### 1. MCP設定ファイルの確認

`~/Library/Application Support/Claude/claude_desktop_config.json` を開いて、以下の設定があることを確認：

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": [
        "-y",
        "@supabase/mcp-server-supabase"
      ],
      "env": {
        "SUPABASE_ACCESS_TOKEN": "your-access-token-here",
        "SUPABASE_PROJECT_ID": "your-project-id-here"
      }
    }
  }
}
```

### 2. Supabaseアクセストークンの取得

1. [Supabase Dashboard](https://app.supabase.com/)にログイン
2. 右上のプロフィールアイコン → **Account Settings**
3. **Access Tokens** タブへ移動
4. **Generate new token** をクリック
5. トークン名を入力（例: "Claude MCP"）
6. **Generate token** をクリックしてトークンをコピー

### 3. プロジェクトIDの取得

1. Supabaseダッシュボードでプロジェクトを選択
2. **Settings** → **General**
3. **Reference ID** をコピー（例: `abcdefghijklmnop`）

### 4. MCP設定ファイルを更新

取得したトークンとプロジェクトIDを`claude_desktop_config.json`に設定：

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": [
        "-y",
        "@supabase/mcp-server-supabase"
      ],
      "env": {
        "SUPABASE_ACCESS_TOKEN": "sbp_actual_token_here",
        "SUPABASE_PROJECT_ID": "abcdefghijklmnop"
      }
    }
  }
}
```

### 5. Claude Codeを再起動

Claude Codeを再起動すると、Supabase MCPが有効になります。

### 6. MCPを使用してプロジェクトをセットアップ

Claude Codeで「Supabase MCPを使ってデータベースをセットアップして」と依頼すると、自動的に：
- データベース接続情報の取得
- 環境変数の設定
- データベースマイグレーションの実行

が行われます。

---

## 方法B: 手動セットアップ

### 1. Supabaseプロジェクトの作成

1. [Supabase](https://supabase.com/)にアクセスしてアカウントを作成
2. 新しいプロジェクトを作成
3. データベースのパスワードを設定（安全な場所に保存してください）

## 2. 環境変数の設定

### Supabaseダッシュボードから必要な情報を取得

1. Supabaseプロジェクトのダッシュボードを開く
2. **Settings** → **API** に移動
3. 以下の情報をコピー：
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` キー → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

4. **Settings** → **Database** に移動
5. **Connection string** セクションで:
   - **Transaction pooler** (推奨) → `DATABASE_URL`
   - **Session pooler** または **Direct connection** → `DIRECT_URL`
   - `[YOUR-PASSWORD]`を実際のデータベースパスワードに置き換え

### .env.localファイルの作成

`.env.example`をコピーして`.env.local`を作成：

```bash
cp .env.example .env.local
```

`.env.local`ファイルを編集して、取得した情報を設定：

```env
# Database - Supabase PostgreSQL
DATABASE_URL="postgresql://postgres.xxx:password@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres"
DIRECT_URL="postgresql://postgres.xxx:password@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres"

# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://xxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"

# Vercel KV (Redis) - オプション
KV_URL="redis://localhost:6379"
KV_REST_API_URL=""
KV_REST_API_TOKEN=""
KV_REST_API_READ_ONLY_TOKEN=""

# Site URL
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
```

## 3. データベースのマイグレーション

PrismaスキーマをSupabaseデータベースにプッシュ：

```bash
npx prisma db push
```

または、マイグレーションファイルを作成：

```bash
npx prisma migrate dev --name init
```

## 4. Prisma Clientの生成

```bash
npx prisma generate
```

## 5. データベースのシード（オプション）

初期データを投入する場合：

```bash
npm run prisma:seed
```

## 6. 動作確認

開発サーバーを起動：

```bash
npm run dev
```

ブラウザで http://localhost:3000 を開いて、アプリケーションが正常に動作することを確認します。

## トラブルシューティング

### 接続エラーが発生する場合

1. `.env.local`の環境変数が正しく設定されているか確認
2. Supabaseプロジェクトが起動しているか確認
3. データベースパスワードが正しいか確認
4. ファイアウォールやVPNの設定を確認

### Prismaエラーが発生する場合

```bash
# Prisma Clientを再生成
npx prisma generate

# データベース接続を確認
npx prisma db pull
```

## Supabaseクライアントの使用

プロジェクトには`lib/supabase.ts`にSupabaseクライアントが設定されています：

```typescript
import { supabase } from '@/lib/supabase'

// 使用例
const { data, error } = await supabase
  .from('posts')
  .select('*')
```

## セキュリティに関する注意事項

- `.env.local`ファイルは絶対にGitにコミットしないでください
- データベースパスワードは安全に管理してください
- 本番環境では、環境変数を適切に設定してください（Vercel、Netlifyなど）
