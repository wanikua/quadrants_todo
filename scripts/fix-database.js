require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

async function fixDatabase() {
  const sql = neon(process.env.DATABASE_URL);
  
  console.log('🔧 修复数据库表结构...');
  
  try {
    // 删除旧表并重新创建
    console.log('⚠️  删除现有表...');
    await sql`DROP TABLE IF EXISTS project_members CASCADE`;
    await sql`DROP TABLE IF EXISTS projects CASCADE`;
    
    // 重新创建projects表，使用TEXT类型的id
    await sql`
      CREATE TABLE projects (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        owner_id TEXT NOT NULL,
        invite_code TEXT,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `;
    console.log('✅ projects表已重新创建');
    
    // 重新创建project_members表
    await sql`
      CREATE TABLE project_members (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        user_id TEXT NOT NULL,
        role TEXT NOT NULL,
        joined_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `;
    console.log('✅ project_members表已重新创建');
    
    // 创建其他表
    await sql`
      CREATE TABLE tasks (
        id SERIAL PRIMARY KEY,
        project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        description TEXT NOT NULL,
        urgency INTEGER NOT NULL,
        importance INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `;
    console.log('✅ tasks表已创建');
    
    await sql`
      CREATE TABLE players (
        id SERIAL PRIMARY KEY,
        project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        color TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `;
    console.log('✅ players表已创建');
    
    await sql`
      CREATE TABLE task_assignments (
        id SERIAL PRIMARY KEY,
        task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
        player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
        assigned_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `;
    console.log('✅ task_assignments表已创建');
    
    await sql`
      CREATE TABLE lines (
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
    console.log('✅ lines表已创建');
    
    await sql`
      CREATE TABLE comments (
        id SERIAL PRIMARY KEY,
        task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        author_name TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `;
    console.log('✅ comments表已创建');
    
    // 重新设置RLS
    await sql`ALTER TABLE projects ENABLE ROW LEVEL SECURITY`;
    await sql`ALTER TABLE project_members ENABLE ROW LEVEL SECURITY`;
    
    // 重新创建RLS策略
    await sql`
      CREATE POLICY projects_select_policy ON projects
        FOR SELECT
        USING (
          id IN (
            SELECT project_id FROM project_members 
            WHERE user_id = current_setting('app.current_user_id', true)
          )
        )
    `;
    
    console.log('✅ RLS策略已重新创建');
    
    // 验证表结构
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;
    
    console.log('🎉 数据库修复完成！');
    console.log('📋 表结构:', tables.map(t => t.table_name));
    
  } catch (error) {
    console.error('❌ 数据库修复失败:', error.message);
  }
}

fixDatabase();
