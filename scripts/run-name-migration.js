#!/usr/bin/env node
/**
 * Execute the user name consolidation migration
 * This script runs the SQL migration to consolidate display_name, username into name
 */

const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  const DATABASE_URL = process.env.DATABASE_URL;

  if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  const sql = neon(DATABASE_URL);
  const sqlFilePath = path.join(__dirname, 'migrate-consolidate-user-names.sql');

  console.log('📂 Reading migration file:', sqlFilePath);
  const migrationSQL = fs.readFileSync(sqlFilePath, 'utf8');

  console.log('🚀 Starting migration...\n');

  try {
    // Step 1: Show current state
    console.log('📊 Current state:');
    const currentState = await sql`
      SELECT
        COUNT(*) as total_users,
        COUNT(display_name) as has_display_name,
        COUNT(name) as has_name,
        COUNT(username) as has_username
      FROM users
    `;
    console.table(currentState);

    // Step 2: Merge all name data into name field
    console.log('\n🔄 Merging name data...');
    await sql`
      UPDATE users
      SET name = COALESCE(name, display_name, username, 'Anonymous')
      WHERE name IS NULL OR name = ''
    `;
    console.log('✅ Step 2 complete: Merged name data into name field');

    // Step 3: Verify no data loss
    const nullCount = await sql`
      SELECT COUNT(*) as count FROM users WHERE name IS NULL
    `;
    if (parseInt(nullCount[0].count) > 0) {
      throw new Error(`Migration failed: ${nullCount[0].count} users have NULL name`);
    }
    console.log('✅ Step 3 complete: All users have name');

    // Step 4: Drop redundant columns
    console.log('\n🗑️  Dropping redundant columns...');
    await sql`ALTER TABLE users DROP COLUMN IF EXISTS display_name`;
    await sql`ALTER TABLE users DROP COLUMN IF EXISTS username`;
    console.log('✅ Step 4 complete: Dropped redundant columns (display_name, username)');

    // Step 5: Make name NOT NULL
    console.log('\n🔒 Setting name as NOT NULL...');
    await sql`ALTER TABLE users ALTER COLUMN name SET NOT NULL`;
    console.log('✅ Step 5 complete: Set name as NOT NULL');

    console.log('\n✅ Migration completed successfully!');

    // Verify the result
    console.log('\n📊 Final state:');
    const users = await sql`
      SELECT id, email, name, created_at
      FROM users
      ORDER BY created_at
    `;
    console.table(users);

    // Check that redundant columns are gone
    const columns = await sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'users'
      ORDER BY ordinal_position
    `;
    console.log('\n📋 Users table columns:');
    console.table(columns.map(c => c.column_name));

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  }
}

runMigration();
