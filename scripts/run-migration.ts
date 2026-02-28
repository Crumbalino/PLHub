import { createClient } from '@supabase/supabase-js'
import fetch from 'node-fetch'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceRoleKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(url, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function checkColumnExists() {
  try {
    // Try to query the column - if it fails, it doesn't exist
    const { data, error } = await supabase
      .from('posts')
      .select('score_significance')
      .limit(1)

    if (error && error.message.includes('column')) {
      return false
    }
    return true
  } catch {
    return false
  }
}

async function runMigrationViaSql() {
  try {
    console.log('Attempting to run migration via Supabase SQL...')

    // Use Supabase REST API with service role key to execute SQL
    const response = await fetch(`${url}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
      body: JSON.stringify({
        sql: `
          ALTER TABLE posts ADD COLUMN IF NOT EXISTS score_significance INTEGER DEFAULT 12;
          UPDATE posts SET score_significance = 12 WHERE score_significance IS NULL;
        `,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.log('REST API approach failed (this is expected):', error)
      return false
    }

    console.log('✓ Migration executed via REST API')
    return true
  } catch (error) {
    console.log('REST API method not available')
    return false
  }
}

async function runMigration() {
  try {
    console.log('Checking if score_significance column exists...\n')

    const exists = await checkColumnExists()

    if (exists) {
      console.log('✅ Column score_significance already exists!')
      process.exit(0)
    }

    console.log('❌ Column score_significance not found\n')
    console.log('Attempting migration...\n')

    // Try REST API first
    const success = await runMigrationViaSql()

    if (!success) {
      console.log('\n⚠️  Could not run SQL migration automatically.')
      console.log('\nTo add the missing column manually:')
      console.log('1. Go to Supabase dashboard: https://app.supabase.com')
      console.log('2. Select your project')
      console.log('3. Go to SQL Editor')
      console.log('4. Click "New Query"')
      console.log('5. Paste this SQL:')
      console.log('```sql')
      console.log('ALTER TABLE posts ADD COLUMN IF NOT EXISTS score_significance INTEGER DEFAULT 12;')
      console.log('UPDATE posts SET score_significance = 12 WHERE score_significance IS NULL;')
      console.log('```')
      console.log('6. Click "Run"')
      console.log('\nAfter running this, the API should work correctly.\n')
      process.exit(1)
    }

    // Verify column was added
    const finalCheck = await checkColumnExists()
    if (finalCheck) {
      console.log('✅ Migration complete! Column is ready.')
      process.exit(0)
    } else {
      console.log('⚠️  Migration may have succeeded, but could not verify.')
      process.exit(0)
    }
  } catch (error) {
    console.error('Migration error:', error)
    process.exit(1)
  }
}

runMigration()
