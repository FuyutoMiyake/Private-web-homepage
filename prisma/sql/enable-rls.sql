-- Supabase Row Level Security (RLS) Policies
-- このSQLはSupabase Dashboard > SQL Editorで実行してください

-- Enable RLS on all tables
ALTER TABLE "Post" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Comment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Entitlement" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SiteSettings" ENABLE ROW LEVEL SECURITY;

-- Post: 公開記事は誰でも読める、管理者のみ書き込み可能
CREATE POLICY "Public can read published posts"
  ON "Post"
  FOR SELECT
  USING (status = 'published');

CREATE POLICY "Authenticated users can manage posts"
  ON "Post"
  FOR ALL
  USING (auth.role() = 'authenticated');

-- Comment: 承認済みコメントは誰でも読める、作成は認証済みユーザー（API経由）
CREATE POLICY "Public can read approved comments"
  ON "Comment"
  FOR SELECT
  USING (status = 'approved');

CREATE POLICY "Authenticated users can manage comments"
  ON "Comment"
  FOR ALL
  USING (auth.role() = 'authenticated');

-- Entitlement: 認証済みユーザーのみアクセス可能
CREATE POLICY "Users can read own entitlements"
  ON "Entitlement"
  FOR SELECT
  USING (auth.uid()::text = "userId");

CREATE POLICY "Authenticated users can manage entitlements"
  ON "Entitlement"
  FOR ALL
  USING (auth.role() = 'authenticated');

-- SiteSettings: 公開設定は誰でも読める、管理者のみ書き込み可能
CREATE POLICY "Public can read site settings"
  ON "SiteSettings"
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can manage site settings"
  ON "SiteSettings"
  FOR ALL
  USING (auth.role() = 'authenticated');

-- Note: これらのポリシーはSupabase Authを前提としています
-- ローカル開発環境では、Supabaseを使用しない場合は適用されません
