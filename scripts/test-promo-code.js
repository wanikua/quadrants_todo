const { neon } = require('@neondatabase/serverless');

const DATABASE_URL = "postgresql://neondb_owner:npg_3XQ4ghEceCoD@ep-shiny-shadow-agd4ewqa-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require";
const sql = neon(DATABASE_URL);

async function testPromoCode() {
  console.log('🎫 测试促销码兑换功能...\n');

  try {
    // 获取测试用户ID
    const users = await sql`SELECT id, email, subscription_status FROM users LIMIT 1`;
    if (users.length === 0) {
      console.log('❌ 没有找到测试用户');
      console.log('💡 请先访问 http://localhost:3000/auth/signup 创建一个用户');
      return;
    }

    const testUser = users[0];
    console.log('👤 测试用户信息:');
    console.log(`   ID: ${testUser.id}`);
    console.log(`   Email: ${testUser.email}`);
    console.log(`   当前订阅: ${testUser.subscription_status || 'free'}`);
    console.log();

    // 测试促销码: FREEPRO
    const promoCode = 'FREEPRO';
    console.log(`🎁 测试促销码: ${promoCode}`);

    // 1. 验证促销码
    console.log('\n1️⃣ 验证促销码...');
    const promoCodes = await sql`
      SELECT * FROM promo_codes
      WHERE code = ${promoCode} AND is_active = true
    `;

    if (promoCodes.length === 0) {
      console.log('❌ 促销码不存在或已失效');
      return;
    }

    const promo = promoCodes[0];
    console.log('✅ 促销码有效:');
    console.log(`   计划: ${promo.plan}`);
    console.log(`   时长: ${promo.duration_months ? promo.duration_months + '个月' : '永久'}`);
    console.log(`   使用次数: ${promo.current_uses}${promo.max_uses ? '/' + promo.max_uses : ' (无限)'}`);

    // 2. 检查是否已兑换
    console.log('\n2️⃣ 检查兑换记录...');
    const existingRedemptions = await sql`
      SELECT * FROM promo_code_redemptions
      WHERE promo_code_id = ${promo.id} AND user_id = ${testUser.id}
    `;

    if (existingRedemptions.length > 0) {
      console.log('⚠️  该用户已经兑换过此促销码');
      console.log(`   兑换时间: ${existingRedemptions[0].redeemed_at}`);
      console.log('\n💡 跳过兑换，显示现有记录');
    } else {
      // 3. 执行兑换
      console.log('✅ 未兑换过，可以兑换');
      console.log('\n3️⃣ 执行兑换...');

      const expiresAt = promo.duration_months
        ? new Date(Date.now() + promo.duration_months * 30 * 24 * 60 * 60 * 1000)
        : null;

      // 创建兑换记录
      await sql`
        INSERT INTO promo_code_redemptions (promo_code_id, user_id, expires_at)
        VALUES (${promo.id}, ${testUser.id}, ${expiresAt})
      `;

      // 更新用户订阅
      await sql`
        UPDATE users
        SET subscription_status = ${promo.plan}
        WHERE id = ${testUser.id}
      `;

      // 更新促销码使用次数
      if (promo.max_uses) {
        await sql`
          UPDATE promo_codes
          SET current_uses = current_uses + 1
          WHERE id = ${promo.id}
        `;
      }

      console.log('✅ 兑换成功！');
      console.log(`   新订阅状态: ${promo.plan}`);
      if (expiresAt) {
        console.log(`   过期时间: ${expiresAt.toLocaleDateString('zh-CN')}`);
      } else {
        console.log(`   过期时间: 永不过期`);
      }
    }

    // 4. 验证更新后的状态
    console.log('\n4️⃣ 验证更新后的用户状态...');
    const updatedUser = await sql`
      SELECT id, email, subscription_status FROM users WHERE id = ${testUser.id}
    `;
    console.log('✅ 用户当前状态:');
    console.log(`   订阅: ${updatedUser[0].subscription_status}`);

    // 5. 显示所有兑换记录
    console.log('\n5️⃣ 用户的所有兑换记录:');
    const allRedemptions = await sql`
      SELECT
        r.redeemed_at,
        r.expires_at,
        p.code,
        p.plan,
        p.duration_months
      FROM promo_code_redemptions r
      JOIN promo_codes p ON r.promo_code_id = p.id
      WHERE r.user_id = ${testUser.id}
      ORDER BY r.redeemed_at DESC
    `;

    if (allRedemptions.length === 0) {
      console.log('   (无兑换记录)');
    } else {
      allRedemptions.forEach((r, i) => {
        console.log(`   ${i + 1}. ${r.code} (${r.plan})`);
        console.log(`      兑换时间: ${new Date(r.redeemed_at).toLocaleString('zh-CN')}`);
        if (r.expires_at) {
          console.log(`      过期时间: ${new Date(r.expires_at).toLocaleString('zh-CN')}`);
        } else {
          console.log(`      过期时间: 永不过期`);
        }
      });
    }

    console.log('\n🎉 促销码测试完成！');
    console.log('\n💡 下一步测试:');
    console.log('   访问 http://localhost:3000/promo 在网页上测试促销码兑换');
    console.log('   使用其他促销码: WELCOME2024, TEAM50, LIFETIME');

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    console.error(error);
  }
}

testPromoCode();
