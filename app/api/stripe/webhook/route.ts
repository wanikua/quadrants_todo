import { NextRequest, NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import { neon } from "@neondatabase/serverless"
import Stripe from "stripe"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get("stripe-signature")

  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    console.error("Webhook signature verification failed:", err)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.userId || session.client_reference_id

        if (!userId) {
          console.error("No user ID found in checkout session")
          break
        }

        // Update user subscription in database
        await sql`
          UPDATE users
          SET
            subscription_id = ${session.subscription as string},
            stripe_customer_id = ${session.customer as string},
            subscription_status = 'pro',
            updated_at = NOW()
          WHERE id = ${userId}
        `
        break
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        // Determine subscription status based on price
        let status = "pro"
        const priceId = subscription.items.data[0]?.price.id

        if (priceId === process.env.STRIPE_PRICE_ID_TEAM_MONTHLY || priceId === process.env.STRIPE_PRICE_ID_TEAM_YEARLY) {
          status = "team"
        }

        await sql`
          UPDATE users
          SET
            subscription_status = ${status},
            subscription_id = ${subscription.id},
            updated_at = NOW()
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
            subscription_status = 'free',
            subscription_id = NULL,
            updated_at = NOW()
          WHERE stripe_customer_id = ${customerId}
        `
        break
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice
        console.log(`Payment succeeded for invoice ${invoice.id}`)
        // You can add additional logic here, like sending a confirmation email
        break
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice
        console.error(`Payment failed for invoice ${invoice.id}`)
        // You can add logic to notify the user about the failed payment
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("Error processing webhook:", error)
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }
}
