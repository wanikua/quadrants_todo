import { NextRequest, NextResponse } from 'next/server'
import { stripe, STRIPE_CONFIG } from '@/lib/stripe'
import { sql } from '@/lib/db'
import Stripe from 'stripe'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json(
      { error: 'No signature' },
      { status: 400 }
    )
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      STRIPE_CONFIG.webhookSecret
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    )
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        await handleCheckoutCompleted(session)
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionUpdated(subscription)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionDeleted(subscription)
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        await handlePaymentSucceeded(invoice)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        await handlePaymentFailed(invoice)
        break
      }

      default:
        console.log(\`Unhandled event type: \${event.type}\`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Error processing webhook:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId || session.client_reference_id

  if (!userId) {
    console.error('No user ID in checkout session')
    return
  }

  const customerId = session.customer as string
  const subscriptionId = session.subscription as string

  await sql\`
    UPDATE users
    SET
      stripe_customer_id = \${customerId},
      stripe_subscription_id = \${subscriptionId},
      subscription_status = 'active',
      subscription_plan = 'pro',
      updated_at = NOW()
    WHERE id = \${userId}
  \`

  console.log(\`Subscription activated for user \${userId}\`)
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string
  const status = subscription.status
  const currentPeriodEnd = new Date(subscription.current_period_end * 1000)

  await sql\`
    UPDATE users
    SET
      subscription_status = \${status},
      subscription_period_end = \${currentPeriodEnd.toISOString()},
      updated_at = NOW()
    WHERE stripe_customer_id = \${customerId}
  \`

  console.log(\`Subscription updated for customer \${customerId}\`)
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string

  await sql\`
    UPDATE users
    SET
      subscription_status = 'canceled',
      subscription_plan = 'free',
      updated_at = NOW()
    WHERE stripe_customer_id = \${customerId}
  \`

  console.log(\`Subscription canceled for customer \${customerId}\`)
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string
  console.log(\`Payment succeeded for customer \${customerId}\`)
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string
  console.log(\`Payment failed for customer \${customerId}\`)
}
