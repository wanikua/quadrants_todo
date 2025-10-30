const { neon } = require('@neondatabase/serverless');

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_3XQ4ghEceCoD@ep-shiny-shadow-agd4ewqa-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require';

async function runMigration() {
  const sql = neon(DATABASE_URL);

  try {
    console.log('Running migration...');

    // Check and add description column
    try {
      console.log('Adding description column...');
      await sql`
        ALTER TABLE projects ADD COLUMN IF NOT EXISTS description TEXT
      `;
      console.log('Description column added');
    } catch (err) {
      console.log('Description column may already exist:', err.message);
    }

    // Check and add archived column
    try {
      console.log('Adding archived column...');
      await sql`
        ALTER TABLE projects ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT FALSE
      `;
      console.log('Archived column added');
    } catch (err) {
      console.log('Archived column may already exist:', err.message);
    }

    // Check and add updated_at column
    try {
      console.log('Adding updated_at column...');
      await sql`
        ALTER TABLE projects ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW()
      `;
      console.log('Updated_at column added');
    } catch (err) {
      console.log('Updated_at column may already exist:', err.message);
    }

    // Update existing rows
    try {
      console.log('Updating existing rows...');
      await sql`UPDATE projects SET updated_at = created_at WHERE updated_at IS NULL`;
      console.log('Update complete');
    } catch (err) {
      console.log('Update may have failed (possibly column already populated):', err.message);
    }

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
}

runMigration();
