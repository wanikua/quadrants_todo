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

    const trimmedName = name.trim()

    // Update user name in users table
    await sql`
      UPDATE users
      SET name = ${trimmedName}, updated_at = NOW()
      WHERE id = ${user.id}
    `

    // Update player name in all projects where this user is a member
    const updatedPlayers = await sql`
      UPDATE players
      SET name = ${trimmedName}
      WHERE user_id = ${user.id}
      RETURNING project_id
    `

    console.log(`Updated name for user ${user.id} in ${updatedPlayers.length} project(s)`)

    return NextResponse.json({
      success: true,
      name: trimmedName,
      message: "Name updated successfully",
      projectsUpdated: updatedPlayers.length
    })
  } catch (error) {
    console.error("Failed to update user name:", error)
    return NextResponse.json(
      { error: "Failed to update name" },
      { status: 500 }
    )
  }
}
