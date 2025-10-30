const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.DATABASE_URL);

(async () => {
  try {
    console.log('🔍 Checking current data...\n');

    // Check all unique subscription_status values
    const statusValues = await sql`
      SELECT DISTINCT subscription_status, subscription_plan, COUNT(*) as count
      FROM users
      GROUP BY subscription_status, subscription_plan
      ORDER BY count DESC
    `;

    console.log('📊 Current subscription_status values:');
    statusValues.forEach(row => {
      console.log(`  ${row.subscription_status || 'NULL'} (plan: ${row.subscription_plan || 'NULL'}) - ${row.count} users`);
    });

    console.log('\n🔧 Starting fix...\n');

    // Step 1: Drop constraint (already done, but repeat for safety)
    console.log('1️⃣ Dropping old CHECK constraint...');
    await sql`
      ALTER TABLE users
      DROP CONSTRAINT IF EXISTS users_subscription_status_check
    `;
    console.log('✅ Done\n');

    // Step 2: Update all data to valid values
    console.log('2️⃣ Updating all subscription_status values...');

    // Convert 'pro' status to 'active'
    const proUpdate = await sql`
      UPDATE users
      SET subscription_status = 'active'
      WHERE subscription_status = 'pro'
    `;
    console.log(`  - Converted 'pro' to 'active': ${proUpdate.length} rows`);

    // Convert 'free' status to 'active'
    const freeUpdate = await sql`
      UPDATE users
      SET subscription_status = 'active'
      WHERE subscription_status = 'free'
    `;
    console.log(`  - Converted 'free' to 'active': ${freeUpdate.length} rows`);

    // Convert 'team' status to 'active'
    const teamUpdate = await sql`
      UPDATE users
      SET subscription_status = 'active'
      WHERE subscription_status = 'team'
    `;
    console.log(`  - Converted 'team' to 'active': ${teamUpdate.length} rows`);

    // Set NULL values to 'active'
    const nullUpdate = await sql`
      UPDATE users
      SET subscription_status = 'active'
      WHERE subscription_status IS NULL
    `;
    console.log(`  - Set NULL to 'active': ${nullUpdate.length} rows`);

    console.log('✅ All data updated\n');

    // Step 3: Verify no invalid values remain
    console.log('3️⃣ Verifying data...');
    const invalidValues = await sql`
      SELECT subscription_status, COUNT(*) as count
      FROM users
      WHERE subscription_status NOT IN ('active', 'canceled', 'past_due', 'trialing', 'incomplete', 'incomplete_expired', 'unpaid')
      GROUP BY subscription_status
    `;

    if (invalidValues.length > 0) {
      console.log('⚠️  Found invalid values:');
      invalidValues.forEach(row => {
        console.log(`  ${row.subscription_status}: ${row.count} users`);
      });
      throw new Error('Cannot proceed - invalid values still exist');
    }
    console.log('✅ All values are valid\n');

    // Step 4: Add new constraint
    console.log('4️⃣ Adding correct CHECK constraint...');
    await sql`
      ALTER TABLE users
      ADD CONSTRAINT users_subscription_status_check
      CHECK (subscription_status IN ('active', 'canceled', 'past_due', 'trialing', 'incomplete', 'incomplete_expired', 'unpaid'))
    `;
    console.log('✅ Constraint added\n');

    // Step 5: Verify final state
    console.log('5️⃣ Final verification...');
    const finalState = await sql`
      SELECT
        subscription_plan,
        subscription_status,
        COUNT(*) as count
      FROM users
      GROUP BY subscription_plan, subscription_status
      ORDER BY count DESC
    `;

    console.log('\n📊 Final state:');
    finalState.forEach(row => {
      console.log(`  Plan: ${row.subscription_plan || 'NULL'}, Status: ${row.subscription_status}, Count: ${row.count}`);
    });

    console.log('\n✅ Schema fix completed successfully!\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.detail) console.error('Detail:', error.detail);
    process.exit(1);
  }
})();
