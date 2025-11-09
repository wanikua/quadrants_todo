#!/usr/bin/env node

/**
 * Simple Database Migration Runner
 * Executes SQL migration files against the Neon database
 */

import { neon } from '@neondatabase/serverless'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env.local') })

async function runMigrations() {
  const DATABASE_URL = process.env.DATABASE_URL

  if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL not found')
    process.exit(1)
  }

  console.log('🔗 Connecting to Neon database...')
  const sql = neon(DATABASE_URL)

  const migrations = [
    {
      name: 'add_description_to_projects.sql',
      sql: `ALTER TABLE projects ADD COLUMN IF NOT EXISTS description TEXT;`
    },
    {
      name: 'add_user_activity_table.sql',
      sql: `
        CREATE TABLE IF NOT EXISTS user_activity (
          id SERIAL PRIMARY KEY,
          project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
          user_id TEXT NOT NULL,
          last_seen TIMESTAMP NOT NULL DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_user_activity_project_user ON user_activity(project_id, user_id);
        CREATE INDEX IF NOT EXISTS idx_user_activity_last_seen ON user_activity(last_seen);
        CREATE UNIQUE INDEX IF NOT EXISTS idx_user_activity_unique ON user_activity(project_id, user_id);
      `
    }
  ]

  for (const migration of migrations) {
    console.log(`\n📝 Running: ${migration.name}`)

    try {
      // Split by semicolon and execute each statement
      const statements = migration.sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0)

      for (const statement of statements) {
        await sql`${sql.unsafe(statement)}`
      }

      console.log(`✅ Completed: ${migration.name}`)
    } catch (error) {
      console.error(`❌ Error in ${migration.name}:`, error.message)
      // Continue with next migration
    }
  }

  console.log('\n🎉 All migrations executed!')
}

runMigrations().catch(error => {
  console.error('❌ Failed:', error)
  process.exit(1)
})
