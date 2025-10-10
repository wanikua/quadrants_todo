import { neon } from '@neondatabase/serverless'
import * as dotenv from 'dotenv'
import * as path from 'path'
import * as fs from 'fs'

// Load .env.local
dotenv.config({ path: path.join(process.cwd(), '.env.local') })

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in environment variables')
  process.exit(1)
}

const sql = neon(process.env.DATABASE_URL)

async function runFix() {
  console.log('Running players schema fix...')

  try {
    // Add user_id column if it doesn't exist
    await sql`ALTER TABLE players ADD COLUMN IF NOT EXISTS user_id text`
    console.log('✅ Added user_id column')

    // For existing players without user_id, set a placeholder
    await sql`UPDATE players SET user_id = 'legacy_' || id::text WHERE user_id IS NULL`
    console.log('✅ Updated existing players')

    // Make user_id NOT NULL
    await sql`ALTER TABLE players ALTER COLUMN user_id SET NOT NULL`
    console.log('✅ Set user_id as NOT NULL')

    console.log('✅ Schema fix completed successfully!')
  } catch (error) {
    console.error('❌ Schema fix failed:', error)
    process.exit(1)
  }
}

runFix()
