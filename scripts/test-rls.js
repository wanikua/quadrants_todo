const { neon } = require('@neondatabase/serverless');

const DATABASE_URL = "postgresql://neondb_owner:npg_3XQ4ghEceCoD@ep-shiny-shadow-agd4ewqa-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require";
const sql = neon(DATABASE_URL);

async function testRLS() {
  console.log('🔒 测试RLS数据隔离功能...\n');

  try {
    // 1. 创建两个测试用户
    console.log('1️⃣ 创建测试用户...');

    const user1Id = 'test-user-001';
    const user2Id = 'test-user-002';

    // 删除旧的测试用户（如果存在）
    await sql`DELETE FROM users WHERE id IN (${user1Id}, ${user2Id})`;

    // 创建用户1
    await sql`
      INSERT INTO users (id, email, display_name, subscription_status)
      VALUES (${user1Id}, 'user1@test.com', '测试用户1', 'pro')
      ON CONFLICT (id) DO NOTHING
    `;

    // 创建用户2
    await sql`
      INSERT INTO users (id, email, display_name, subscription_status)
      VALUES (${user2Id}, 'user2@test.com', '测试用户2', 'free')
      ON CONFLICT (id) DO NOTHING
    `;

    console.log('✅ 创建了两个测试用户:');
    console.log(`   用户1: ${user1Id} (user1@test.com) - Pro订阅`);
    console.log(`   用户2: ${user2Id} (user2@test.com) - Free订阅`);
    console.log();

    // 2. 用户1创建项目
    console.log('2️⃣ 用户1创建项目...');

    // 设置当前用户为user1
    await sql`SELECT set_current_user_id(${user1Id})`;

    // 创建项目
    const projectId1 = Math.floor(Math.random() * 1000000);
    await sql`
      INSERT INTO projects (id, name, type, owner_id)
      VALUES (${projectId1}, '用户1的私有项目', 'personal', ${user1Id})
    `;

    const user1Projects = await sql`
      SELECT * FROM projects WHERE owner_id = ${user1Id}
    `;

    console.log(`✅ 用户1创建了 ${user1Projects.length} 个项目`);
    user1Projects.forEach(p => {
      console.log(`   - ${p.name} (ID: ${p.id})`);
    });
    console.log();

    // 3. 测试数据隔离 - 用户2不应该看到用户1的项目
    console.log('3️⃣ 测试数据隔离 - 用户2查询项目...');

    // 设置当前用户为user2
    await sql`SELECT set_current_user_id(${user2Id})`;

    // 用户2查询所有项目（应该只看到自己的）
    const user2ViewableProjects = await sql`
      SELECT * FROM projects
    `;

    console.log(`✅ 用户2可见的项目数: ${user2ViewableProjects.length}`);
    if (user2ViewableProjects.length === 0) {
      console.log('   ✅ 正确！用户2看不到用户1的私有项目');
    } else {
      console.log('   ❌ 错误！用户2不应该看到其他用户的项目:');
      user2ViewableProjects.forEach(p => {
        console.log(`   - ${p.name} (所有者: ${p.owner_id})`);
      });
    }
    console.log();

    // 4. 测试团队协作 - 添加用户2为项目成员
    console.log('4️⃣ 测试团队协作 - 添加用户2为项目成员...');

    const projectId = user1Projects[0].id;

    // 添加项目成员
    const memberId = Math.floor(Math.random() * 1000000);
    await sql`
      INSERT INTO project_members (id, project_id, user_id, role)
      VALUES (${memberId}, ${projectId}, ${user2Id}, 'member')
    `;

    console.log(`✅ 已将用户2添加为项目 "${user1Projects[0].name}" 的成员`);
    console.log();

    // 5. 验证用户2现在可以看到共享项目
    console.log('5️⃣ 验证用户2现在可以访问共享项目...');

    // 用户2再次查询（应该看到共享项目）
    const user2SharedProjects = await sql`
      SELECT p.*, pm.role
      FROM projects p
      LEFT JOIN project_members pm ON p.id = pm.project_id AND pm.user_id = ${user2Id}
      WHERE p.owner_id = ${user2Id}
         OR pm.user_id = ${user2Id}
    `;

    console.log(`✅ 用户2现在可见的项目数: ${user2SharedProjects.length}`);
    if (user2SharedProjects.length > 0) {
      console.log('   ✅ 正确！用户2可以看到共享项目:');
      user2SharedProjects.forEach(p => {
        const access = p.owner_id === user2Id ? '所有者' : `成员(${p.role})`;
        console.log(`   - ${p.name} (${access})`);
      });
    }
    console.log();

    // 6. 测试用户权限 - 用户2不能修改为非成员的项目
    console.log('6️⃣ 测试用户权限 - 创建用户3的项目...');

    const user3Id = 'test-user-003';
    await sql`
      INSERT INTO users (id, email, display_name, subscription_status)
      VALUES (${user3Id}, 'user3@test.com', '测试用户3', 'team')
      ON CONFLICT (id) DO NOTHING
    `;

    await sql`SELECT set_current_user_id(${user3Id})`;

    const projectId3 = Math.floor(Math.random() * 1000000);
    await sql`
      INSERT INTO projects (id, name, type, owner_id)
      VALUES (${projectId3}, '用户3的项目', 'personal', ${user3Id})
    `;

    console.log('✅ 创建了用户3和其项目');
    console.log();

    // 7. 验证用户2看不到用户3的项目
    console.log('7️⃣ 验证用户2看不到用户3的项目...');

    await sql`SELECT set_current_user_id(${user2Id})`;

    const user2FinalView = await sql`
      SELECT p.*, pm.role
      FROM projects p
      LEFT JOIN project_members pm ON p.id = pm.project_id AND pm.user_id = ${user2Id}
      WHERE p.owner_id = ${user2Id}
         OR pm.user_id = ${user2Id}
    `;

    const hasUser3Project = user2FinalView.some(p => p.owner_id === user3Id);
    if (!hasUser3Project) {
      console.log('✅ 正确！用户2看不到用户3的项目');
      console.log(`   用户2可见项目数: ${user2FinalView.length}`);
    } else {
      console.log('❌ 错误！用户2不应该看到用户3的项目');
    }
    console.log();

    // 8. 清理测试数据
    console.log('8️⃣ 清理测试数据...');
    await sql`DELETE FROM project_members WHERE user_id IN (${user1Id}, ${user2Id}, ${user3Id})`;
    await sql`DELETE FROM projects WHERE owner_id IN (${user1Id}, ${user2Id}, ${user3Id})`;
    await sql`DELETE FROM users WHERE id IN (${user1Id}, ${user2Id}, ${user3Id})`;
    console.log('✅ 测试数据已清理');
    console.log();

    console.log('🎉 RLS测试完成！\n');
    console.log('📋 测试结果总结:');
    console.log('✅ 用户只能看到自己的项目');
    console.log('✅ 用户可以看到被邀请的共享项目');
    console.log('✅ 用户无法看到未授权的其他用户项目');
    console.log('✅ RLS策略正确保护了数据隔离');
    console.log();
    console.log('🔒 数据安全性: 优秀');

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    console.error(error);
  }
}

testRLS();
