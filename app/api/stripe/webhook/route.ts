import { NextRequest, NextResponse } from 'next/server'
import { stripe, STRIPE_WEBHOOK_SECRET } from '@/lib/stripe'
import { sql } from '@/lib/db'
import Stripe from 'stripe'

// Map Stripe subscription status to app status
function mapStripeStatusToAppStatus(stripeStatus: string): 'free' | 'pro' | 'team' {
  switch (stripeStatus) {
    case 'active':
    case 'trialing':
      return 'pro'
    case 'canceled':
    case 'incomplete':
    case 'incomplete_expired':
    case 'unpaid':
    case 'past_due':
    default:
      return 'free'
  }
}

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
      STRIPE_WEBHOOK_SECRET
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
        console.log(`Unhandled event type: ${event.type}`)
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
  console.log('Processing checkout.session.completed:', JSON.stringify(session, null, 2))

  const userId = session.metadata?.userId || session.client_reference_id

  if (!userId) {
    console.error('No user ID in checkout session. Metadata:', session.metadata)
    throw new Error('No user ID found in checkout session')
  }

  const customerId = session.customer as string
  const subscriptionId = session.subscription as string

  console.log(`Updating user ${userId} with customer ${customerId} and subscription ${subscriptionId}`)

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
  } catch (error) {
    console.error('SQL Error in handleCheckoutCompleted:', error)
    throw error
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string
  const stripeStatus = subscription.status

  // Map Stripe status to our app status (free, pro, team)
  const appStatus = mapStripeStatusToAppStatus(stripeStatus)

  // Type assertion needed as Stripe types may not include all runtime properties
  const currentPeriodEnd = new Date((subscription as unknown as { current_period_end: number }).current_period_end * 1000)

  await sql`
    UPDATE users
    SET
      subscription_status = ${appStatus},
      subscription_period_end = ${currentPeriodEnd.toISOString()},
      updated_at = NOW()
    WHERE stripe_customer_id = ${customerId}
  `

  console.log(`Subscription updated for customer ${customerId}: ${stripeStatus} -> ${appStatus}`)
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string

  await sql`
    UPDATE users
    SET
      subscription_status = 'free',
      subscription_plan = 'free',
      updated_at = NOW()
    WHERE stripe_customer_id = ${customerId}
  `

  console.log(`Subscription canceled for customer ${customerId}`)
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string
  console.log(`Payment succeeded for customer ${customerId}`)
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string
  console.log(`Payment failed for customer ${customerId}`)
}
