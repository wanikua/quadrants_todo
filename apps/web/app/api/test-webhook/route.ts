import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export async function POST() {
  try {
    // Simulate a checkout session completed event
    const testUserId = 'test-user-123'
    const testCustomerId = 'cus_test123'
    const testSubscriptionId = 'sub_test123'

    console.log('Testing webhook with:', {
      userId: testUserId,
      customerId: testCustomerId,
      subscriptionId: testSubscriptionId
    })

    // First, ensure test user exists
    await sql`
      INSERT INTO users (id, email, name)
      VALUES (${testUserId}, 'test@example.com', 'Test User')
      ON CONFLICT (id) DO NOTHING
    `

    // Now try to update with Stripe data (using correct status)
    const result = await sql`
      UPDATE users
      SET
        stripe_customer_id = ${testCustomerId},
        stripe_subscription_id = ${testSubscriptionId},
        subscription_status = 'pro',
        subscription_plan = 'pro',
        updated_at = NOW()
      WHERE id = ${testUserId}
    `

    console.log('Update result:', result)

    // Verify the update
    const user = await sql`
      SELECT * FROM users WHERE id = ${testUserId}
    `

    return NextResponse.json({
      success: true,
      message: 'Webhook test successful',
      result,
      user: user[0]
    })
  } catch (error) {
    console.error('Webhook test error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}
