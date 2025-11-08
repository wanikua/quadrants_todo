import { NextResponse } from "next/server"

export async function GET() {
  const required = ["DATABASE_URL", "JWT_SECRET"]

  const optional = [
    "STRIPE_SECRET_KEY",
    "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
    "STRIPE_WEBHOOK_SECRET",
    "STRIPE_PRICE_ID_PRO_MONTHLY",
    "STRIPE_PRICE_ID_TEAM_MONTHLY",
    "NEXT_PUBLIC_APP_URL",
  ]

  const missing = required.filter((key) => !process.env[key])
  const missingOptional = optional.filter((key) => !process.env[key])

  if (missing.length > 0) {
    return NextResponse.json({
      success: false,
      message: `Missing required environment variables`,
      missing,
      missingOptional,
    })
  }

  return NextResponse.json({
    success: true,
    message: `All required environment variables configured`,
    missing: missingOptional.length > 0 ? missingOptional : undefined,
  })
}
