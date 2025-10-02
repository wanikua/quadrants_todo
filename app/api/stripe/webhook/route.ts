import { type NextRequest, NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import { sql } from "@/lib/database"
import type Stripe from "stripe"

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get("stripe-signature")

  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
    if (!webhookSecret) {
      throw new Error("STRIPE_WEBHOOK_SECRET not configured")
    }

    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (error) {
    console.error("Webhook signature verification failed:", error)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.userId
        const customerId = session.customer as string

        if (userId && customerId) {
          await sql`
            UPDATE users 
            SET stripe_customer_id = ${customerId}
            WHERE id = ${userId}
          `
        }
        break
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        const plan =
          subscription.items.data[0]?.price.id === process.env.STRIPE_PRICE_ID_TEAM_MONTHLY ||
          subscription.items.data[0]?.price.id === process.env.STRIPE_PRICE_ID_TEAM_YEARLY
            ? "TEAM"
            : "PRO"

        await sql`
          UPDATE users 
          SET 
            stripe_subscription_id = ${subscription.id},
            subscription_plan = ${plan},
            subscription_status = ${subscription.status}
          WHERE stripe_customer_id = ${customerId}
        `
        break
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        await sql`
          UPDATE users 
          SET 
            stripe_subscription_id = NULL,
            subscription_plan = 'FREE',
            subscription_status = 'canceled'
          WHERE stripe_customer_id = ${customerId}
        `
        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("Error processing webhook:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}
