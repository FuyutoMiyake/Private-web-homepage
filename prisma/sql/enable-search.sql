-- PostgreSQL Full-Text Search Setup
-- Execute this in Supabase Dashboard > SQL Editor

-- 1. Enable pg_trgm extension for partial matching
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. Add searchVector column (if not exists via Prisma migration)
-- This should already exist from Prisma schema
ALTER TABLE "Post"
ADD COLUMN IF NOT EXISTS "searchVector" tsvector
GENERATED ALWAYS AS (
  setweight(to_tsvector('simple', coalesce(title,'')), 'A') ||
  setweight(to_tsvector('simple', coalesce(summary,'')), 'B') ||
  setweight(to_tsvector('simple', coalesce(body,'')), 'C') ||
  setweight(to_tsvector('simple', coalesce(array_to_string(tags, ' '),'')), 'D')
) STORED;

-- 3. Create GIN index for full-text search
CREATE INDEX IF NOT EXISTS "Post_searchVector_idx"
ON "Post" USING GIN("searchVector");

-- 4. Create GIN index for partial matching (trigram)
CREATE INDEX IF NOT EXISTS "Post_title_trgm_idx"
ON "Post" USING GIN(title gin_trgm_ops);

-- 5. Verify indexes
SELECT
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'Post'
AND (indexname LIKE '%search%' OR indexname LIKE '%trgm%');

-- Expected output:
-- Post_searchVector_idx | CREATE INDEX "Post_searchVector_idx" ON "Post" USING gin("searchVector")
-- Post_title_trgm_idx   | CREATE INDEX "Post_title_trgm_idx" ON "Post" USING gin(title gin_trgm_ops)
