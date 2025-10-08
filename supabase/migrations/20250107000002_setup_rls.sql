-- Supabase Row Level Security (RLS) Setup
-- このスクリプトをSupabase Dashboard > SQL Editorで実行してください

-- =====  Posts RLS =====

ALTER TABLE "Post" ENABLE ROW LEVEL SECURITY;

-- 公開記事のみ匿名読み取り可
DROP POLICY IF EXISTS "posts_public_read" ON "Post";
CREATE POLICY "posts_public_read"
ON "Post" FOR SELECT
TO public
USING (status = 'published');

-- service_roleは全操作可能（管理画面用）
DROP POLICY IF EXISTS "posts_service_all" ON "Post";
CREATE POLICY "posts_service_all"
ON "Post" FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ===== Comments RLS =====

ALTER TABLE "Comment" ENABLE ROW LEVEL SECURITY;

-- 承認済みコメントのみ公開読み取り可
DROP POLICY IF EXISTS "comments_public_read_approved" ON "Comment";
CREATE POLICY "comments_public_read_approved"
ON "Comment" FOR SELECT
TO public
USING (status = 'approved');

-- service_roleは全操作可能（コメント投稿・管理用）
DROP POLICY IF EXISTS "comments_service_all" ON "Comment";
CREATE POLICY "comments_service_all"
ON "Comment" FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ===== Entitlements RLS =====

ALTER TABLE "Entitlement" ENABLE ROW LEVEL SECURITY;

-- service_roleのみ全操作可能（Webhook/管理画面用）
DROP POLICY IF EXISTS "entitlements_service_all" ON "Entitlement";
CREATE POLICY "entitlements_service_all"
ON "Entitlement" FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 将来: 認証ユーザーは自分のEntitlementのみ読み取り可
-- DROP POLICY IF EXISTS "entitlements_owner_read" ON "Entitlement";
-- CREATE POLICY "entitlements_owner_read"
-- ON "Entitlement" FOR SELECT
-- TO authenticated
-- USING (auth.uid() = "userId");

-- ===== Payments RLS =====

ALTER TABLE "Payment" ENABLE ROW LEVEL SECURITY;

-- service_roleのみ全操作可能（Webhook/管理画面用）
DROP POLICY IF EXISTS "payments_service_all" ON "Payment";
CREATE POLICY "payments_service_all"
ON "Payment" FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ===== EmailEvent RLS =====

ALTER TABLE "EmailEvent" ENABLE ROW LEVEL SECURITY;

-- service_roleのみ全操作可能（メール送信ログ記録用）
DROP POLICY IF EXISTS "email_events_service_all" ON "EmailEvent";
CREATE POLICY "email_events_service_all"
ON "EmailEvent" FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ===== SiteSettings RLS =====

ALTER TABLE "SiteSettings" ENABLE ROW LEVEL SECURITY;

-- 全員読み取り可（フッターのSNSリンクなど）
DROP POLICY IF EXISTS "site_settings_public_read" ON "SiteSettings";
CREATE POLICY "site_settings_public_read"
ON "SiteSettings" FOR SELECT
TO public
USING (true);

-- service_roleのみ更新可（管理画面用）
DROP POLICY IF EXISTS "site_settings_service_update" ON "SiteSettings";
CREATE POLICY "site_settings_service_update"
ON "SiteSettings" FOR UPDATE
TO service_role
USING (true)
WITH CHECK (true);

-- ===== 完了 =====
-- RLS設定が完了しました
-- 管理画面およびAPIでは SUPABASE_SERVICE_ROLE_KEY を使用してください
