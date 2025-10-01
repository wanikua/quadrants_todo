const { neon } = require('@neondatabase/serverless');

async function createPromoSystem() {
  const DATABASE_URL = "postgresql://neondb_owner:npg_3XQ4ghEceCoD@ep-shiny-shadow-agd4ewqa-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require";
  const sql = neon(DATABASE_URL);

  console.log('🎟️  Creating promo codes system...\n');

  try {
    // Create promo_codes table
    await sql`
      CREATE TABLE IF NOT EXISTS promo_codes (
          id SERIAL PRIMARY KEY,
          code TEXT UNIQUE NOT NULL,
          plan TEXT NOT NULL CHECK (plan IN ('pro', 'team')),
          duration_months INTEGER,
          max_uses INTEGER,
          current_uses INTEGER DEFAULT 0,
          is_active BOOLEAN DEFAULT true,
          created_by TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          expires_at TIMESTAMP WITH TIME ZONE
      )
    `;
    console.log('✅ Created promo_codes table');

    // Create redemptions table
    await sql`
      CREATE TABLE IF NOT EXISTS promo_code_redemptions (
          id SERIAL PRIMARY KEY,
          promo_code_id INTEGER REFERENCES promo_codes(id) ON DELETE CASCADE,
          user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
          redeemed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          expires_at TIMESTAMP WITH TIME ZONE,
          UNIQUE(promo_code_id, user_id)
      )
    `;
    console.log('✅ Created promo_code_redemptions table');

    // Enable RLS
    await sql`ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY`;
    await sql`ALTER TABLE promo_code_redemptions ENABLE ROW LEVEL SECURITY`;
    console.log('✅ Enabled RLS');

    // Create policies (drop first if exists)
    try {
      await sql`DROP POLICY IF EXISTS promo_codes_select_active ON promo_codes`;
      await sql`DROP POLICY IF EXISTS redemptions_select_own ON promo_code_redemptions`;
      await sql`DROP POLICY IF EXISTS redemptions_insert ON promo_code_redemptions`;
    } catch (e) {}

    await sql`
      CREATE POLICY promo_codes_select_active ON promo_codes
      FOR SELECT USING (is_active = true)
    `;

    await sql`
      CREATE POLICY redemptions_select_own ON promo_code_redemptions
      FOR SELECT USING (user_id = current_setting('app.current_user_id', true)::TEXT)
    `;

    await sql`
      CREATE POLICY redemptions_insert ON promo_code_redemptions
      FOR INSERT WITH CHECK (user_id = current_setting('app.current_user_id', true)::TEXT)
    `;
    console.log('✅ Created RLS policies');

    // Create indexes
    await sql`CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON promo_codes(code)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_promo_codes_is_active ON promo_codes(is_active)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_redemptions_user_id ON promo_code_redemptions(user_id)`;
    console.log('✅ Created indexes');

    // Insert example promo codes
    const promoCodes = [
      { code: 'WELCOME2024', plan: 'pro', duration_months: 12, max_uses: null },
      { code: 'TEAM50', plan: 'team', duration_months: 6, max_uses: 50 },
      { code: 'LIFETIME', plan: 'team', duration_months: null, max_uses: 10 },
      { code: 'FREEPRO', plan: 'pro', duration_months: null, max_uses: null }
    ];

    for (const promo of promoCodes) {
      try {
        await sql`
          INSERT INTO promo_codes (code, plan, duration_months, max_uses, is_active)
          VALUES (${promo.code}, ${promo.plan}, ${promo.duration_months}, ${promo.max_uses}, true)
          ON CONFLICT (code) DO NOTHING
        `;
      } catch (e) {
        // Ignore duplicate errors
      }
    }
    console.log('✅ Inserted example promo codes\n');

    // List all codes
    const codes = await sql`
      SELECT code, plan, duration_months, max_uses, current_uses
      FROM promo_codes
      WHERE is_active = true
      ORDER BY code
    `;

    console.log('📋 Available Promo Codes:\n');
    codes.forEach(c => {
      const duration = c.duration_months ? `${c.duration_months} months` : 'Lifetime';
      const uses = c.max_uses ? `${c.current_uses}/${c.max_uses} uses` : 'Unlimited';
      console.log(`   🎫 ${c.code.padEnd(15)} ${c.plan.toUpperCase().padEnd(6)} ${duration.padEnd(12)} ${uses}`);
    });

    console.log('\n✨ Promo code system ready!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

createPromoSystem();
