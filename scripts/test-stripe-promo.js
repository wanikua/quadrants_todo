#!/usr/bin/env node

/**
 * Stripe 促销码诊断脚本
 * 用于检查促销码配置是否正确
 */

require('dotenv').config({ path: '.env.local' })
const Stripe = require('stripe')

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-09-30.clover',
})

const PRICE_ID = process.env.STRIPE_PRICE_PRO_MONTHLY

async function diagnose() {
  console.log('🔍 开始诊断 Stripe 促销码配置...\n')

  // 1. 检查密钥配置
  console.log('1️⃣ 检查密钥配置:')
  console.log(`   密钥类型: ${process.env.STRIPE_SECRET_KEY.substring(0, 10)}...`)
  console.log(`   价格 ID: ${PRICE_ID}\n`)

  try {
    // 2. 验证价格是否存在
    console.log('2️⃣ 验证价格是否存在:')
    const price = await stripe.prices.retrieve(PRICE_ID)
    console.log(`   ✅ 价格找到: ${price.nickname || price.id}`)
    console.log(`   金额: $${(price.unit_amount / 100).toFixed(2)} ${price.currency.toUpperCase()}`)
    console.log(`   产品 ID: ${price.product}\n`)

    // 3. 获取产品信息
    console.log('3️⃣ 获取产品信息:')
    const product = await stripe.products.retrieve(price.product)
    console.log(`   ✅ 产品名称: ${product.name}`)
    console.log(`   产品 ID: ${product.id}\n`)

    // 4. 列出所有活跃的促销码
    console.log('4️⃣ 列出所有活跃的促销码:')
    const promoCodes = await stripe.promotionCodes.list({
      active: true,
      limit: 10,
    })

    if (promoCodes.data.length === 0) {
      console.log('   ⚠️  未找到活跃的促销码\n')
      console.log('   💡 请在 Stripe Dashboard 创建促销码:\n')
      console.log('      1. 进入 Products → Coupons 创建优惠券')
      console.log('      2. 进入 Products → Promotion codes 创建促销码')
      console.log('      3. 确保 "Applies to" 设置为 "All products"\n')
    } else {
      console.log(`   ✅ 找到 ${promoCodes.data.length} 个活跃促销码:\n`)

      for (const promo of promoCodes.data) {
        const coupon = await stripe.coupons.retrieve(promo.coupon)

        console.log(`   📌 促销码: ${promo.code}`)
        console.log(`      ID: ${promo.id}`)
        console.log(`      优惠: ${coupon.percent_off ? coupon.percent_off + '%' : '$' + (coupon.amount_off / 100)}`)
        console.log(`      状态: ${promo.active ? '✅ 活跃' : '❌ 未激活'}`)

        // 检查产品限制
        if (promo.restrictions && promo.restrictions.first_time_transaction) {
          console.log(`      ⚠️  限制: 仅限首次交易`)
        }

        if (coupon.applies_to && coupon.applies_to.products) {
          console.log(`      ⚠️  限制: 仅适用于特定产品`)
          console.log(`      适用产品: ${coupon.applies_to.products.join(', ')}`)

          // 检查是否包含我们的产品
          if (!coupon.applies_to.products.includes(price.product)) {
            console.log(`      ❌ 不包含当前产品 (${price.product})`)
            console.log(`      💡 建议: 将优惠券的 "Applies to" 改为 "All products"`)
          } else {
            console.log(`      ✅ 包含当前产品`)
          }
        } else {
          console.log(`      ✅ 应用到所有产品`)
        }

        console.log('')
      }
    }

    // 5. 测试创建 checkout session
    console.log('5️⃣ 测试创建 Checkout Session:')
    try {
      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [{
          price: PRICE_ID,
          quantity: 1,
        }],
        success_url: 'http://localhost:3000/success',
        cancel_url: 'http://localhost:3000/cancel',
        allow_promotion_codes: true,
      })
      console.log(`   ✅ Checkout Session 创建成功`)
      console.log(`   Session ID: ${session.id}`)
      console.log(`   促销码功能: ${session.allow_promotion_codes ? '✅ 已启用' : '❌ 未启用'}\n`)
    } catch (error) {
      console.log(`   ❌ 创建失败: ${error.message}\n`)
    }

    // 6. 给出建议
    console.log('6️⃣ 建议:')
    if (promoCodes.data.length > 0) {
      const hasValidPromo = promoCodes.data.some(promo => {
        return !promo.restrictions?.first_time_transaction
      })

      if (hasValidPromo) {
        console.log('   ✅ 配置看起来正确')
        console.log('   💡 如果还是显示无效，请尝试:')
        console.log('      1. 使用无痕模式测试')
        console.log('      2. 确认促销码名称输入正确（区分大小写）')
        console.log('      3. 等待 1-2 分钟让 Stripe 缓存更新')
      } else {
        console.log('   ⚠️  所有促销码都有限制')
        console.log('   💡 建议创建一个无限制的测试促销码')
      }
    } else {
      console.log('   ⚠️  需要创建促销码')
    }

  } catch (error) {
    console.error('\n❌ 诊断失败:', error.message)

    if (error.type === 'StripeAuthenticationError') {
      console.log('\n💡 密钥验证失败，请检查:')
      console.log('   1. STRIPE_SECRET_KEY 是否正确')
      console.log('   2. 是否在正确的模式 (test/live)')
    } else if (error.type === 'StripePermissionError') {
      console.log('\n💡 权限不足，请检查 Restricted Key 权限')
    }
  }
}

// 运行诊断
diagnose().catch(console.error)
