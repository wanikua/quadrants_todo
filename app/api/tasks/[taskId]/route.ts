import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/app/db'
import { tasks, taskAssignments } from '@/app/db/schema'
import { getUserId } from '@/lib/auth'
import { eq } from 'drizzle-orm'

export async function PATCH(
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

    const body = await request.json()
    const { description, urgency, importance, assigneeIds } = body

    // Build update object
    const updates: any = {}
    if (description !== undefined) updates.description = description
    if (urgency !== undefined) updates.urgency = urgency
    if (importance !== undefined) updates.importance = importance

    // Update task
    const [updatedTask] = await db.update(tasks)
      .set(updates)
      .where(eq(tasks.id, taskId))
      .returning()

    if (!updatedTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    // Update task assignments if provided
    if (assigneeIds !== undefined && Array.isArray(assigneeIds)) {
      // Delete existing assignments
      await db.delete(taskAssignments).where(eq(taskAssignments.task_id, taskId))

      // Add new assignments
      if (assigneeIds.length > 0) {
        await db.insert(taskAssignments).values(
          assigneeIds.map((playerId: number) => ({
            task_id: taskId,
            player_id: playerId,
          }))
        )
      }
    }

    return NextResponse.json(updatedTask)
  } catch (error) {
    console.error('Update task error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update task' },
      { status: 500 }
    )
  }
}

export async function DELETE(
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

    // Delete task (cascades to task_assignments via database)
    await db.delete(tasks).where(eq(tasks.id, taskId))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete task error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete task' },
      { status: 500 }
    )
  }
}
