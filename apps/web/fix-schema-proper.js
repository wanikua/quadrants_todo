const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.DATABASE_URL);

(async () => {
  try {
    console.log('🔧 Starting schema fix...\n');

    // Step 1: Drop the old CHECK constraint
    console.log('1️⃣ Dropping old CHECK constraint...');
    await sql`
      ALTER TABLE users
      DROP CONSTRAINT IF EXISTS users_subscription_status_check
    `;
    console.log('✅ Old constraint dropped\n');

    // Step 2: Update existing data - convert 'pro' to 'active'
    console.log('2️⃣ Updating subscription_status data...');
    const updateResult = await sql`
      UPDATE users
      SET subscription_status = 'active'
      WHERE subscription_plan = 'pro'
      AND subscription_status = 'pro'
    `;
    console.log(`✅ Updated ${updateResult.length} rows\n`);

    // Step 3: Update free users
    await sql`
      UPDATE users
      SET subscription_status = 'active'
      WHERE subscription_plan = 'free'
      AND subscription_status = 'free'
    `;
    console.log('✅ Updated free users to active\n');

    // Step 4: Add the correct CHECK constraint
    console.log('3️⃣ Adding correct CHECK constraint...');
    await sql`
      ALTER TABLE users
      ADD CONSTRAINT users_subscription_status_check
      CHECK (subscription_status IN ('active', 'canceled', 'past_due', 'trialing', 'incomplete', 'incomplete_expired', 'unpaid'))
    `;
    console.log('✅ New constraint added\n');

    // Step 5: Verify the changes
    console.log('4️⃣ Verifying changes...');
    const users = await sql`
      SELECT id, email, name, subscription_plan, subscription_status, stripe_customer_id
      FROM users
      WHERE subscription_plan = 'pro'
      LIMIT 5
    `;

    console.log('\n📊 Pro users after fix:');
    users.forEach(user => {
      console.log(`  - ${user.email}`);
      console.log(`    Plan: ${user.subscription_plan}`);
      console.log(`    Status: ${user.subscription_status}`);
      console.log('');
    });

    console.log('✅ Schema fix completed successfully!\n');

    // Show constraint info
    const constraints = await sql`
      SELECT conname, pg_get_constraintdef(oid) as definition
      FROM pg_constraint
      WHERE conname = 'users_subscription_status_check'
    `;

    console.log('📋 New constraint definition:');
    console.log(constraints[0].definition);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
})();
