import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function setupStorage() {
  console.log('🔍 Checking existing buckets...')

  // List existing buckets
  const { data: buckets, error: listError } = await supabase.storage.listBuckets()

  if (listError) {
    console.error('❌ Error listing buckets:', listError.message)
    process.exit(1)
  }

  console.log(`📦 Found ${buckets.length} bucket(s):`)
  buckets.forEach((bucket) => {
    console.log(`   - ${bucket.name} (${bucket.public ? 'Public' : 'Private'})`)
  })

  // Check if post-images bucket exists
  const postImagesBucket = buckets.find((b) => b.name === 'post-images')

  if (postImagesBucket) {
    console.log('\n✅ post-images bucket already exists')
    return
  }

  console.log('\n📦 Creating post-images bucket...')

  // Create post-images bucket
  const { data, error: createError } = await supabase.storage.createBucket('post-images', {
    public: true,
    fileSizeLimit: 10485760, // 10MB
  })

  if (createError) {
    console.error('❌ Error creating bucket:', createError.message)
    process.exit(1)
  }

  console.log('✅ post-images bucket created successfully!')
}

setupStorage()
  .then(() => {
    console.log('\n✨ Storage setup complete!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Error:', error)
    process.exit(1)
  })
