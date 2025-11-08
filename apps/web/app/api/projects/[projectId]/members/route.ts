import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'
import { currentUser } from '@clerk/nextjs/server'

const sql = neon(process.env.DATABASE_URL!)

/**
 * GET /api/projects/[projectId]/members
 * Get all members of a project
 */
export async function GET(
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

    // Check if user is a member
    const membership = await sql`
      SELECT role FROM project_members
      WHERE project_id = ${projectId} AND user_id = ${user.id}
    `

    if (membership.length === 0) {
      return NextResponse.json(
        { success: false, error: 'You are not a member of this project' },
        { status: 403 }
      )
    }

    // Get all members with their user info
    const members = await sql`
      SELECT
        pm.user_id,
        pm.role,
        pm.joined_at,
        u.name,
        u.email
      FROM project_members pm
      JOIN users u ON pm.user_id = u.id
      WHERE pm.project_id = ${projectId}
      ORDER BY
        CASE pm.role
          WHEN 'owner' THEN 1
          WHEN 'admin' THEN 2
          ELSE 3
        END,
        pm.joined_at ASC
    `

    return NextResponse.json({
      success: true,
      members: members,
      currentUserRole: membership[0].role
    })
  } catch (error: any) {
    console.error('Get members error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
