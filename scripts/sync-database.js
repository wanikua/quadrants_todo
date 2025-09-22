require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

async function syncDatabase() {
  const sql = neon(process.env.DATABASE_URL);
  
  console.log('🔄 同步数据库表结构...');
  
  try {
    // 检查现有表
    const existingTables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    
    console.log('📋 现有表:', existingTables.map(t => t.table_name));
    
    // 创建projects表 (如果不存在)
    await sql`
      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        owner_id TEXT NOT NULL,
        invite_code TEXT,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `;
    console.log('✅ projects表已创建/验证');
    
    // 创建project_members表 (如果不存在)
    await sql`
      CREATE TABLE IF NOT EXISTS project_members (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        user_id TEXT NOT NULL,
        role TEXT NOT NULL,
        joined_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `;
    console.log('✅ project_members表已创建/验证');
    
    // 创建tasks表
    await sql`
      CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        description TEXT NOT NULL,
        urgency INTEGER NOT NULL,
        importance INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `;
    console.log('✅ tasks表已创建/验证');
    
    // 创建players表
    await sql`
      CREATE TABLE IF NOT EXISTS players (
        id SERIAL PRIMARY KEY,
        project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        color TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `;
    console.log('✅ players表已创建/验证');
    
    // 创建task_assignments表
    await sql`
      CREATE TABLE IF NOT EXISTS task_assignments (
        id SERIAL PRIMARY KEY,
        task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
        player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
        assigned_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `;
    console.log('✅ task_assignments表已创建/验证');
    
    // 创建lines表
    await sql`
      CREATE TABLE IF NOT EXISTS lines (
        id SERIAL PRIMARY KEY,
        project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        from_task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
        to_task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
        style TEXT,
        size TEXT,
        color TEXT,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `;
    console.log('✅ lines表已创建/验证');
    
    // 创建comments表
    await sql`
      CREATE TABLE IF NOT EXISTS comments (
        id SERIAL PRIMARY KEY,
        task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        author_name TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `;
    console.log('✅ comments表已创建/验证');
    
    // 验证所有表都存在
    const finalTables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;
    
    console.log('🎉 数据库同步完成！');
    console.log('📋 最终表结构:', finalTables.map(t => t.table_name));
    
    // 测试插入一个示例项目（如果表为空）
    const projectCount = await sql`SELECT COUNT(*) as count FROM projects`;
    if (projectCount[0].count === '0') {
      console.log('🔧 创建示例数据...');
      
      const testProjectId = 'demo-' + Date.now();
      await sql`
        INSERT INTO projects (id, name, type, owner_id, invite_code)
        VALUES (${testProjectId}, 'Demo Project', 'personal', 'demo-user', 'DEMO123')
      `;
      
      await sql`
        INSERT INTO project_members (id, project_id, user_id, role)
        VALUES ('member-demo', ${testProjectId}, 'demo-user', 'owner')
      `;
      
      console.log('✅ 示例数据已创建');
    }
    
  } catch (error) {
    console.error('❌ 数据库同步失败:', error.message);
    console.error('详细错误:', error);
  }
}

syncDatabase();