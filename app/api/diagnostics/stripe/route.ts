import { NextResponse } from "next/server"

export async function GET() {
  const requiredKeys = ["STRIPE_SECRET_KEY", "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"]

  const optionalKeys = [
    "STRIPE_WEBHOOK_SECRET",
    "STRIPE_PRICE_ID_PRO_MONTHLY",
    "STRIPE_PRICE_ID_PRO_YEARLY",
    "STRIPE_PRICE_ID_TEAM_MONTHLY",
    "STRIPE_PRICE_ID_TEAM_YEARLY",
  ]

  const missingRequired = requiredKeys.filter((key) => !process.env[key])
  const missingOptional = optionalKeys.filter((key) => !process.env[key])

  if (missingRequired.length > 0) {
    return NextResponse.json({
      success: false,
      message: "Stripe not fully configured",
      details: `Missing: ${missingRequired.join(", ")}`,
    })
  }

  try {
    // Try to import and initialize Stripe
    const { stripe } = await import("@/lib/stripe")

    // Test API connection by retrieving account info
    const account = await stripe.accounts.retrieve()

    const warnings = []
    if (missingOptional.length > 0) {
      warnings.push(`Optional: ${missingOptional.join(", ")}`)
    }

    return NextResponse.json({
      success: true,
      message: "Stripe configured",
      details: `Account: ${account.email || account.id}${warnings.length > 0 ? ` (${warnings.join(", ")})` : ""}`,
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: "Stripe API connection failed",
      details: error instanceof Error ? error.message : String(error),
    })
  }
}
