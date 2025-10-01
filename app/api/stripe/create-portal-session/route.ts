import { NextRequest, NextResponse } from "next/server"
import { createPortalSession } from "@/lib/stripe"
import { stackServerApp } from "@/lib/stack-server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(req: NextRequest) {
  try {
    const user = await stackServerApp.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user's Stripe customer ID from database
    const result = await sql`
      SELECT stripe_customer_id
      FROM users
      WHERE id = ${user.id}
    `

    if (!result[0]?.stripe_customer_id) {
      return NextResponse.json({ error: "No active subscription" }, { status: 400 })
    }

    const portalUrl = await createPortalSession(result[0].stripe_customer_id)

    return NextResponse.json({ url: portalUrl })
  } catch (error) {
    console.error("Error creating portal session:", error)
    return NextResponse.json({ error: "Failed to create portal session" }, { status: 500 })
  }
}
