import { sql } from '../lib/db'

async function fixExistingUsers() {
  console.log('🔧 开始修复现有用户订阅状态...\n')

  try {
    // Step 1: 更新数据库约束
    console.log('📋 步骤 1: 更新数据库约束...')
    try {
      await sql`
        ALTER TABLE users DROP CONSTRAINT IF EXISTS users_subscription_status_check;
      `
      console.log('   ✓ 删除旧约束')

      await sql`
        ALTER TABLE users ADD CONSTRAINT users_subscription_status_check
        CHECK (subscription_status IN (
          'free',                -- 免费用户
          'pro',                 -- Pro (legacy)
          'team',                -- 团队版
          'active',              -- 激活的订阅
          'canceled',            -- 已取消
          'past_due',            -- 逾期
          'trialing',            -- 试用期
          'incomplete',          -- 未完成
          'incomplete_expired',  -- 未完成已过期
          'unpaid'               -- 未支付
        ));
      `
      console.log('   ✓ 添加新约束\n')
    } catch (error: any) {
      console.log('   ⚠️  约束更新失败（可能已存在）:', error.message)
    }

    // Step 2: 检查需要修复的用户
    console.log('📊 步骤 2: 检查需要修复的用户...')
    const usersToFix = await sql`
      SELECT id, email, subscription_status, subscription_plan, stripe_subscription_id
      FROM users
      WHERE subscription_status = 'pro'
        AND subscription_plan = 'pro'
        AND stripe_subscription_id IS NOT NULL
    `

    if (usersToFix.length === 0) {
      console.log('   ℹ️  没有用户需要修复\n')
      console.log('✅ 所有用户状态正常！')
      return
    }

    console.log(`   ⚠️  找到 ${usersToFix.length} 个用户需要修复:`)
    usersToFix.forEach((user: any, index: number) => {
      console.log(`   ${index + 1}. ${user.email} (${user.id})`)
      console.log(`      当前状态: subscription_status='${user.subscription_status}'`)
    })
    console.log('')

    // Step 3: 修复用户状态
    console.log('🔄 步骤 3: 修复用户状态 (pro → active)...')
    const result = await sql`
      UPDATE users
      SET subscription_status = 'active',
          updated_at = NOW()
      WHERE subscription_status = 'pro'
        AND subscription_plan = 'pro'
        AND stripe_subscription_id IS NOT NULL
      RETURNING id, email, subscription_status, subscription_plan
    `

    console.log(`   ✓ 成功修复 ${result.length} 个用户\n`)

    // Step 4: 验证修复结果
    console.log('✔️  步骤 4: 验证修复结果...')
    const verification = await sql`
      SELECT
        COUNT(*) FILTER (WHERE subscription_status = 'active' AND subscription_plan = 'pro') as active_pro,
        COUNT(*) FILTER (WHERE subscription_status = 'pro' AND subscription_plan = 'pro') as still_pro,
        COUNT(*) FILTER (WHERE subscription_plan = 'pro') as total_pro
      FROM users
    `

    const stats = verification[0]
    console.log(`   • Pro 用户总数: ${stats.total_pro}`)
    console.log(`   • 状态为 'active' 的 Pro 用户: ${stats.active_pro}`)
    console.log(`   • 状态仍为 'pro' 的用户: ${stats.still_pro}`)

    if (parseInt(stats.still_pro) > 0) {
      console.log('\n   ⚠️  警告: 仍有用户状态为 "pro"，可能需要手动检查')
    }

    console.log('\n' + '='.repeat(60))
    console.log('✅ 修复完成！')
    console.log('='.repeat(60))

    console.log('\n📋 修复后的用户列表:')
    result.forEach((user: any, index: number) => {
      console.log(`${index + 1}. ${user.email}`)
      console.log(`   状态: ${user.subscription_status} | 计划: ${user.subscription_plan}`)
    })

    console.log('\n💡 下一步:')
    console.log('   1. 通知这些用户退出并重新登录')
    console.log('   2. 验证他们可以访问 Pro 功能')
    console.log('   3. 检查 Dashboard 显示正确的 Pro 状态\n')

  } catch (error) {
    console.error('\n❌ 修复失败:', error)
    if (error instanceof Error) {
      console.error('错误详情:', error.message)
      console.error('堆栈:', error.stack)
    }
    process.exit(1)
  }
}

// 执行修复
fixExistingUsers()
  .then(() => {
    console.log('🎉 脚本执行完成')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 脚本执行失败:', error)
    process.exit(1)
  })
