const { neon } = require('@neondatabase/serverless');

async function createUsersTable() {
  const DATABASE_URL = "postgresql://neondb_owner:npg_3XQ4ghEceCoD@ep-shiny-shadow-agd4ewqa-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require";
  const sql = neon(DATABASE_URL);

  console.log('📝 Creating users table and helper function...\n');

  try {
    // Create users table
    await sql`
      CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          email TEXT UNIQUE NOT NULL,
          display_name TEXT,
          subscription_status TEXT DEFAULT 'free' CHECK (subscription_status IN ('free', 'pro', 'team')),
          subscription_id TEXT,
          stripe_customer_id TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;
    console.log('✅ Users table created');

    // Enable RLS on users table
    await sql`ALTER TABLE users ENABLE ROW LEVEL SECURITY`;
    console.log('✅ RLS enabled on users table');

    // Create policies
    await sql`
      CREATE POLICY users_select_own ON users
      FOR SELECT
      USING (id = current_setting('app.current_user_id', true)::TEXT)
    `;
    console.log('✅ SELECT policy created');

    await sql`
      CREATE POLICY users_update_own ON users
      FOR UPDATE
      USING (id = current_setting('app.current_user_id', true)::TEXT)
    `;
    console.log('✅ UPDATE policy created');

    await sql`
      CREATE POLICY users_insert_own ON users
      FOR INSERT
      WITH CHECK (id = current_setting('app.current_user_id', true)::TEXT)
    `;
    console.log('✅ INSERT policy created');

    // Create helper function
    await sql`
      CREATE OR REPLACE FUNCTION set_current_user_id(user_id TEXT)
      RETURNS VOID AS $$
      BEGIN
          PERFORM set_config('app.current_user_id', user_id, true);
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER
    `;
    console.log('✅ Helper function created');

    console.log('\n🎉 All done! Users table and RLS policies are ready.');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

createUsersTable();
