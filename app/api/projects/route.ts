import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { requireAuth } from "@/lib/auth"
import { createProject } from "@/app/db/actions"

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, type = 'personal' } = body

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    // Check project limits for free users
    const isPro = user.subscription_plan === 'pro' && (user.subscription_status === 'pro' || user.subscription_status === 'active')

    if (!isPro) {
      // Count total existing projects for free users (max 3)
      const projectCounts = await sql`
        SELECT COUNT(*) as total_count
        FROM projects
        WHERE owner_id = ${user.id}
      `

      const { total_count } = projectCounts[0]

      if (parseInt(total_count) >= 3) {
        return NextResponse.json({
          error: "Free users can create up to 3 projects. Upgrade to Pro for unlimited projects.",
          requiresUpgrade: true
        }, { status: 403 })
      }
    }

    // Use the proper createProject function that handles members and players
    const result = await createProject(name, type)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    // Fetch the created project to return
    const project = await sql`
      SELECT * FROM projects WHERE id = ${result.projectId}
    `

    return NextResponse.json(project[0])
  } catch (error) {
    console.error("Error creating project:", error)
    return NextResponse.json({ error: "Failed to create project" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = user.id

    // Get all projects where user is owner or member
    const projects = await sql`
      SELECT DISTINCT p.*, pm.role
      FROM projects p
      LEFT JOIN project_members pm ON p.id = pm.project_id
      WHERE p.owner_id = ${userId} OR pm.user_id = ${userId}
      ORDER BY p.created_at DESC
    `

    return NextResponse.json(projects)
  } catch (error) {
    console.error("Error fetching projects:", error)
    return NextResponse.json({ error: "Failed to fetch projects" }, { status: 500 })
  }
}
