/**
 * Migration: Add archived field to tasks table
 *
 * This script adds the 'archived' column to the tasks table
 * to support archiving tasks instead of deleting them
 */

const { neon } = require('@neondatabase/serverless')

const sql = neon(process.env.DATABASE_URL)

async function migrate() {
  try {
    console.log('Starting migration: Add archived field to tasks table...')

    // Add archived column with default value false
    await sql`
      ALTER TABLE tasks
      ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT FALSE
    `

    console.log('✅ Successfully added archived column to tasks table')
    console.log('Migration completed successfully!')
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  }
}

migrate()
