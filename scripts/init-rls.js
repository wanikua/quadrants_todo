// 直接通过数据库执行RLS初始化
require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

async function initRLS() {
  const sql = neon(process.env.DATABASE_URL);
  
  try {
    // Enable RLS on tables
    await sql`ALTER TABLE projects ENABLE ROW LEVEL SECURITY`;
    await sql`ALTER TABLE project_members ENABLE ROW LEVEL SECURITY`;
    
    console.log('✅ RLS enabled successfully');
    
    // Create policies
    await sql`
      DROP POLICY IF EXISTS projects_select_policy ON projects
    `;
    
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
    
    console.log('✅ Basic RLS policies created');
    
    // Create helper function
    await sql`
      CREATE OR REPLACE FUNCTION set_current_user(user_id TEXT)
      RETURNS void AS $$
      BEGIN
        PERFORM set_config('app.current_user_id', user_id, false);
      END;
      $$ LANGUAGE plpgsql
    `;
    
    console.log('✅ Helper functions created');
    console.log('🎉 RLS initialization completed successfully!');
    
  } catch (error) {
    console.error('❌ Error initializing RLS:', error.message);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  initRLS();
}

module.exports = { initRLS };