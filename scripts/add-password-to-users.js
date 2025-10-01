const { neon } = require('@neondatabase/serverless');

async function addPasswordColumn() {
  const DATABASE_URL = "postgresql://neondb_owner:npg_3XQ4ghEceCoD@ep-shiny-shadow-agd4ewqa-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require";
  const sql = neon(DATABASE_URL);

  console.log('Adding password_hash column to users table...\n');

  try {
    // Add password_hash column
    await sql`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS password_hash TEXT
    `;
    console.log('✅ Added password_hash column');

    // Add username column (optional, for login)
    await sql`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS username TEXT UNIQUE
    `;
    console.log('✅ Added username column');

    // Make email nullable for now (since some users might use username)
    await sql`
      ALTER TABLE users
      ALTER COLUMN email DROP NOT NULL
    `;
    console.log('✅ Made email nullable');

    console.log('\n✨ Users table updated successfully!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

addPasswordColumn();
