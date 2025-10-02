import { type NextRequest, NextResponse } from "next/server"
import { createCheckoutSession } from "@/lib/stripe"
import { requireAuth, getCurrentUser } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const userId = await requireAuth()
    const user = await getCurrentUser()

    if (!user?.email) {
      return NextResponse.json({ error: "User email not found" }, { status: 400 })
    }

    const body = await request.json()
    const { priceId } = body

    if (!priceId) {
      return NextResponse.json({ error: "Price ID is required" }, { status: 400 })
    }

    const url = await createCheckoutSession(userId, user.email, priceId)

    return NextResponse.json({ url })
  } catch (error) {
    console.error("Error creating checkout session:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}
