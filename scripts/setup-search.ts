import { PrismaClient } from '@prisma/client'
import * as dotenv from 'dotenv'
import * as path from 'path'
import * as fs from 'fs'

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') })

const prisma = new PrismaClient()

async function setupSearch() {
  console.log('🔍 Setting up search functionality...\n')

  try {
    // Read SQL file
    const sqlPath = path.join(process.cwd(), 'prisma/sql/enable-search.sql')
    const sqlContent = fs.readFileSync(sqlPath, 'utf-8')

    // Split by semicolons and filter out comments and empty lines
    const statements = sqlContent
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith('--') && !s.startsWith('/*'))

    console.log(`📝 Executing ${statements.length} SQL statements...\n`)

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]

      // Skip comments and SELECT verification statements
      if (statement.toLowerCase().includes('expected output') ||
          statement.toLowerCase().startsWith('select') ||
          statement.includes('--')) {
        continue
      }

      try {
        console.log(`${i + 1}. Executing: ${statement.substring(0, 80)}...`)
        await prisma.$executeRawUnsafe(statement + ';')
        console.log('   ✅ Success\n')
      } catch (error: any) {
        // Ignore "already exists" errors
        if (error.message.includes('already exists') ||
            error.message.includes('duplicate')) {
          console.log('   ℹ️  Already exists (skipped)\n')
        } else {
          console.error(`   ❌ Error: ${error.message}\n`)
        }
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
      Array<{ indexname: string; indexdef: string }>
    >`
      SELECT indexname, indexdef
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
