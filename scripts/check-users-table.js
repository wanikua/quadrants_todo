const { neon } = require('@neondatabase/serverless');

async function checkUsersTable() {
  const DATABASE_URL = "postgresql://neondb_owner:npg_3XQ4ghEceCoD@ep-shiny-shadow-agd4ewqa-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require";
  const sql = neon(DATABASE_URL);

  const columns = await sql`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'users'
    ORDER BY ordinal_position
  `;

  console.log('📋 Users table structure:\n');
  columns.forEach(col => {
    const nullable = col.is_nullable === 'YES' ? '(nullable)' : '(required)';
    console.log(`   ${col.column_name.padEnd(25)} ${col.data_type.padEnd(20)} ${nullable}`);
  });
}

checkUsersTable();
