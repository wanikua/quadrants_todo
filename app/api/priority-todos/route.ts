import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { requireAuth } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = user.id

    // Get top priority tasks from all user's projects
    // Priority score = urgency + importance (max 200)
    // Only get non-archived tasks
    const priorityTasks = await sql`
      SELECT
        t.id,
        t.description,
        t.urgency,
        t.importance,
        (t.urgency + t.importance) as priority_score,
        t.project_id,
        p.name as project_name,
        p.type as project_type
      FROM tasks t
      INNER JOIN projects p ON t.project_id = p.id
      WHERE
        (
          p.owner_id = ${userId}
          OR EXISTS (
            SELECT 1 FROM project_members pm
            WHERE pm.project_id = p.id AND pm.user_id = ${userId}
          )
        )
        AND t.archived = false
        AND p.archived = false
      ORDER BY priority_score DESC, t.created_at DESC
      LIMIT 5
    `

    return NextResponse.json(priorityTasks)
  } catch (error) {
    console.error("Error fetching priority todos:", error)
    return NextResponse.json({ error: "Failed to fetch priority todos" }, { status: 500 })
  }
}
