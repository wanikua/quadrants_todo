import { type NextRequest, NextResponse } from "next/server"
import { createCheckoutSession } from "@/lib/stripe"
import { requireAuth } from "@/lib/auth"
import { stackServerApp } from "@/stack"

export async function POST(request: NextRequest) {
  try {
    const userId = await requireAuth()
    const user = await stackServerApp.getUser()

    if (!user?.primaryEmail) {
      return NextResponse.json({ error: "User email not found" }, { status: 400 })
    }

    const body = await request.json()
    const { priceId } = body

    if (!priceId) {
      return NextResponse.json({ error: "Price ID is required" }, { status: 400 })
    }

    const url = await createCheckoutSession(userId, user.primaryEmail, priceId)

    return NextResponse.json({ url })
  } catch (error) {
    console.error("Error creating checkout session:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}
