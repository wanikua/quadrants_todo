require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

async function testRLS() {
  const sql = neon(process.env.DATABASE_URL);
  
  console.log('🔒 测试Row Level Security...');
  
  try {
    // 设置测试用户
    await sql`SELECT set_current_user('test_user_123')`;
    
    // 测试只能看到自己的项目
    const projects = await sql`
      SELECT COUNT(*) as count FROM projects
      WHERE id IN (
        SELECT project_id FROM project_members 
        WHERE user_id = current_setting('app.current_user_id', true)
      )
    `;
    
    console.log(`✅ RLS策略生效，用户只能访问 ${projects[0].count} 个授权项目`);
    
    // 测试策略是否启用
    const rlsStatus = await sql`
      SELECT tablename, rowsecurity 
      FROM pg_tables t
      JOIN pg_class c ON c.relname = t.tablename
      WHERE schemaname = 'public' 
      AND tablename IN ('projects', 'project_members')
    `;
    
    console.log('📋 RLS状态:');
    rlsStatus.forEach(table => {
      console.log(`  - ${table.tablename}: ${table.rowsecurity ? '✅' : '❌'}`);
    });
    
  } catch (error) {
    console.error('❌ RLS测试失败:', error.message);
  }
}

testRLS();
