import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { db } from '@/app/db'
import { tasks, taskAssignments, players, taskPredictions, userTaskPreferences } from '@/app/db/schema'
import { eq, and, sql as drizzleSql } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

interface BulkTaskInput {
  description: string
  urgency: number
  importance: number
  assigneeNames: string[]
  predictedUrgency: number
  predictedImportance: number
}

/**
 * Bulk create tasks with AI learning
 * Creates multiple tasks and records predictions for learning
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!db) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 })
    }

    const body = await request.json()
    const { projectId, tasks: tasksToCreate } = body as {
      projectId: string
      tasks: BulkTaskInput[]
    }

    if (!projectId || !tasksToCreate || !Array.isArray(tasksToCreate)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    // Get all players for this project
    const projectPlayers = await db
      .select()
      .from(players)
      .where(eq(players.project_id, projectId))

    // Create a map of player names to IDs (case-insensitive)
    const playerNameToId = new Map<string, number>()
    projectPlayers.forEach((player: any) => {
      playerNameToId.set(player.name.toLowerCase(), player.id)
    })

    // Track all deltas for learning
    const allDeltas: Array<{ urgency: number; importance: number }> = []

    // Create tasks
    let createdCount = 0
    for (const taskInput of tasksToCreate) {
      try {
        // Create task with predicted values for learning
        const [newTask] = await db.insert(tasks).values({
          project_id: projectId,
          description: taskInput.description,
          urgency: taskInput.urgency,
          importance: taskInput.importance,
          predicted_urgency: taskInput.predictedUrgency,
          predicted_importance: taskInput.predictedImportance,
        }).returning()

        // Assign to players
        const assigneeIds: number[] = []
        for (const assigneeName of taskInput.assigneeNames) {
          const playerId = playerNameToId.get(assigneeName.toLowerCase())
          if (playerId) {
            assigneeIds.push(playerId)
          }
        }

        // If no valid assignees found, assign to current user's player
        if (assigneeIds.length === 0) {
          const userPlayer = projectPlayers.find((p: any) => p.user_id === user.id)
          if (userPlayer) {
            assigneeIds.push(userPlayer.id)
          }
        }

        // Create assignments
        if (assigneeIds.length > 0) {
          await db.insert(taskAssignments).values(
            assigneeIds.map(playerId => ({
              task_id: newTask.id,
              player_id: playerId,
            }))
          )
        }

        // Record prediction for learning
        const urgencyDelta = taskInput.urgency - taskInput.predictedUrgency
        const importanceDelta = taskInput.importance - taskInput.predictedImportance

        allDeltas.push({
          urgency: urgencyDelta,
          importance: importanceDelta
        })

        await db.insert(taskPredictions).values({
          user_id: user.id,
          project_id: projectId,
          task_description: taskInput.description,
          predicted_urgency: taskInput.predictedUrgency,
          predicted_importance: taskInput.predictedImportance,
          final_urgency: taskInput.urgency,
          final_importance: taskInput.importance,
          adjustment_delta: {
            urgency_delta: urgencyDelta,
            importance_delta: importanceDelta
          }
        })

        createdCount++
      } catch (error) {
        console.error('Failed to create task:', taskInput.description, error)
        // Continue with other tasks
      }
    }

    // Update user preferences based on adjustments
    if (allDeltas.length > 0) {
      await updateUserPreferences(user.id, allDeltas)
    }

    revalidatePath(`/projects/${projectId}`)

    return NextResponse.json({
      success: true,
      created: createdCount,
      total: tasksToCreate.length
    })
  } catch (error) {
    console.error('Bulk create error:', error)
    return NextResponse.json(
      { error: 'Failed to create tasks' },
      { status: 500 }
    )
  }
}

/**
 * Update user's task preferences based on historical adjustments
 * Calculates average bias to improve future predictions
 */
async function updateUserPreferences(
  userId: string,
  newDeltas: Array<{ urgency: number; importance: number }>
) {
  if (!db) return

  try {
    // Calculate average deltas from new data
    const avgUrgencyDelta = newDeltas.reduce((sum, d) => sum + d.urgency, 0) / newDeltas.length
    const avgImportanceDelta = newDeltas.reduce((sum, d) => sum + d.importance, 0) / newDeltas.length

    // Get existing preferences
    const [existing] = await db
      .select()
      .from(userTaskPreferences)
      .where(eq(userTaskPreferences.user_id, userId))

    if (existing) {
      // Update with exponential moving average (weight new data 30%)
      const newUrgencyBias = existing.avg_urgency_bias! * 0.7 + avgUrgencyDelta * 0.3
      const newImportanceBias = existing.avg_importance_bias! * 0.7 + avgImportanceDelta * 0.3

      await db
        .update(userTaskPreferences)
        .set({
          avg_urgency_bias: newUrgencyBias,
          avg_importance_bias: newImportanceBias,
          updated_at: new Date()
        })
        .where(eq(userTaskPreferences.user_id, userId))
    } else {
      // Create new preferences
      await db.insert(userTaskPreferences).values({
        user_id: userId,
        avg_urgency_bias: avgUrgencyDelta,
        avg_importance_bias: avgImportanceDelta,
      })
    }

    console.log(`Updated user preferences for ${userId}:`, {
      urgencyBias: avgUrgencyDelta,
      importanceBias: avgImportanceDelta
    })
  } catch (error) {
    console.error('Failed to update user preferences:', error)
    // Non-critical error, don't throw
  }
}
