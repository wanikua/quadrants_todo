import Stripe from "stripe"

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not set")
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-09-30.clover",
  typescript: true,
})

export const SUBSCRIPTION_PLANS = {
  FREE: {
    name: "Free",
    maxProjects: 1,
    maxMembers: 1,
    features: ["1 project", "Unlimited tasks", "Basic support"],
  },
  PRO: {
    name: "Pro",
    maxProjects: 10,
    maxMembers: 5,
    features: ["10 projects", "Unlimited tasks", "Up to 5 team members", "Priority support", "Export data"],
    priceMonthly: process.env.STRIPE_PRICE_ID_PRO_MONTHLY,
    priceYearly: process.env.STRIPE_PRICE_ID_PRO_YEARLY,
  },
  TEAM: {
    name: "Team",
    maxProjects: -1,
    maxMembers: -1,
    features: [
      "Unlimited projects",
      "Unlimited tasks",
      "Unlimited team members",
      "24/7 support",
      "Advanced analytics",
      "Custom integrations",
    ],
    priceMonthly: process.env.STRIPE_PRICE_ID_TEAM_MONTHLY,
    priceYearly: process.env.STRIPE_PRICE_ID_TEAM_YEARLY,
  },
} as const

export type SubscriptionPlan = keyof typeof SUBSCRIPTION_PLANS

export async function createCheckoutSession(userId: string, userEmail: string, priceId: string): Promise<string> {
  const session = await stripe.checkout.sessions.create({
    customer_email: userEmail,
    client_reference_id: userId,
    payment_method_types: ["card"],
    mode: "subscription",
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/projects?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/pricing`,
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
    return_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/projects`,
  })

  return session.url
}

export async function cancelSubscription(subscriptionId: string): Promise<void> {
  await stripe.subscriptions.cancel(subscriptionId)
}

export function getPlanLimits(plan: SubscriptionPlan) {
  return {
    maxProjects: SUBSCRIPTION_PLANS[plan].maxProjects,
    maxMembers: SUBSCRIPTION_PLANS[plan].maxMembers,
  }
}

export function canCreateProject(currentCount: number, plan: SubscriptionPlan): boolean {
  const limits = getPlanLimits(plan)
  if (limits.maxProjects === -1) return true
  return currentCount < limits.maxProjects
}

export function canAddMember(currentCount: number, plan: SubscriptionPlan): boolean {
  const limits = getPlanLimits(plan)
  if (limits.maxMembers === -1) return true
  return currentCount < limits.maxMembers
}
