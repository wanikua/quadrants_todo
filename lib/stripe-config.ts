// Stripe configuration that can be safely used in client components
export const STRIPE_CONFIG = {
  // Price IDs from Stripe Dashboard (safe to expose to client)
  prices: {
    pro_monthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY || process.env.STRIPE_PRICE_PRO_MONTHLY || 'price_1SLne4Gzys4mNk1LQJdhPIKa',
    pro_yearly: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_YEARLY || process.env.STRIPE_PRICE_PRO_YEARLY || 'price_xxx',
  },
}
