import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { isPro } from "@/lib/entitlements"

export async function GET() {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        subscription_status: user.subscription_status,
        subscription_plan: user.subscription_plan,
        stripe_customer_id: user.stripe_customer_id,
        stripe_subscription_id: user.stripe_subscription_id,
        subscription_period_end: user.subscription_period_end,
      },
      isPro: isPro(user)
    })
  } catch (error) {
    console.error("Check user error:", error)
    return NextResponse.json({ error: "Failed to get user data" }, { status: 500 })
  }
}
