import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/app/db'
import { tasks } from '@/app/db/schema'
import { getUserId } from '@/lib/auth'
import { eq } from 'drizzle-orm'

export async function POST(
  request: NextRequest,
  { params }: { params: { taskId: string } }
) {
  try {
    const userId = await getUserId()
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const taskId = parseInt(params.taskId)
    if (isNaN(taskId)) {
      return NextResponse.json({ error: 'Invalid task ID' }, { status: 400 })
    }

    // Archive the task
    await db.update(tasks)
      .set({ archived: true })
      .where(eq(tasks.id, taskId))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Complete task error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to complete task' },
      { status: 500 }
    )
  }
}
