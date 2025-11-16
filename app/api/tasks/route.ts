import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/app/db'
import { tasks, taskAssignments } from '@/app/db/schema'
import { getUserId } from '@/lib/auth'
import { eq } from 'drizzle-orm'

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId()
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await request.json()
    const { projectId, description, urgency, importance, assigneeIds } = body

    if (!projectId || !description || urgency === undefined || importance === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Create task
    const [task] = await db.insert(tasks).values({
      project_id: projectId,
      description,
      urgency,
      importance,
      predicted_urgency: urgency,
      predicted_importance: importance,
    }).returning()

    // Add task assignments if provided
    if (assigneeIds && Array.isArray(assigneeIds) && assigneeIds.length > 0) {
      await db.insert(taskAssignments).values(
        assigneeIds.map((playerId: number) => ({
          task_id: task.id,
          player_id: playerId,
        }))
      )
    }

    return NextResponse.json(task)
  } catch (error) {
    console.error('Create task error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create task' },
      { status: 500 }
    )
  }
}
