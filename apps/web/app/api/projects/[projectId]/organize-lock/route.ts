import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

/**
 * Distributed lock for organize operations
 * Ensures only one user can organize tasks at a time
 */

// POST: Acquire lock
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params
    const { userId, userName } = await request.json()

    // Try to acquire lock
    // Lock expires after 60 seconds automatically
    const lockExpiry = new Date(Date.now() + 60000).toISOString()

    // Check if there's an existing valid lock
    const existingLock = await sql`
      SELECT * FROM organize_locks
      WHERE project_id = ${projectId}
        AND expires_at > NOW()
      LIMIT 1
    `

    if (existingLock.length > 0) {
      const lock = existingLock[0]
      return NextResponse.json({
        success: false,
        locked: true,
        lockedBy: lock.user_name,
        message: `${lock.user_name} is currently organizing tasks`
      })
    }

    // Acquire lock
    await sql`
      INSERT INTO organize_locks (project_id, user_id, user_name, expires_at)
      VALUES (${projectId}, ${userId}, ${userName}, ${lockExpiry})
      ON CONFLICT (project_id)
      DO UPDATE SET
        user_id = ${userId},
        user_name = ${userName},
        expires_at = ${lockExpiry},
        created_at = NOW()
    `

    return NextResponse.json({
      success: true,
      locked: false,
      message: 'Lock acquired'
    })
  } catch (error: any) {
    console.error('Lock acquire error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// DELETE: Release lock
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params

    await sql`
      DELETE FROM organize_locks
      WHERE project_id = ${projectId}
    `

    return NextResponse.json({
      success: true,
      message: 'Lock released'
    })
  } catch (error: any) {
    console.error('Lock release error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// GET: Check lock status
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params

    const existingLock = await sql`
      SELECT * FROM organize_locks
      WHERE project_id = ${projectId}
        AND expires_at > NOW()
      LIMIT 1
    `

    if (existingLock.length > 0) {
      const lock = existingLock[0]
      return NextResponse.json({
        locked: true,
        lockedBy: lock.user_name,
        expiresAt: lock.expires_at
      })
    }

    return NextResponse.json({
      locked: false
    })
  } catch (error: any) {
    console.error('Lock check error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
