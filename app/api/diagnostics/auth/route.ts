import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { sql } from "@/lib/db"

export async function GET() {
  try {
    // Check if JWT_SECRET is configured
    if (!process.env.JWT_SECRET) {
      return NextResponse.json({
        success: false,
        message: "JWT_SECRET not configured",
        details: "Add JWT_SECRET to environment variables",
      })
    }

    // Check current user (will be null if not logged in, which is fine)
    const user = await getCurrentUser()

    // Check if users table exists and is accessible
    if (sql) {
      const userCount = await sql`SELECT COUNT(*) as count FROM users`

      return NextResponse.json({
        success: true,
        message: user ? "Authenticated" : "Auth system ready",
        details: `${userCount[0].count} users registered`,
        currentUser: user ? { email: user.email, name: user.name } : null,
      })
    }

    return NextResponse.json({
      success: true,
      message: "Auth system configured",
      details: "JWT secret present",
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: "Auth check failed",
      details: error instanceof Error ? error.message : String(error),
    })
  }
}
