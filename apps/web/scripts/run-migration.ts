import postgres from 'postgres'
import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

async function runMigration() {
  try {
    console.log('Reading migration file...')
    const migrationPath = path.join(process.cwd(), 'scripts', 'add_subscription_fields.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8')

    console.log('Connecting to database...')
    const databaseUrl = process.env.DATABASE_URL
    if (!databaseUrl) {
      throw new Error('DATABASE_URL not found in environment')
    }

    const sql = postgres(databaseUrl)

    console.log('Running migration...')

    // Split by semicolons and run each statement
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))

    for (const statement of statements) {
      console.log(`Executing: ${statement.substring(0, 50)}...`)
      await sql.unsafe(statement)
    }

    console.log('✓ Migration completed successfully!')

    // Close the database connection
    await sql.end()
    process.exit(0)
  } catch (error) {
    console.error('✗ Migration failed:', error)
    process.exit(1)
  }
}

runMigration()
