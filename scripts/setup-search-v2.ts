import { PrismaClient } from '@prisma/client'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') })

const prisma = new PrismaClient()

async function setupSearch() {
  console.log('🔍 Setting up search functionality...\n')

  try {
    // 1. Enable pg_trgm extension
    console.log('1. Enabling pg_trgm extension...')
    try {
      await prisma.$executeRaw`CREATE EXTENSION IF NOT EXISTS pg_trgm;`
      console.log('   ✅ pg_trgm extension enabled\n')
    } catch (error: any) {
      if (error.message.includes('already exists')) {
        console.log('   ℹ️  Already exists\n')
      } else {
        throw error
      }
    }

    // 2. Create searchVector column (generated column)
    console.log('2. Creating searchVector column...')
    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "Post"
        ADD COLUMN IF NOT EXISTS "searchVector" tsvector
        GENERATED ALWAYS AS (
          setweight(to_tsvector('simple', coalesce(title,'')), 'A') ||
          setweight(to_tsvector('simple', coalesce(summary,'')), 'B') ||
          setweight(to_tsvector('simple', coalesce(body,'')), 'C') ||
          setweight(to_tsvector('simple', coalesce(array_to_string(tags, ' '),'')), 'D')
        ) STORED;
      `)
      console.log('   ✅ searchVector column created\n')
    } catch (error: any) {
      if (error.message.includes('already exists') || error.message.includes('duplicate')) {
        console.log('   ℹ️  Already exists\n')
      } else {
        console.error(`   ⚠️  Error: ${error.message}\n`)
      }
    }

    // 3. Create GIN index for full-text search
    console.log('3. Creating GIN index for full-text search...')
    try {
      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "Post_searchVector_idx"
        ON "Post" USING GIN("searchVector");
      `)
      console.log('   ✅ searchVector index created\n')
    } catch (error: any) {
      if (error.message.includes('already exists')) {
        console.log('   ℹ️  Already exists\n')
      } else {
        throw error
      }
    }

    // 4. Create GIN index for partial matching (trigram)
    console.log('4. Creating GIN index for trigram matching...')
    try {
      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "Post_title_trgm_idx"
        ON "Post" USING GIN(title gin_trgm_ops);
      `)
      console.log('   ✅ Trigram index created\n')
    } catch (error: any) {
      if (error.message.includes('already exists')) {
        console.log('   ℹ️  Already exists\n')
      } else {
        throw error
      }
    }

    // Verify setup
    console.log('🔍 Verifying setup...\n')

    // Check pg_trgm extension
    const extensionResult = await prisma.$queryRaw<Array<{ extname: string }>>`
      SELECT extname FROM pg_extension WHERE extname = 'pg_trgm';
    `
    if (extensionResult.length > 0) {
      console.log('✅ pg_trgm extension is enabled')
    } else {
      console.log('❌ pg_trgm extension is NOT enabled')
    }

    // Check indexes
    const indexResult = await prisma.$queryRaw<
      Array<{ indexname: string }>
    >`
      SELECT indexname
      FROM pg_indexes
      WHERE tablename = 'Post'
      AND (indexname LIKE '%search%' OR indexname LIKE '%trgm%');
    `

    if (indexResult.length > 0) {
      console.log(`✅ Found ${indexResult.length} search-related indexes:`)
      for (const index of indexResult) {
        console.log(`   - ${index.indexname}`)
      }
    } else {
      console.log('❌ No search-related indexes found')
    }

    console.log('\n✨ Search setup complete!')
  } catch (error: any) {
    console.error('❌ Error:', error.message)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

setupSearch()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
