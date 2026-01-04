import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

async function migrate() {
  console.log('Adding updated_at column to projects table...')

  try {
    // Add updated_at column if it doesn't exist
    await sql`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                       WHERE table_name='projects' AND column_name='updated_at') THEN
          ALTER TABLE projects ADD COLUMN updated_at TIMESTAMP DEFAULT NOW();
        END IF;
      END $$;
    `
    console.log('✓ Added updated_at column')

    // Update existing rows to have updated_at = created_at
    await sql`UPDATE projects SET updated_at = created_at WHERE updated_at IS NULL;`
    console.log('✓ Updated existing rows')

    // Create or replace function to automatically update updated_at
    await sql`
      CREATE OR REPLACE FUNCTION update_projects_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `
    console.log('✓ Created update function')

    // Drop trigger if exists and recreate
    await sql`DROP TRIGGER IF EXISTS projects_updated_at_trigger ON projects;`

    // Create trigger to auto-update updated_at on UPDATE
    await sql`
      CREATE TRIGGER projects_updated_at_trigger
        BEFORE UPDATE ON projects
        FOR EACH ROW
        EXECUTE FUNCTION update_projects_updated_at();
    `
    console.log('✓ Created trigger')

    // Create index for faster sorting
    await sql`CREATE INDEX IF NOT EXISTS idx_projects_updated_at ON projects(updated_at DESC);`
    console.log('✓ Created index')

    console.log('\n✅ Migration completed successfully!')
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  }
}

migrate()
