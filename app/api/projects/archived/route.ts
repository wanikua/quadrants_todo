import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { getCurrentUser } from "@/lib/auth"

const sql = process.env.DATABASE_URL ? neon(process.env.DATABASE_URL) : null as any

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get all archived projects for the user
    const projects = await sql`
      SELECT DISTINCT
        p.*,
        (SELECT COUNT(*) FROM project_members WHERE project_id = p.id) as member_count
      FROM projects p
      LEFT JOIN project_members pm ON p.id = pm.project_id
      WHERE (p.owner_id = ${user.id} OR pm.user_id = ${user.id})
        AND p.archived = TRUE
      ORDER BY p.updated_at DESC
    `

    return NextResponse.json(projects)
  } catch (error) {
    console.error("Error fetching archived projects:", error)
    return NextResponse.json({ error: "Failed to fetch archived projects" }, { status: 500 })
  }
}
