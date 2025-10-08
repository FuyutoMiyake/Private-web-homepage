const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')

const supabaseUrl = 'https://tqjthzkuluhouumelssp.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxanRoemt1bHVob3V1bWVsc3NwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTcyOTc2MCwiZXhwIjoyMDc1MzA1NzYwfQ.l4e-ClbadtQNeFXWbPHjR2Ix22RvigEJmQVyFkP_5rc'

const supabase = createClient(supabaseUrl, supabaseKey)

async function executeMigration() {
  try {
    console.log('Reading SQL file...')
    const sql = fs.readFileSync('./add-new-models.sql', 'utf8')

    console.log('Executing migration SQL...')

    // Note: Supabase client doesn't support raw SQL execution directly
    // We need to execute via the PostgREST API or use the Management API
    // For now, let's output instructions for manual execution

    console.log('\n⚠️  Direct SQL execution via Supabase JS client is limited.')
    console.log('Please execute the following SQL in Supabase Dashboard > SQL Editor:\n')
    console.log('Navigate to: https://supabase.com/dashboard/project/tqjthzkuluhouumelssp/sql/new')
    console.log('\n--- SQL TO EXECUTE ---')
    console.log(sql)
    console.log('--- END SQL ---\n')

    // Alternative: Try using postgres:// connection if available
    const { exec } = require('child_process')

    console.log('Attempting to execute via psql if available...')
    exec(`cat add-new-models.sql`, (error, stdout) => {
      if (!error) {
        console.log('\nAlternatively, save this SQL and run in Supabase SQL Editor.')
      }
    })

  } catch (err) {
    console.error('Migration failed:', err)
    process.exit(1)
  }
}

executeMigration()
