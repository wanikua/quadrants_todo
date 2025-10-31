import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'
import { currentUser } from '@clerk/nextjs/server'

const sql = neon(process.env.DATABASE_URL!)

/**
 * DELETE /api/projects/[projectId]/members/[userId]
 * Remove a member from the project (admin/owner only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; userId: string }> }
) {
  try {
    const { projectId, userId: targetUserId } = await params
    const user = await currentUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const currentUserId = user.id

    // Prevent removing yourself
    if (currentUserId === targetUserId) {
      return NextResponse.json(
        { success: false, error: 'You cannot remove yourself from the project. Use "Leave Project" instead.' },
        { status: 403 }
      )
    }

    // Check if current user is owner or admin
    const membership = await sql`
      SELECT role FROM project_members
      WHERE project_id = ${projectId} AND user_id = ${currentUserId}
    `

    if (membership.length === 0) {
      return NextResponse.json(
        { success: false, error: 'You are not a member of this project' },
        { status: 403 }
      )
    }

    const userRole = membership[0].role
    if (userRole !== 'owner' && userRole !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Only owners and admins can remove members' },
        { status: 403 }
      )
    }

    // Check if target user exists in project
    const targetMembership = await sql`
      SELECT role, user_id FROM project_members
      WHERE project_id = ${projectId} AND user_id = ${targetUserId}
    `

    if (targetMembership.length === 0) {
      return NextResponse.json(
        { success: false, error: 'User is not a member of this project' },
        { status: 404 }
      )
    }

    // Prevent removing the owner
    const project = await sql`
      SELECT owner_id FROM projects WHERE id = ${projectId}
    `

    if (project[0]?.owner_id === targetUserId) {
      return NextResponse.json(
        { success: false, error: 'Cannot remove the project owner' },
        { status: 403 }
      )
    }

    // Prevent non-owners from removing admins
    if (userRole !== 'owner' && targetMembership[0].role === 'admin') {
      return NextResponse.json(
        { success: false, error: 'Only the owner can remove admins' },
        { status: 403 }
      )
    }

    // Remove all task assignments for this user's players in this project
    await sql`
      DELETE FROM task_assignments
      WHERE player_id IN (
        SELECT id FROM players
        WHERE project_id = ${projectId} AND user_id = ${targetUserId}
      )
    `

    // Delete user's players in this project
    await sql`
      DELETE FROM players
      WHERE project_id = ${projectId} AND user_id = ${targetUserId}
    `

    // Remove from project members
    await sql`
      DELETE FROM project_members
      WHERE project_id = ${projectId} AND user_id = ${targetUserId}
    `

    return NextResponse.json({
      success: true,
      message: 'Member removed successfully'
    })
  } catch (error: any) {
    console.error('Remove member error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
