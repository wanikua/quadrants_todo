import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

/**
 * GET /api/projects/[projectId]/sync
 * Returns all project data for real-time sync
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params

    // Get all tasks with their assignees
    const tasksRaw = await sql`
      SELECT
        t.*,
        COALESCE(
          json_agg(
            json_build_object(
              'id', p.id,
              'name', p.name,
              'color', p.color
            )
          ) FILTER (WHERE p.id IS NOT NULL),
          '[]'
        ) as assignees
      FROM tasks t
      LEFT JOIN task_assignments ta ON t.id = ta.task_id
      LEFT JOIN players p ON ta.player_id = p.id
      WHERE t.project_id = ${projectId}
      GROUP BY t.id
      ORDER BY t.created_at DESC
    `

    // Parse assignees JSON if it's a string
    const tasks = tasksRaw.map((task: any) => ({
      ...task,
      assignees: typeof task.assignees === 'string'
        ? JSON.parse(task.assignees)
        : task.assignees
    }))

    // Get all players
    const players = await sql`
      SELECT * FROM players
      WHERE project_id = ${projectId}
      ORDER BY created_at ASC
    `

    // Get all lines
    const lines = await sql`
      SELECT * FROM task_lines
      WHERE project_id = ${projectId}
      ORDER BY created_at ASC
    `

    // Get project info
    const projectInfo = await sql`
      SELECT id, name, description, type, owner_id, created_at, updated_at
      FROM projects
      WHERE id = ${projectId}
      LIMIT 1
    `

    return NextResponse.json({
      success: true,
      data: {
        tasks,
        players,
        lines,
        project: projectInfo[0] || null,
        timestamp: new Date().toISOString()
      }
    })
  } catch (error: any) {
    console.error('Sync API error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
