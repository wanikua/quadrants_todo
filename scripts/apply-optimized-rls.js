const { neon } = require('@neondatabase/serverless');
const fs = require('fs');

const DATABASE_URL = "postgresql://neondb_owner:npg_3XQ4ghEceCoD@ep-shiny-shadow-agd4ewqa-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require";
const sql = neon(DATABASE_URL);

async function applyOptimizedRLS() {
  console.log('🔧 应用优化的RLS策略...\n');

  try {
    // 读取SQL文件
    const sqlContent = fs.readFileSync('scripts/optimize-rls-for-serverless.sql', 'utf8');

    // 分割为单独的语句
    const statements = sqlContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && s !== '');

    let successCount = 0;
    let skipCount = 0;

    for (const statement of statements) {
      // 跳过注释块
      if (statement.match(/^-{2,}/)) {
        skipCount++;
        continue;
      }

      try {
        await sql([statement]);
        successCount++;

        // 显示正在执行的操作
        if (statement.includes('DROP POLICY')) {
          const match = statement.match(/DROP POLICY.*?(\w+)\s+ON\s+(\w+)/);
          if (match) console.log(`   🗑️  删除策略: ${match[1]} (${match[2]})`);
        } else if (statement.includes('CREATE POLICY')) {
          const match = statement.match(/CREATE POLICY\s+(\w+)\s+ON\s+(\w+)/);
          if (match) console.log(`   ✅ 创建策略: ${match[1]} (${match[2]})`);
        }
      } catch (error) {
        // 忽略"策略不存在"的错误
        if (error.message && error.message.includes('does not exist')) {
          skipCount++;
        } else {
          console.error(`   ❌ 错误: ${error.message}`);
        }
      }
    }

    console.log(`\n✅ 执行完成:`);
    console.log(`   成功: ${successCount} 条语句`);
    console.log(`   跳过: ${skipCount} 条语句\n`);

    // 验证新的策略
    console.log('📊 验证新的RLS策略:\n');

    const policies = await sql`
      SELECT
        tablename,
        policyname,
        cmd,
        qual::text,
        with_check::text
      FROM pg_policies
      WHERE schemaname = 'public'
      ORDER BY tablename, cmd, policyname
    `;

    const byTable = {};
    policies.forEach(p => {
      if (!byTable[p.tablename]) byTable[p.tablename] = [];
      byTable[p.tablename].push(p);
    });

    Object.entries(byTable).forEach(([table, pols]) => {
      console.log(`📋 ${table}表:`);
      pols.forEach(p => {
        const type = p.qual === 'true' ? '✅ PERMISSIVE' : '🔒 RESTRICTIVE';
        console.log(`   ${p.cmd.padEnd(8)} ${p.policyname.padEnd(35)} ${type}`);
      });
      console.log();
    });

    console.log('🎉 RLS策略优化完成！\n');
    console.log('💡 新的策略模式:');
    console.log('   - RLS仍然启用（防护层）');
    console.log('   - 使用PERMISSIVE策略（应用层负责主要访问控制）');
    console.log('   - 适配Neon Serverless无状态连接');
    console.log('   - 促销码表保持严格策略\n');

  } catch (error) {
    console.error('❌ 执行失败:', error.message);
    console.error(error);
    process.exit(1);
  }
}

applyOptimizedRLS();
