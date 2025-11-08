const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.DATABASE_URL);

(async () => {
  try {
    console.log('Fixing subscription_status...');

    // Fix subscription_status
    const updateResult = await sql`
      UPDATE users
      SET subscription_status = 'active'
      WHERE subscription_plan = 'pro'
      AND subscription_status = 'pro'
    `;

    console.log('Updated rows:', updateResult.length);

    // Verify
    const users = await sql`
      SELECT id, email, name, subscription_plan, subscription_status, stripe_customer_id
      FROM users
      WHERE subscription_plan = 'pro'
    `;

    console.log('\nPro users after fix:');
    console.log(JSON.stringify(users, null, 2));

    console.log('\n✅ Done!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
})();
