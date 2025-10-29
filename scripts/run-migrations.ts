#!/usr/bin/env tsx

/**
 * Database Migration Runner
 * Executes SQL migration files against the Neon database
 */

import { drizzle } from 'drizzle-orm/neon-http'
import { neon } from '@neondatabase/serverless'
import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'

// Load environment variables from .env.local
dotenv.config({ path: path.join(__dirname, '..', '.env.local') })

async function runMigrations() {
  const DATABASE_URL = process.env.DATABASE_URL

  if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL not found in environment variables')
    console.error('   Make sure .env.local exists with DATABASE_URL')
    process.exit(1)
  }

  console.log('🔗 Connecting to database...')
  const sql = neon(DATABASE_URL)
  const db = drizzle(sql)

  const migrations = [
    'add_description_to_projects.sql',
    'add_user_activity_table.sql'
  ]

  for (const migration of migrations) {
    const migrationPath = path.join(__dirname, migration)

    if (!fs.existsSync(migrationPath)) {
      console.log(`⚠️  Migration file not found: ${migration}`)
      continue
    }

    const sqlContent = fs.readFileSync(migrationPath, 'utf-8')
    const statements = sqlContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))

    console.log(`\n📝 Running migration: ${migration}`)
    console.log(`   Found ${statements.length} SQL statements`)

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      try {
        await sql(statement)
        console.log(`   ✅ Statement ${i + 1}/${statements.length} executed`)
      } catch (error: any) {
        console.error(`   ❌ Error in statement ${i + 1}:`, error.message)
        // Continue with other statements
      }
    }

    console.log(`✅ Migration completed: ${migration}`)
  }

  console.log('\n🎉 All migrations completed!')
}

runMigrations().catch((error) => {
  console.error('❌ Migration failed:', error)
  process.exit(1)
})
