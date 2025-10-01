import { NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(req: NextRequest) {
  try {
    const { code, userId } = await req.json()

    if (!code || !userId) {
      return NextResponse.json(
        { error: "Code and userId are required" },
        { status: 400 }
      )
    }

    // Get promo code details
    const promoCodes = await sql`
      SELECT * FROM promo_codes
      WHERE code = ${code.toUpperCase()} AND is_active = true
    `

    if (promoCodes.length === 0) {
      return NextResponse.json(
        { error: "Invalid or inactive promo code" },
        { status: 404 }
      )
    }

    const promoCode = promoCodes[0]

    // Check if expired
    if (promoCode.expires_at && new Date(promoCode.expires_at) < new Date()) {
      return NextResponse.json(
        { error: "Promo code has expired" },
        { status: 400 }
      )
    }

    // Check max uses
    if (promoCode.max_uses && promoCode.current_uses >= promoCode.max_uses) {
      return NextResponse.json(
        { error: "Promo code has reached maximum uses" },
        { status: 400 }
      )
    }

    // Check if user already redeemed
    const existing = await sql`
      SELECT * FROM promo_code_redemptions
      WHERE promo_code_id = ${promoCode.id} AND user_id = ${userId}
    `

    if (existing.length > 0) {
      return NextResponse.json(
        { error: "You have already redeemed this code" },
        { status: 400 }
      )
    }

    // Calculate expiration
    let expiresAt = null
    if (promoCode.duration_months) {
      const now = new Date()
      now.setMonth(now.getMonth() + promoCode.duration_months)
      expiresAt = now.toISOString()
    }

    // Create redemption record
    await sql`
      INSERT INTO promo_code_redemptions (promo_code_id, user_id, expires_at)
      VALUES (${promoCode.id}, ${userId}, ${expiresAt})
    `

    // Update usage count
    await sql`
      UPDATE promo_codes
      SET current_uses = current_uses + 1
      WHERE id = ${promoCode.id}
    `

    // Update user subscription
    await sql`
      UPDATE users
      SET
        subscription_status = ${promoCode.plan},
        updated_at = NOW()
      WHERE id = ${userId}
    `

    return NextResponse.json({
      success: true,
      plan: promoCode.plan,
      expiresAt,
      message: `Successfully upgraded to ${promoCode.plan.toUpperCase()} plan!`
    })

  } catch (error: any) {
    console.error("Error redeeming promo code:", error)
    return NextResponse.json(
      { error: "Failed to redeem promo code" },
      { status: 500 }
    )
  }
}

// GET endpoint to validate a code without redeeming
export async function GET(req: NextRequest) {
  try {
    const code = req.nextUrl.searchParams.get("code")

    if (!code) {
      return NextResponse.json(
        { error: "Code is required" },
        { status: 400 }
      )
    }

    const promoCodes = await sql`
      SELECT code, plan, duration_months, max_uses, current_uses, expires_at
      FROM promo_codes
      WHERE code = ${code.toUpperCase()} AND is_active = true
    `

    if (promoCodes.length === 0) {
      return NextResponse.json(
        { valid: false, error: "Invalid promo code" },
        { status: 404 }
      )
    }

    const promoCode = promoCodes[0]

    // Check if expired
    if (promoCode.expires_at && new Date(promoCode.expires_at) < new Date()) {
      return NextResponse.json(
        { valid: false, error: "Promo code has expired" },
        { status: 400 }
      )
    }

    // Check max uses
    if (promoCode.max_uses && promoCode.current_uses >= promoCode.max_uses) {
      return NextResponse.json(
        { valid: false, error: "Promo code has reached maximum uses" },
        { status: 400 }
      )
    }

    return NextResponse.json({
      valid: true,
      code: promoCode.code,
      plan: promoCode.plan,
      durationMonths: promoCode.duration_months,
      remainingUses: promoCode.max_uses ? promoCode.max_uses - promoCode.current_uses : null
    })

  } catch (error) {
    console.error("Error validating promo code:", error)
    return NextResponse.json(
      { error: "Failed to validate promo code" },
      { status: 500 }
    )
  }
}
