const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  const DATABASE_URL = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_3XQ4ghEceCoD@ep-shiny-shadow-agd4ewqa-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require";

  console.log('🔄 Connecting to Neon database...');
  const sql = neon(DATABASE_URL);

  const sqlFile = path.join(__dirname, 'enable-rls-fixed.sql');
  const sqlContent = fs.readFileSync(sqlFile, 'utf8');

  console.log('📄 Executing fixed RLS migration...\n');

  try {
    // Split and execute SQL statements one by one
    const statements = sqlContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`Found ${statements.length} statements to execute\n`);

    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      if (!stmt || stmt.startsWith('--')) continue;

      const preview = stmt.substring(0, 60).replace(/\n/g, ' ');
      console.log(`[${i + 1}/${statements.length}] ${preview}...`);

      try {
        await sql(stmt);
        console.log('   ✅');
      } catch (err) {
        if (err.message.includes('already exists') || err.message.includes('does not exist')) {
          console.log('   ⚠️  ' + err.message);
        } else {
          console.log('   ❌ ' + err.message);
        }
      }
    }

    // Verify RLS status
    console.log('\n📊 Final RLS status:');
    const rlsStatus = await sql`
      SELECT tablename, rowsecurity
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename
    `;

    rlsStatus.forEach(t => {
      const status = t.rowsecurity ? '✅' : '❌';
      console.log(`   ${status} ${t.tablename}`);
    });

    console.log('\n🎉 Migration complete!');

  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  }
}

runMigration();
