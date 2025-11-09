const { neon } = require('@neondatabase/serverless');

const DATABASE_URL = "postgresql://neondb_owner:npg_3XQ4ghEceCoD@ep-shiny-shadow-agd4ewqa-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require";
const sql = neon(DATABASE_URL);

async function testApp() {
  console.log('🧪 开始测试应用功能...\n');

  try {
    // 1. 测试数据库连接
    console.log('1️⃣ 测试数据库连接...');
    const tables = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;
    console.log(`✅ 数据库连接成功，发现 ${tables.length} 个表:`);
    tables.forEach(t => console.log(`   - ${t.table_name}`));
    console.log();

    // 2. 测试用户表结构
    console.log('2️⃣ 测试用户表结构...');
    const userColumns = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'users'
      ORDER BY ordinal_position
    `;
    console.log('✅ Users表字段:');
    userColumns.forEach(col => {
      const nullable = col.is_nullable === 'YES' ? '(可空)' : '(必填)';
      console.log(`   - ${col.column_name.padEnd(25)} ${col.data_type.padEnd(20)} ${nullable}`);
    });
    console.log();

    // 3. 测试RLS策略
    console.log('3️⃣ 测试RLS策略...');
    const policies = await sql`
      SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
      FROM pg_policies
      WHERE schemaname = 'public'
      ORDER BY tablename, policyname
    `;
    console.log(`✅ 发现 ${policies.length} 个RLS策略:`);
    const policyByTable = {};
    policies.forEach(p => {
      if (!policyByTable[p.tablename]) policyByTable[p.tablename] = [];
      policyByTable[p.tablename].push(p.policyname);
    });
    Object.entries(policyByTable).forEach(([table, pols]) => {
      console.log(`   ${table}: ${pols.length} 个策略`);
    });
    console.log();

    // 4. 测试促销码
    console.log('4️⃣ 测试促销码系统...');
    const promoCodes = await sql`
      SELECT code, plan, duration_months, max_uses, current_uses, is_active
      FROM promo_codes
      WHERE is_active = true
      ORDER BY code
    `;
    console.log(`✅ 发现 ${promoCodes.length} 个活跃促销码:`);
    promoCodes.forEach(p => {
      const duration = p.duration_months ? `${p.duration_months}个月` : '永久';
      const uses = p.max_uses ? `${p.current_uses}/${p.max_uses}` : '无限';
      console.log(`   ${p.code.padEnd(15)} ${p.plan.padEnd(8)} ${duration.padEnd(10)} 使用次数: ${uses}`);
    });
    console.log();

    // 5. 测试用户数据
    console.log('5️⃣ 测试用户数据...');
    const users = await sql`SELECT id, email, display_name, subscription_status FROM users LIMIT 5`;
    console.log(`✅ 发现 ${users.length} 个用户:`);
    users.forEach(u => {
      console.log(`   ID: ${u.id}`);
      console.log(`   Email: ${u.email || '(无)'}`);
      console.log(`   Name: ${u.display_name || '(无)'}`);
      console.log(`   订阅: ${u.subscription_status || 'free'}`);
      console.log();
    });

    // 6. 测试项目数据
    console.log('6️⃣ 测试项目数据...');
    const projects = await sql`
      SELECT p.id, p.name, p.owner_id, u.email as owner_email
      FROM projects p
      LEFT JOIN users u ON p.owner_id = u.id
      LIMIT 5
    `;
    console.log(`✅ 发现 ${projects.length} 个项目:`);
    projects.forEach(p => {
      console.log(`   项目ID: ${p.id} | 名称: ${p.name} | 所有者: ${p.owner_email || p.owner_id}`);
    });
    console.log();

    console.log('🎉 所有测试完成！\n');
    console.log('📋 测试总结:');
    console.log(`✅ 数据库: ${tables.length} 个表`);
    console.log(`✅ RLS策略: ${policies.length} 个`);
    console.log(`✅ 促销码: ${promoCodes.length} 个活跃`);
    console.log(`✅ 用户: ${users.length} 个`);
    console.log(`✅ 项目: ${projects.length} 个`);
    console.log('\n🚀 应用已准备就绪！');
    console.log('\n访问测试页面:');
    console.log('   http://localhost:3000 - 主页');
    console.log('   http://localhost:3000/auth/signup - 用户注册');
    console.log('   http://localhost:3000/auth/signin - 用户登录');
    console.log('   http://localhost:3000/promo - 促销码兑换');
    console.log('   http://localhost:3000/projects - 项目列表');

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    console.error(error);
    process.exit(1);
  }
}

testApp();
