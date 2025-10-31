import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { db } from '@/app/db'
import { tasks, taskPredictions, userTaskPreferences } from '@/app/db/schema'
import { eq } from 'drizzle-orm'

/**
 * Record learning data when user adjusts task priority via drag & drop
 * This helps AI learn user's preferences over time
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { taskId, newUrgency, newImportance } = body as {
      taskId: number
      newUrgency: number
      newImportance: number
    }

    if (!taskId || newUrgency === undefined || newImportance === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Get the task with its predicted values
    const [task] = await db
      .select()
      .from(tasks)
      .where(eq(tasks.id, taskId))

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    // Only record if we have predicted values (task was created with AI)
    if (task.predicted_urgency !== null && task.predicted_importance !== null) {
      const urgencyDelta = newUrgency - task.predicted_urgency
      const importanceDelta = newImportance - task.predicted_importance

      // Only record if there's a meaningful change (at least 5 points)
      if (Math.abs(urgencyDelta) >= 5 || Math.abs(importanceDelta) >= 5) {
        // Record the adjustment for learning
        await db.insert(taskPredictions).values({
          user_id: user.id,
          project_id: task.project_id,
          task_description: task.description,
          predicted_urgency: task.predicted_urgency,
          predicted_importance: task.predicted_importance,
          final_urgency: newUrgency,
          final_importance: newImportance,
          adjustment_delta: {
            urgency_delta: urgencyDelta,
            importance_delta: importanceDelta,
            adjustment_type: 'drag_drop'
          }
        })

        // Update user preferences
        await updateUserPreferences(user.id, [{
          urgency: urgencyDelta,
          importance: importanceDelta
        }])

        console.log(`📚 Learned from drag adjustment: task ${taskId}, urgency Δ${urgencyDelta}, importance Δ${importanceDelta}`)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Learn from adjustment error:', error)
    return NextResponse.json(
      { error: 'Failed to record learning data' },
      { status: 500 }
    )
  }
}

/**
 * Update user's task preferences using exponential moving average
 */
async function updateUserPreferences(
  userId: string,
  newDeltas: Array<{ urgency: number; importance: number }>
) {
  if (!db) return

  try {
    const avgUrgencyDelta = newDeltas.reduce((sum, d) => sum + d.urgency, 0) / newDeltas.length
    const avgImportanceDelta = newDeltas.reduce((sum, d) => sum + d.importance, 0) / newDeltas.length

    const [existing] = await db
      .select()
      .from(userTaskPreferences)
      .where(eq(userTaskPreferences.user_id, userId))

    if (existing) {
      // Use exponential moving average: 70% old + 30% new
      const newUrgencyBias = existing.avg_urgency_bias * 0.7 + avgUrgencyDelta * 0.3
      const newImportanceBias = existing.avg_importance_bias * 0.7 + avgImportanceDelta * 0.3

      await db
        .update(userTaskPreferences)
        .set({
          avg_urgency_bias: newUrgencyBias,
          avg_importance_bias: newImportanceBias,
          updated_at: new Date()
        })
        .where(eq(userTaskPreferences.user_id, userId))

      console.log(`Updated user preferences for ${userId}:`, {
        urgencyBias: newUrgencyBias.toFixed(2),
        importanceBias: newImportanceBias.toFixed(2)
      })
    } else {
      // Create new preference record
      await db.insert(userTaskPreferences).values({
        user_id: userId,
        avg_urgency_bias: avgUrgencyDelta,
        avg_importance_bias: avgImportanceDelta,
        keyword_patterns: {}
      })
    }
  } catch (error) {
    console.error('Failed to update user preferences:', error)
  }
}
