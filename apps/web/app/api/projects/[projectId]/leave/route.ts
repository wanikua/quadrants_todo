import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'
import { currentUser } from '@clerk/nextjs/server'

const sql = neon(process.env.DATABASE_URL!)

/**
 * POST /api/projects/[projectId]/leave
 * Leave a project (remove yourself from project members)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params
    const user = await currentUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userId = user.id

    // Check if user is a member
    const membership = await sql`
      SELECT role FROM project_members
      WHERE project_id = ${projectId} AND user_id = ${userId}
    `

    if (membership.length === 0) {
      return NextResponse.json(
        { success: false, error: 'You are not a member of this project' },
        { status: 403 }
      )
    }

    // Check if user is the owner
    const project = await sql`
      SELECT owner_id FROM projects WHERE id = ${projectId}
    `

    if (project.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      )
    }

    if (project[0].owner_id === userId) {
      return NextResponse.json(
        { success: false, error: 'Project owner cannot leave. Please transfer ownership or delete the project.' },
        { status: 403 }
      )
    }

    // Remove all task assignments for this user's players in this project
    await sql`
      DELETE FROM task_assignments
      WHERE player_id IN (
        SELECT id FROM players
        WHERE project_id = ${projectId} AND user_id = ${userId}
      )
    `

    // Delete user's players in this project
    await sql`
      DELETE FROM players
      WHERE project_id = ${projectId} AND user_id = ${userId}
    `

    // Remove from project members
    await sql`
      DELETE FROM project_members
      WHERE project_id = ${projectId} AND user_id = ${userId}
    `

    return NextResponse.json({
      success: true,
      message: 'Successfully left the project'
    })
  } catch (error: any) {
    console.error('Leave project error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
