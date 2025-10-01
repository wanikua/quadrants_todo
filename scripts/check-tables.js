const { neon } = require('@neondatabase/serverless');

async function checkTables() {
  const DATABASE_URL = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_3XQ4ghEceCoD@ep-shiny-shadow-agd4ewqa-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require";

  const sql = neon(DATABASE_URL);

  console.log('📊 Checking existing tables...\n');

  try {
    const tables = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;

    console.log('✅ Existing tables:');
    tables.forEach(t => console.log(`   - ${t.table_name}`));

    console.log('\n🔍 Checking for RLS status...\n');

    const rlsStatus = await sql`
      SELECT
        tablename,
        rowsecurity AS rls_enabled
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename
    `;

    console.log('📋 RLS Status:');
    rlsStatus.forEach(t => {
      const status = t.rls_enabled ? '✅ Enabled' : '❌ Disabled';
      console.log(`   ${status} - ${t.tablename}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkTables();
