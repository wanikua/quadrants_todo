#!/usr/bin/env node

/**
 * 创建 Stripe 促销码脚本
 * 自动创建一个可以工作的促销码
 */

require('dotenv').config({ path: '.env.local' })
const Stripe = require('stripe')

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-09-30.clover',
})

async function createPromoCode() {
  console.log('🎯 开始创建促销码...\n')

  try {
    // 1. 创建优惠券 (10% 折扣)
    console.log('1️⃣ 创建优惠券...')
    const coupon = await stripe.coupons.create({
      percent_off: 10,
      duration: 'forever',
      name: 'Universal 10% Off',
    })
    console.log(`   ✅ 优惠券创建成功: ${coupon.id}`)
    console.log(`   折扣: ${coupon.percent_off}%\n`)

    // 2. 创建促销码
    console.log('2️⃣ 创建促销码...')
    const promoCode = await stripe.promotionCodes.create({
      coupon: coupon.id,
      code: 'WELCOME10',
    })
    console.log(`   ✅ 促销码创建成功!`)
    console.log(`   促销码: ${promoCode.code}`)
    console.log(`   ID: ${promoCode.id}`)
    console.log(`   状态: ${promoCode.active ? '✅ 活跃' : '❌ 未激活'}\n`)

    // 3. 测试说明
    console.log('3️⃣ 测试步骤:')
    console.log('   1. 刷新浏览器 (Cmd+Shift+R)')
    console.log('   2. 访问 http://localhost:3000/dashboard')
    console.log('   3. 点击 "Upgrade to Pro"')
    console.log('   4. 在 Stripe 支付页面点击 "Add promotion code"')
    console.log(`   5. 输入: WELCOME10`)
    console.log('   6. 应该显示 10% 折扣\n')

    console.log('✅ 完成！促销码已准备就绪！')

  } catch (error) {
    console.error('\n❌ 创建失败:', error.message)

    if (error.code === 'coupon_expired' || error.message.includes('already exists')) {
      console.log('\n💡 促销码可能已存在，尝试使用不同的名称')
      console.log('   或者在 Stripe Dashboard 删除现有的促销码后重试')
    } else if (error.type === 'StripePermissionError') {
      console.log('\n💡 权限不足，需要添加以下权限到 Restricted Key:')
      console.log('   - Coupons: Write')
      console.log('   - Promotion Codes: Write')
    }
  }
}

// 运行创建脚本
createPromoCode().catch(console.error)
