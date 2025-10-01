const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  const DATABASE_URL = process.env.DATABASE_URL;

  if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  console.log('🔄 Connecting to Neon database...');
  const sql = neon(DATABASE_URL);

  // Read the SQL file
  const sqlFile = path.join(__dirname, 'enable-rls.sql');
  const sqlContent = fs.readFileSync(sqlFile, 'utf8');

  console.log('📄 Read SQL file successfully');

  // Split SQL into individual statements
  const statements = sqlContent
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  console.log(`📝 Found ${statements.length} SQL statements to execute`);

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];

    // Skip comments
    if (statement.startsWith('--')) continue;

    try {
      console.log(`\n[${i + 1}/${statements.length}] Executing...`);

      // Show first 80 chars of statement
      const preview = statement.substring(0, 80).replace(/\n/g, ' ');
      console.log(`   ${preview}${statement.length > 80 ? '...' : ''}`);

      await sql(statement);
      console.log('   ✅ Success');
      successCount++;
    } catch (error) {
      console.error('   ❌ Error:', error.message);
      errorCount++;

      // Continue execution even if there's an error (some statements might fail if already exists)
      if (error.message.includes('already exists')) {
        console.log('   ℹ️  Statement already exists, continuing...');
      }
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 Migration Summary:');
  console.log(`   ✅ Successful: ${successCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);
  console.log('='.repeat(60));

  if (errorCount === 0) {
    console.log('\n🎉 All RLS policies have been successfully applied!');
  } else {
    console.log('\n⚠️  Migration completed with some errors (this may be normal if objects already exist)');
  }
}

runMigration().catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});
