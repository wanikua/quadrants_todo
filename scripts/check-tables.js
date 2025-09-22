require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

async function checkTables() {
  const sql = neon(process.env.DATABASE_URL);
  
  try {
    console.log('🔍 Checking existing tables...');
    
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `;
    
    console.log('📋 Found tables:', tables.map(t => t.table_name));
    
    if (tables.length === 0) {
      console.log('⚠️  No tables found. Creating basic structure...');
      
      // Create projects table
      await sql`
        CREATE TABLE IF NOT EXISTS projects (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name TEXT NOT NULL,
          description TEXT,
          owner_id TEXT NOT NULL,
          invite_code TEXT UNIQUE,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `;
      
      // Create project_members table
      await sql`
        CREATE TABLE IF NOT EXISTS project_members (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
          user_id TEXT NOT NULL,
          role TEXT DEFAULT 'member',
          joined_at TIMESTAMP DEFAULT NOW()
        )
      `;
      
      console.log('✅ Basic tables created');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkTables();
