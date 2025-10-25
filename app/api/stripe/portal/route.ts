import { NextRequest, NextResponse } from 'next/server'
import { createPortalSession } from '@/lib/stripe'
import { requireAuth } from '@/lib/auth'
import { sql } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user's Stripe customer ID
    const result = await sql`
      SELECT stripe_customer_id
      FROM users
      WHERE id = ${user.id}
    `

    if (!result || result.length === 0 || !result[0].stripe_customer_id) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 404 }
      )
    }

    const customerId = result[0].stripe_customer_id
    const origin = req.headers.get('origin') || 'http://localhost:3000'

    const session = await createPortalSession({
      customerId,
      returnUrl: `${origin}/dashboard`,
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Error creating portal session:', error)
    return NextResponse.json(
      { error: 'Failed to create portal session' },
      { status: 500 }
    )
  }
}
