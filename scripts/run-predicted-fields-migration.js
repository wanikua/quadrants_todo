const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error('❌ DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  console.log('🔄 Running migration: add-predicted-fields.sql');

  const sql = neon(databaseUrl);

  try {
    // Execute the SQL commands directly
    await sql`
      ALTER TABLE tasks
      ADD COLUMN IF NOT EXISTS predicted_urgency INTEGER,
      ADD COLUMN IF NOT EXISTS predicted_importance INTEGER
    `;

    console.log('✅ Migration completed successfully!');
    console.log('📊 Added columns:');
    console.log('   - tasks.predicted_urgency');
    console.log('   - tasks.predicted_importance');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
