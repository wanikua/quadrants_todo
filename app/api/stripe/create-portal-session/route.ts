import { type NextRequest, NextResponse } from "next/server"
import { createPortalSession } from "@/lib/stripe"
import { requireAuth } from "@/lib/auth"
import { sql } from "@/lib/database"

export async function POST(request: NextRequest) {
  try {
    const userId = await requireAuth()

    // Get user's Stripe customer ID from database
    const result = await sql`
      SELECT stripe_customer_id 
      FROM users 
      WHERE id = ${userId}
    `

    if (!result || result.length === 0 || !result[0].stripe_customer_id) {
      return NextResponse.json({ error: "No active subscription found" }, { status: 400 })
    }

    const url = await createPortalSession(result[0].stripe_customer_id)

    return NextResponse.json({ url })
  } catch (error) {
    console.error("Error creating portal session:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}
