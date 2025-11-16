import { NextRequest, NextResponse } from 'next/server'
import { updateUserActivity } from '@/app/db/actions'

/**
 * POST /api/projects/[projectId]/activity
 * Update user's last seen timestamp for real-time collaboration
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params

    const result = await updateUserActivity(projectId)

    if (!result.success) {
      return NextResponse.json(
        { error: 'Failed to update activity' },
        { status: 401 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Activity update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
