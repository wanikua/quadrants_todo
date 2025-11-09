import { neon } from '@neondatabase/serverless'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load .env.local
dotenv.config({ path: path.join(process.cwd(), '.env.local') })

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in environment variables')
  process.exit(1)
}

const sql = neon(process.env.DATABASE_URL)

async function migrate() {
  console.log('Running migration: Add user_id to players table and rebuild player data...')

  try {
    // Step 1: Add user_id column
    await sql`
      DO $$
      BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                         WHERE table_name='players' AND column_name='user_id') THEN
              ALTER TABLE players ADD COLUMN user_id text;
          END IF;
      END $$;
    `
    console.log('✅ Added user_id column to players table')

    // Step 2: Clear existing players (they're just dummy data)
    await sql`DELETE FROM players`
    console.log('✅ Cleared existing dummy players')

    // Step 3: Recreate players from project members
    await sql`
      INSERT INTO players (project_id, user_id, name, color)
      SELECT
        pm.project_id,
        pm.user_id,
        'User ' || SUBSTRING(pm.user_id, 1, 8) as name,
        CASE (ROW_NUMBER() OVER (PARTITION BY pm.project_id ORDER BY pm.joined_at) - 1) % 8
          WHEN 0 THEN '#ef4444'
          WHEN 1 THEN '#f97316'
          WHEN 2 THEN '#eab308'
          WHEN 3 THEN '#22c55e'
          WHEN 4 THEN '#06b6d4'
          WHEN 5 THEN '#3b82f6'
          WHEN 6 THEN '#8b5cf6'
          WHEN 7 THEN '#ec4899'
        END as color
      FROM project_members pm
      ON CONFLICT DO NOTHING
    `
    console.log('✅ Recreated players from project members')

    // Step 4: Make user_id NOT NULL
    await sql`
      ALTER TABLE players ALTER COLUMN user_id SET NOT NULL
    `
    console.log('✅ Set user_id as NOT NULL')

    console.log('✅ Migration completed successfully!')
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  }
}

migrate()
