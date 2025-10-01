const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');

async function setupPromoCodes() {
  const DATABASE_URL = "postgresql://neondb_owner:npg_3XQ4ghEceCoD@ep-shiny-shadow-agd4ewqa-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require";
  const sql = neon(DATABASE_URL);

  console.log('Setting up promo codes system...\n');

  const sqlFile = path.join(__dirname, 'create-promo-codes-table.sql');
  const sqlContent = fs.readFileSync(sqlFile, 'utf8');

  try {
    await sql(sqlContent);
    console.log('Promo codes system created successfully!\n');

    const codes = await sql`SELECT code, plan, duration_months, max_uses FROM promo_codes WHERE is_active = true`;

    console.log('Available Promo Codes:');
    codes.forEach(c => {
      const duration = c.duration_months ? c.duration_months + ' months' : 'Lifetime';
      const uses = c.max_uses ? c.max_uses + ' uses max' : 'Unlimited uses';
      console.log('   ' + c.code + ' - ' + c.plan + ' plan - ' + duration + ' - ' + uses);
    });

    console.log('\nReady to use!');
  } catch (error) {
    console.error('Error:', error.message);
  }
}

setupPromoCodes();
