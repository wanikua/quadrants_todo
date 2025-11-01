import { sql } from '../lib/db'
import { sendWelcomeEmail } from '../lib/email'

async function sendWelcomeToExistingProUsers() {
  console.log('Finding existing Pro users...\n')

  try {
    // 查找所有现有的 Pro 用户
    const proUsers = await sql`
      SELECT id, email, name, subscription_status, subscription_plan, created_at
      FROM users
      WHERE subscription_plan = 'pro'
        AND subscription_status = 'active'
        AND stripe_subscription_id IS NOT NULL
      ORDER BY created_at DESC
    `

    if (proUsers.length === 0) {
      console.log('No Pro users found.')
      return
    }

    console.log(`Found ${proUsers.length} Pro user(s):\n`)

    const results = {
      total: proUsers.length,
      sent: 0,
      failed: 0,
      errors: [] as any[]
    }

    // 给每个用户发送欢迎邮件
    for (const user of proUsers) {
      console.log(`Sending to: ${user.email} (${user.name})`)

      try {
        const result = await sendWelcomeEmail({
          to: user.email,
          userName: user.name || user.email.split('@')[0]
        })

        if (result.success) {
          console.log(`  Success - Email ID: ${result.data?.id}`)
          results.sent++
        } else {
          console.error(`  Failed - ${result.error}`)
          results.failed++
          results.errors.push({
            email: user.email,
            error: result.error
          })
        }
      } catch (error) {
        console.error(`  Error - ${error}`)
        results.failed++
        results.errors.push({
          email: user.email,
          error
        })
      }

      // 添加短暂延迟，避免触发速率限制
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    // 打印总结
    console.log('\n' + '='.repeat(60))
    console.log('Summary')
    console.log('='.repeat(60))
    console.log(`Total Pro users: ${results.total}`)
    console.log(`Emails sent successfully: ${results.sent}`)
    console.log(`Failed: ${results.failed}`)

    if (results.errors.length > 0) {
      console.log('\nFailed emails:')
      results.errors.forEach(err => {
        console.log(`  - ${err.email}: ${err.error}`)
      })
    }

    console.log('\nDone!')

  } catch (error) {
    console.error('Script failed:', error)
    process.exit(1)
  }
}

// 执行脚本
sendWelcomeToExistingProUsers()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
