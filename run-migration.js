const { Client } = require('pg')
const fs = require('fs')

async function runMigration() {
  // Connection string from .env
  const connectionString = 'postgresql://postgres.tqjthzkuluhouumelssp:Miyake0330!@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres'

  const client = new Client({
    connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  })

  try {
    console.log('Connecting to Supabase PostgreSQL...')
    await client.connect()
    console.log('✅ Connected successfully\n')

    // Execute schema migration
    console.log('📦 Step 1: Executing schema migration (add-new-models.sql)...')
    const schemaSql = fs.readFileSync('./add-new-models.sql', 'utf8')
    await client.query(schemaSql)
    console.log('✅ Schema migration completed\n')

    // Execute RLS policies
    console.log('🔒 Step 2: Applying Row Level Security policies...')
    const rlsSql = fs.readFileSync('./scripts/setup-rls.sql', 'utf8')
    await client.query(rlsSql)
    console.log('✅ RLS policies applied\n')

    console.log('🎉 All migrations completed successfully!')
    console.log('\nNext steps:')
    console.log('1. Run: npx prisma generate')
    console.log('2. Verify with Chrome DevTools')

  } catch (error) {
    console.error('❌ Migration failed:', error.message)
    if (error.stack) {
      console.error('\nStack trace:', error.stack)
    }
    process.exit(1)
  } finally {
    await client.end()
    console.log('\n✅ Database connection closed')
  }
}

runMigration()
