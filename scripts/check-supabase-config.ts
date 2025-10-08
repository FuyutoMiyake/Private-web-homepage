import { PrismaClient } from '@prisma/client'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') })

const prisma = new PrismaClient()

async function checkSupabaseConfig() {
  console.log('🔍 Checking Supabase configuration...\n')

  try {
    // 1. Check pg_trgm extension
    console.log('1️⃣  Checking pg_trgm extension...')
    const extensionResult = await prisma.$queryRaw<Array<{ extname: string }>>`
      SELECT extname FROM pg_extension WHERE extname = 'pg_trgm';
    `
    if (extensionResult.length > 0) {
      console.log('   ✅ pg_trgm extension is enabled')
    } else {
      console.log('   ❌ pg_trgm extension is NOT enabled')
      console.log('   → Run: CREATE EXTENSION IF NOT EXISTS pg_trgm;')
    }

    // 2. Check RLS (Row Level Security) on tables
    console.log('\n2️⃣  Checking RLS (Row Level Security)...')
    const rlsResult = await prisma.$queryRaw<
      Array<{ tablename: string; rowsecurity: boolean }>
    >`
      SELECT tablename, rowsecurity
      FROM pg_tables
      WHERE schemaname = 'public'
      AND tablename IN ('Post', 'Comment', 'Entitlement');
    `

    for (const table of rlsResult) {
      if (table.rowsecurity) {
        console.log(`   ✅ RLS enabled on "${table.tablename}" table`)
      } else {
        console.log(`   ❌ RLS NOT enabled on "${table.tablename}" table`)
      }
    }

    // 3. Check RLS policies
    console.log('\n3️⃣  Checking RLS policies...')
    const policiesResult = await prisma.$queryRaw<
      Array<{ tablename: string; policyname: string }>
    >`
      SELECT tablename, policyname
      FROM pg_policies
      WHERE schemaname = 'public'
      ORDER BY tablename;
    `

    if (policiesResult.length > 0) {
      console.log(`   ✅ Found ${policiesResult.length} RLS policies:`)
      for (const policy of policiesResult) {
        console.log(`      - ${policy.tablename}: ${policy.policyname}`)
      }
    } else {
      console.log('   ❌ No RLS policies found')
      console.log('   → See README.md for RLS setup instructions')
    }

    // 4. Check if database connection uses service_role
    console.log('\n4️⃣  Checking database connection...')
    const currentUser = await prisma.$queryRaw<Array<{ current_user: string }>>`
      SELECT current_user;
    `
    console.log(`   ℹ️  Connected as: ${currentUser[0].current_user}`)

    // 5. Check environment variables
    console.log('\n5️⃣  Checking environment variables...')
    const requiredEnvVars = [
      'DATABASE_URL',
      'DIRECT_URL',
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY',
    ]

    for (const envVar of requiredEnvVars) {
      if (process.env[envVar]) {
        console.log(`   ✅ ${envVar} is set`)
      } else {
        console.log(`   ❌ ${envVar} is NOT set`)
      }
    }

    console.log('\n✨ Configuration check complete!')
  } catch (error: any) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

checkSupabaseConfig()
