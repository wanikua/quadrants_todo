import { type NextRequest, NextResponse } from "next/server"
import { createCheckoutSession } from "@/lib/stripe"
import { requireAuth } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()

    if (!user?.email) {
      return NextResponse.json({ error: "User email not found" }, { status: 400 })
    }

    const body = await request.json()
    const { priceId } = body

    if (!priceId) {
      return NextResponse.json({ error: "Price ID is required" }, { status: 400 })
    }

    const session = await createCheckoutSession({
      priceId,
      userId: user.id,
      userEmail: user.email,
      successUrl: `${request.nextUrl.origin}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${request.nextUrl.origin}/pricing`,
    })

    const url = session.url

    return NextResponse.json({ url })
  } catch (error) {
    console.error("Error creating checkout session:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}
