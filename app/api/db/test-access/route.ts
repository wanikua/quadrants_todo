import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getUserId } from "@/lib/auth"

export async function GET() {
  try {
    const userId = await getUserId()

    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Check projects
    const projects = await sql`
      SELECT * FROM projects WHERE owner_id = ${userId}
    `

    // Check project_members
    const members = await sql`
      SELECT * FROM project_members WHERE user_id = ${userId}
    `

    return NextResponse.json({
      userId,
      projects,
      members,
      hasProjects: projects.length > 0,
      hasMembers: members.length > 0
    })
  } catch (error) {
    console.error("Error testing access:", error)
    return NextResponse.json({
      error: "Failed to test access",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
