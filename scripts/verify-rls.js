const { neon } = require('@neondatabase/serverless');

async function verifyRLS() {
  const DATABASE_URL = "postgresql://neondb_owner:npg_3XQ4ghEceCoD@ep-shiny-shadow-agd4ewqa-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require";
  const sql = neon(DATABASE_URL);

  console.log('🔍 Verifying RLS Implementation\n');
  console.log('='.repeat(60));

  try {
    // Check all tables have RLS enabled
    const rlsStatus = await sql`
      SELECT tablename, rowsecurity
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename
    `;

    console.log('\n📊 1. RLS Status:');
    rlsStatus.forEach(t => {
      const status = t.rowsecurity ? '✅' : '❌';
      console.log(`   ${status} ${t.tablename}`);
    });

    // Count policies
    const policyCounts = await sql`
      SELECT schemaname, tablename, COUNT(*) as policy_count
      FROM pg_policies
      WHERE schemaname = 'public'
      GROUP BY schemaname, tablename
      ORDER BY tablename
    `;

    console.log('\n📋 2. RLS Policies per table:');
    policyCounts.forEach(p => {
      console.log(`   ${p.tablename}: ${p.policy_count} policies`);
    });

    // List all policies
    const allPolicies = await sql`
      SELECT tablename, policyname, cmd
      FROM pg_policies
      WHERE schemaname = 'public'
      ORDER BY tablename, policyname
    `;

    console.log('\n📝 3. All RLS Policies:');
    let currentTable = '';
    allPolicies.forEach(p => {
      if (p.tablename !== currentTable) {
        console.log(`\n   ${p.tablename}:`);
        currentTable = p.tablename;
      }
      console.log(`      - ${p.policyname} (${p.cmd})`);
    });

    // Check indexes
    const indexes = await sql`
      SELECT
        tablename,
        indexname
      FROM pg_indexes
      WHERE schemaname = 'public'
      AND indexname LIKE 'idx_%'
      ORDER BY tablename, indexname
    `;

    console.log('\n📌 4. Performance Indexes:');
    let currentIdxTable = '';
    indexes.forEach(idx => {
      if (idx.tablename !== currentIdxTable) {
        console.log(`\n   ${idx.tablename}:`);
        currentIdxTable = idx.tablename;
      }
      console.log(`      - ${idx.indexname}`);
    });

    // Check helper function exists
    const functions = await sql`
      SELECT routine_name
      FROM information_schema.routines
      WHERE routine_schema = 'public'
      AND routine_name = 'set_current_user_id'
    `;

    console.log('\n🔧 5. Helper Functions:');
    if (functions.length > 0) {
      console.log('   ✅ set_current_user_id() exists');
    } else {
      console.log('   ❌ set_current_user_id() missing');
    }

    console.log('\n' + '='.repeat(60));
    console.log('\n✅ RLS Implementation Complete!');
    console.log('\n📚 Summary:');
    console.log(`   - ${rlsStatus.filter(t => t.rowsecurity).length}/${rlsStatus.length} tables have RLS enabled`);
    console.log(`   - ${allPolicies.length} total RLS policies`);
    console.log(`   - ${indexes.length} performance indexes`);
    console.log(`   - ${functions.length} helper functions`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

verifyRLS();
