import Stripe from "stripe"

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not set")
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-12-18.acacia",
  typescript: true,
})

export async function createCheckoutSession(userId: string, userEmail: string, priceId: string): Promise<string> {
  const session = await stripe.checkout.sessions.create({
    customer_email: userEmail,
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode: "subscription",
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/projects?success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?canceled=true`,
    metadata: {
      userId,
    },
  })

  if (!session.url) {
    throw new Error("Failed to create checkout session")
  }

  return session.url
}

export async function createPortalSession(customerId: string): Promise<string> {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/projects`,
  })

  return session.url
}

export async function getStripeCustomer(customerId: string) {
  return await stripe.customers.retrieve(customerId)
}

export async function getStripeSubscription(subscriptionId: string) {
  return await stripe.subscriptions.retrieve(subscriptionId)
}

export async function cancelStripeSubscription(subscriptionId: string) {
  return await stripe.subscriptions.cancel(subscriptionId)
}

export async function constructWebhookEvent(payload: string | Buffer, signature: string) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!webhookSecret) {
    throw new Error("STRIPE_WEBHOOK_SECRET is not set")
  }

  return stripe.webhooks.constructEvent(payload, signature, webhookSecret)
}

export async function getStripePriceId(tier: "pro" | "team", interval: "monthly" | "yearly"): Promise<string> {
  const envKey = `STRIPE_PRICE_ID_${tier.toUpperCase()}_${interval.toUpperCase()}`
  const priceId = process.env[envKey]

  if (!priceId) {
    throw new Error(`${envKey} is not set`)
  }

  return priceId
}
