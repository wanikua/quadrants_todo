import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { sql } from "@/lib/database"

export async function POST() {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    if (!sql) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 })
    }

    // Fix subscription_status to be 'active' instead of 'pro'
    await sql`
      UPDATE users
      SET subscription_status = 'active'
      WHERE id = ${user.id}
      AND subscription_plan = 'pro'
      AND subscription_status = 'pro'
    `

    return NextResponse.json({
      success: true,
      message: "Subscription status fixed",
      before: { subscription_status: user.subscription_status },
      after: { subscription_status: 'active' }
    })
  } catch (error) {
    console.error("Fix subscription error:", error)
    return NextResponse.json({ error: "Failed to fix subscription" }, { status: 500 })
  }
}
