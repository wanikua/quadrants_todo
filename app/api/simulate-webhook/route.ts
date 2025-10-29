import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import Stripe from 'stripe'

// Simulate the exact webhook handler logic
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  console.log('Processing checkout.session.completed:', JSON.stringify(session, null, 2))

  const userId = session.metadata?.userId || session.client_reference_id

  if (!userId) {
    console.error('No user ID in checkout session. Metadata:', session.metadata)
    throw new Error('No user ID found in checkout session')
  }

  const customerId = session.customer as string
  const subscriptionId = session.subscription as string

  console.log(`Updating user ${userId} with customer ${customerId} and subscription ${subscriptionId}`)

  // Check if user exists
  const existingUser = await sql`SELECT id FROM users WHERE id = ${userId}`

  if (existingUser.length === 0) {
    console.error(`User ${userId} not found in database`)
    throw new Error(`User ${userId} does not exist`)
  }

  try {
    const result = await sql`
      UPDATE users
      SET
        stripe_customer_id = ${customerId},
        stripe_subscription_id = ${subscriptionId},
        subscription_status = 'pro',
        subscription_plan = 'pro',
        updated_at = NOW()
      WHERE id = ${userId}
    `

    console.log(`SQL update result:`, result)
    console.log(`Subscription activated for user ${userId}`)

    return { success: true, userId, customerId, subscriptionId }
  } catch (error) {
    console.error('SQL Error in handleCheckoutCompleted:', error)
    throw error
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { userId, customerId, subscriptionId } = body

    // Create a mock Stripe checkout session
    const mockSession = {
      id: 'cs_test_mock',
      object: 'checkout.session',
      customer: customerId || 'cus_test123',
      subscription: subscriptionId || 'sub_test123',
      metadata: {
        userId: userId || null
      },
      client_reference_id: userId || null,
    } as unknown as Stripe.Checkout.Session

    const result = await handleCheckoutCompleted(mockSession)

    return NextResponse.json({
      success: true,
      message: 'Webhook simulation successful',
      result
    })
  } catch (error) {
    console.error('Webhook simulation error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}

// GET endpoint to test with query params
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'userId query parameter is required'
      }, { status: 400 })
    }

    // Check if user exists
    const users = await sql`SELECT * FROM users WHERE id = ${userId}`

    if (users.length === 0) {
      // List all users
      const allUsers = await sql`SELECT id, email, display_name FROM users`

      return NextResponse.json({
        success: false,
        error: `User ${userId} not found`,
        availableUsers: allUsers
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      user: users[0]
    })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
