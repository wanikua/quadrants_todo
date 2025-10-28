import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not defined in environment variables')
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-09-30.clover',
  typescript: true,
})

// Webhook secret for signature verification (server-side only)
export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || ''

// Helper function to create checkout session
export async function createCheckoutSession({
  priceId,
  userId,
  userEmail,
  successUrl,
  cancelUrl,
}: {
  priceId: string
  userId: string
  userEmail: string
  successUrl: string
  cancelUrl: string
}) {
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    customer_email: userEmail,
    client_reference_id: userId,
    allow_promotion_codes: true, // Enable Stripe promo codes
    metadata: {
      userId,
    },
    subscription_data: {
      metadata: {
        userId,
      },
    },
  })

  return session
}

// Helper function to create customer portal session
export async function createPortalSession({
  customerId,
  returnUrl,
}: {
  customerId: string
  returnUrl: string
}) {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  })

  return session
}
