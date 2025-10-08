const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://tqjthzkuluhouumelssp.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxanRoemt1bHVob3V1bWVsc3NwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTcyOTc2MCwiZXhwIjoyMDc1MzA1NzYwfQ.l4e-ClbadtQNeFXWbPHjR2Ix22RvigEJmQVyFkP_5rc'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testConnection() {
  try {
    const { data, error } = await supabase.from('Post').select('count').limit(1)

    if (error) {
      console.error('Supabase error:', error)
      process.exit(1)
    }

    console.log('✅ Supabase connection successful!')
    console.log('Data:', data)

    // Also test direct SQL query via Supabase
    const { data: versionData, error: versionError } = await supabase.rpc('show_limit')
    if (versionError) {
      console.error('RPC error:', versionError)
    } else {
      console.log('PostgreSQL version check:', versionData)
    }

    process.exit(0)
  } catch (err) {
    console.error('Connection test failed:', err)
    process.exit(1)
  }
}

testConnection()
