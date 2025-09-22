require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');
const { drizzle } = require('drizzle-orm/neon-http');

async function testDrizzle() {
  console.log('🧪 测试Drizzle连接...');
  
  const databaseUrl = process.env.DATABASE_URL;
  console.log('📍 DATABASE_URL exists:', !!databaseUrl);
  console.log('📍 DATABASE_URL format:', databaseUrl ? databaseUrl.substring(0, 20) + '...' : 'N/A');
  
  try {
    // 直接测试Neon连接
    const sql = neon(databaseUrl);
    const result = await sql`SELECT NOW() as current_time`;
    console.log('✅ 原生Neon连接成功:', result[0].current_time);
    
    // 测试Drizzle连接
    const db = drizzle(sql);
    console.log('✅ Drizzle实例创建成功');
    
    // 测试简单查询
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    console.log('✅ 数据库表查询成功:', tables.map(t => t.table_name));
    
    return { success: true, db };
    
  } catch (error) {
    console.error('❌ Drizzle连接失败:', error.message);
    return { success: false, error };
  }
}

testDrizzle();