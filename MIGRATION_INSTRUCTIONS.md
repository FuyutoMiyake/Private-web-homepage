# Database Migration Instructions

## Current Status

✅ **Completed:**
- Prisma schema updated with new models (Payment, IdempotencyKey, EmailEvent, updated Entitlement)
- SEO structured data implementation (NewsArticle + Breadcrumb schemas)
- data-nosnippet attributes added for paywall content
- Supabase RLS policies script created
- All code changes for Phase 1 complete

⚠️ **Blocked:**
- Prisma cannot connect directly to Supabase PostgreSQL pooler (connection timeout)
- Database migration SQL needs to be executed manually via Supabase Dashboard

## Manual Migration Steps

### Step 1: Execute Schema Migration

1. Open Supabase SQL Editor (already opened):
   https://supabase.com/dashboard/project/tqjthzkuluhouumelssp/sql/new

2. Copy and paste the SQL from `add-new-models.sql` (displayed above)

3. Click "Run" to execute

This will:
- Add `Payment` table for transaction tracking
- Add `IdempotencyKey` table for duplicate prevention
- Add `EmailEvent` table for email logging
- Update `Entitlement` table with Stripe-related fields

### Step 2: Apply Row Level Security Policies

1. Open a new SQL Editor tab

2. Copy and paste the SQL from `scripts/setup-rls.sql` (displayed above)

3. Click "Run" to execute

This will:
- Enable RLS on all tables
- Set policies for public read access (published posts, approved comments)
- Set service_role permissions for admin operations

### Step 3: Generate Prisma Client

After executing both SQL scripts in Supabase, run:

```bash
npx prisma generate
```

This will update the Prisma client to include the new models.

### Step 4: Verify with Chrome DevTools

Once the database migration is complete:

1. Restart the dev server (if needed)
2. Navigate to an article page
3. Inspect the page source to verify:
   - `<script type="application/ld+json">` tags for NewsArticle schema
   - `<script type="application/ld+json">` tags for Breadcrumb schema
   - `data-nosnippet` attributes on paywall elements
   - `.article-preview` class on preview content

## Why Manual Migration?

Prisma's `migrate dev` command requires a direct PostgreSQL connection, but Supabase's connection pooler appears to be blocking direct connections. The Supabase REST API works perfectly (verified via test-db-connection.js), so we're using the web-based SQL Editor instead.

## Files Created

- `add-new-models.sql` - Schema migration SQL
- `scripts/setup-rls.sql` - Row Level Security policies
- `lib/seo/structuredData.ts` - SEO structured data generators
- `test-db-connection.js` - Connection test script (successful)
- `execute-migration.js` - Migration helper script

## Next Steps After Migration

1. ✅ Run `npx prisma generate`
2. ✅ Test article pages with Chrome DevTools
3. Continue to Phase 2:
   - Resend integration (DRY RUN mode)
   - OGP image generation
