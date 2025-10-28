import { NextRequest, NextResponse } from 'next/server'
import { createCheckoutSession } from '@/lib/stripe'
import { STRIPE_CONFIG } from '@/lib/stripe-config'
import { requireAuth } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { priceId, plan } = body

    if (!priceId) {
      return NextResponse.json(
        { error: 'Price ID is required' },
        { status: 400 }
      )
    }

    // Validate price ID
    const validPriceIds = Object.values(STRIPE_CONFIG.prices)
    if (!validPriceIds.includes(priceId)) {
      return NextResponse.json(
        { error: 'Invalid price ID' },
        { status: 400 }
      )
    }

    const origin = req.headers.get('origin') || 'http://localhost:3000'

    const session = await createCheckoutSession({
      priceId,
      userId: user.id,
      userEmail: user.email,
      successUrl: `${origin}/dashboard?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${origin}/dashboard?canceled=true`,
    })

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    })
  } catch (error) {
    console.error('Error creating checkout session:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
