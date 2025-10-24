import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { sql } from "@/lib/database"

export async function POST(request: Request) {
  try {
    const user = await requireAuth()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name } = await request.json()

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    if (name.trim().length > 100) {
      return NextResponse.json({ error: "Name is too long (max 100 characters)" }, { status: 400 })
    }

    // Update user name in database
    if (!sql) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 })
    }

    await sql`
      UPDATE users
      SET name = ${name.trim()}, updated_at = NOW()
      WHERE id = ${user.id}
    `

    return NextResponse.json({
      success: true,
      name: name.trim(),
      message: "Name updated successfully"
    })
  } catch (error) {
    console.error("Failed to update user name:", error)
    return NextResponse.json(
      { error: "Failed to update name" },
      { status: 500 }
    )
  }
}
