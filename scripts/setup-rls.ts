import { PrismaClient } from '@prisma/client'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') })

const prisma = new PrismaClient()

async function setupRLS() {
  console.log('🔒 Setting up Row Level Security (RLS)...\n')
  console.log('⚠️  Note: RLS requires Supabase Auth to be fully functional.')
  console.log('   This setup prepares the database for future auth integration.\n')

  try {
    // Enable RLS on tables
    const tables = ['Post', 'Comment', 'Entitlement', 'SiteSettings']

    console.log('1. Enabling RLS on tables...')
    for (const table of tables) {
      try {
        await prisma.$executeRawUnsafe(`ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY;`)
        console.log(`   ✅ RLS enabled on "${table}"`)
      } catch (error: any) {
        if (error.message.includes('already') || error.message.includes('exists')) {
          console.log(`   ℹ️  RLS already enabled on "${table}"`)
        } else {
          console.error(`   ⚠️  Error on "${table}": ${error.message}`)
        }
      }
    }

    console.log('\n2. Creating RLS policies...')

    // Post policies
    try {
      await prisma.$executeRawUnsafe(`
        CREATE POLICY "Public can read published posts"
        ON "Post"
        FOR SELECT
        USING (status = 'published');
      `)
      console.log('   ✅ Post read policy created')
    } catch (error: any) {
      if (error.message.includes('already exists')) {
        console.log('   ℹ️  Post read policy already exists')
      }
    }

    try {
      await prisma.$executeRawUnsafe(`
        CREATE POLICY "Authenticated users can manage posts"
        ON "Post"
        FOR ALL
        USING (auth.role() = 'authenticated');
      `)
      console.log('   ✅ Post management policy created')
    } catch (error: any) {
      if (error.message.includes('already exists')) {
        console.log('   ℹ️  Post management policy already exists')
      } else if (error.message.includes('auth.role')) {
        console.log('   ⚠️  Supabase Auth functions not available (expected)')
      }
    }

    // Comment policies
    try {
      await prisma.$executeRawUnsafe(`
        CREATE POLICY "Public can read approved comments"
        ON "Comment"
        FOR SELECT
        USING (status = 'approved');
      `)
      console.log('   ✅ Comment read policy created')
    } catch (error: any) {
      if (error.message.includes('already exists')) {
        console.log('   ℹ️  Comment read policy already exists')
      }
    }

    try {
      await prisma.$executeRawUnsafe(`
        CREATE POLICY "Authenticated users can manage comments"
        ON "Comment"
        FOR ALL
        USING (auth.role() = 'authenticated');
      `)
      console.log('   ✅ Comment management policy created')
    } catch (error: any) {
      if (error.message.includes('already exists')) {
        console.log('   ℹ️  Comment management policy already exists')
      } else if (error.message.includes('auth.role')) {
        console.log('   ⚠️  Supabase Auth functions not available (expected)')
      }
    }

    // SiteSettings policies
    try {
      await prisma.$executeRawUnsafe(`
        CREATE POLICY "Public can read site settings"
        ON "SiteSettings"
        FOR SELECT
        USING (true);
      `)
      console.log('   ✅ SiteSettings read policy created')
    } catch (error: any) {
      if (error.message.includes('already exists')) {
        console.log('   ℹ️  SiteSettings read policy already exists')
      }
    }

    try {
      await prisma.$executeRawUnsafe(`
        CREATE POLICY "Authenticated users can manage site settings"
        ON "SiteSettings"
        FOR ALL
        USING (auth.role() = 'authenticated');
      `)
      console.log('   ✅ SiteSettings management policy created')
    } catch (error: any) {
      if (error.message.includes('already exists')) {
        console.log('   ℹ️  SiteSettings management policy already exists')
      } else if (error.message.includes('auth.role')) {
        console.log('   ⚠️  Supabase Auth functions not available (expected)')
      }
    }

    // Entitlement policies
    try {
      await prisma.$executeRawUnsafe(`
        CREATE POLICY "Users can read own entitlements"
        ON "Entitlement"
        FOR SELECT
        USING (auth.uid()::text = "userId");
      `)
      console.log('   ✅ Entitlement read policy created')
    } catch (error: any) {
      if (error.message.includes('already exists')) {
        console.log('   ℹ️  Entitlement read policy already exists')
      } else if (error.message.includes('auth.uid')) {
        console.log('   ⚠️  Supabase Auth functions not available (expected)')
      }
    }

    try {
      await prisma.$executeRawUnsafe(`
        CREATE POLICY "Authenticated users can manage entitlements"
        ON "Entitlement"
        FOR ALL
        USING (auth.role() = 'authenticated');
      `)
      console.log('   ✅ Entitlement management policy created')
    } catch (error: any) {
      if (error.message.includes('already exists')) {
        console.log('   ℹ️  Entitlement management policy already exists')
      } else if (error.message.includes('auth.role')) {
        console.log('   ⚠️  Supabase Auth functions not available (expected)')
      }
    }

    // Verify setup
    console.log('\n🔍 Verifying setup...\n')

    const rlsResult = await prisma.$queryRaw<
      Array<{ tablename: string; rowsecurity: boolean }>
    >`
      SELECT tablename, rowsecurity
      FROM pg_tables
      WHERE schemaname = 'public'
      AND tablename IN ('Post', 'Comment', 'Entitlement', 'SiteSettings');
    `

    for (const table of rlsResult) {
      if (table.rowsecurity) {
        console.log(`✅ RLS enabled on "${table.tablename}"`)
      } else {
        console.log(`❌ RLS NOT enabled on "${table.tablename}"`)
      }
    }

    const policiesResult = await prisma.$queryRaw<
      Array<{ tablename: string; policyname: string }>
    >`
      SELECT tablename, policyname
      FROM pg_policies
      WHERE schemaname = 'public'
      ORDER BY tablename;
    `

    if (policiesResult.length > 0) {
      console.log(`\n✅ Found ${policiesResult.length} RLS policies`)
    } else {
      console.log('\n❌ No RLS policies found')
    }

    console.log('\n✨ RLS setup complete!')
    console.log('\n💡 Tip: RLS policies will be fully enforced once Supabase Auth is integrated.')
  } catch (error: any) {
    console.error('❌ Error:', error.message)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

setupRLS()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
