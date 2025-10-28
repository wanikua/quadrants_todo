'use server'

import { db } from './index'
import { projects, projectMembers, tasks, players, taskAssignments, lines, comments } from './schema'
import { eq, and, desc } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { getUserId } from '@/lib/auth'

// Fallback data for when database is not available
const fallbackProject = {
  id: 'demo',
  name: 'Demo Project',
  type: 'personal' as const,
  owner_id: 'demo-user',
  invite_code: null,
  created_at: new Date(),
}

const fallbackTasks = [
  {
    id: 1,
    project_id: 'demo',
    description: 'Complete project documentation',
    urgency: 80,
    importance: 90,
    created_at: new Date(),
    updated_at: new Date(),
    assignees: []
  },
  {
    id: 2,
    project_id: 'demo',
    description: 'Review code changes',
    urgency: 60,
    importance: 70,
    created_at: new Date(),
    updated_at: new Date(),
    assignees: []
  }
]

const fallbackPlayers = [
  {
    id: 1,
    project_id: 'demo',
    name: 'Demo User',
    color: '#3b82f6',
    created_at: new Date()
  }
]

// Project actions
export async function createProject(name: string, type: 'personal' | 'team') {
  const userId = await getUserId()
  if (!userId) return { success: false, error: 'Not authenticated' }

  if (!db) {
    return { success: false, error: 'Database not available' }
  }

  try {
    // Get user's actual name
    const { getUser } = await import('@/lib/auth')
    const user = await getUser()
    const userName = user?.name || 'User'

    const projectId = `proj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    // Generate 8-character alphanumeric invite code
    const inviteCode = type === 'team'
      ? Math.random().toString(36).substring(2, 10).toUpperCase()
      : null

    // Create project
    await db.insert(projects).values({
      id: projectId,
      name,
      type,
      owner_id: userId,
      invite_code: inviteCode,
    })

    // Add owner as member
    await db.insert(projectMembers).values({
      id: `member_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      project_id: projectId,
      user_id: userId,
      role: 'owner',
    })

    // Initialize project database with RLS
    const { initializeProjectDatabase } = await import('@/lib/db-optimized')
    await initializeProjectDatabase(projectId, userId)

    // Create player for owner using actual user name
    await db.insert(players).values({
      project_id: projectId,
      user_id: userId,
      name: userName,
      color: '#3b82f6',
    })

    revalidatePath('/projects')
    return { success: true, projectId, inviteCode }
  } catch (error) {
    console.error('Error creating project:', error)
    return { success: false, error: 'Failed to create project' }
  }
}

export async function joinProject(inviteCode: string) {
  const userId = await getUserId()
  if (!userId) return { success: false, error: 'Not authenticated' }

  if (!db) {
    return { success: false, error: 'Database not available' }
  }

  try {
    // Get user's actual name
    const { getUser } = await import('@/lib/auth')
    const user = await getUser()
    const userName = user?.name || 'User'

    // Find project by invite code
    const projectList = await db
      .select({ id: projects.id, name: projects.name })
      .from(projects)
      .where(and(eq(projects.invite_code, inviteCode), eq(projects.type, 'team')))

    if (projectList.length === 0) {
      return { success: false, error: 'Invalid invite code' }
    }

    const project = projectList[0]

    // Check if user is already a member
    const existingMember = await db
      .select()
      .from(projectMembers)
      .where(and(eq(projectMembers.project_id, project.id), eq(projectMembers.user_id, userId)))

    if (existingMember.length > 0) {
      return { success: false, error: 'You are already a member of this project' }
    }

    // Add user as member
    await db.insert(projectMembers).values({
      id: `member_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      project_id: project.id,
      user_id: userId,
      role: 'member',
    })

    // Create player for the new member using actual user name
    const existingPlayers = await db.select().from(players).where(eq(players.project_id, project.id))
    const colors = [
      '#ef4444', '#f97316', '#eab308', '#22c55e',
      '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'
    ]
    const colorIndex = existingPlayers.length % colors.length

    await db.insert(players).values({
      project_id: project.id,
      user_id: userId,
      name: userName,
      color: colors[colorIndex],
    })

    revalidatePath('/projects')
    return { success: true, projectId: project.id, projectName: project.name }
  } catch (error) {
    console.error('Error joining project:', error)
    return { success: false, error: 'Failed to join project' }
  }
}

export async function getProjectMemberCount(projectId: string) {
  if (!db) {
    return 1
  }

  try {
    const members = await db
      .select()
      .from(projectMembers)
      .where(eq(projectMembers.project_id, projectId))

    return members.length
  } catch (error) {
    console.error('Error getting member count:', error)
    return 1
  }
}

export async function getProjectsForUser(userId: string) {
  if (!db) {
    console.warn('Database not available, returning demo project')
    return [fallbackProject]
  }

  try {
    const projectsList = await db
      .select({
        id: projects.id,
        name: projects.name,
        type: projects.type,
        role: projectMembers.role,
        created_at: projects.created_at,
      })
      .from(projects)
      .innerJoin(projectMembers, eq(projects.id, projectMembers.project_id))
      .where(eq(projectMembers.user_id, userId))
      .orderBy(desc(projects.created_at))

    return projectsList
  } catch (error) {
    console.error('Error getting projects:', error)
    return [fallbackProject]
  }
}

// Task actions
export async function createTask(projectId: string, description: string, urgency: number, importance: number, assigneeIds: number[]) {
  const userId = await getUserId()
  if (!userId) return { success: false, error: 'Not authenticated' }

  if (!db) {
    return { success: false, error: 'Database not available' }
  }

  try {
    // Check if user has access to project
    const hasAccess = await getUserProjectAccess(userId, projectId)
    if (!hasAccess) return { success: false, error: 'Access denied' }

    // Get project to check its type
    const projectList = await db.select().from(projects).where(eq(projects.id, projectId))
    if (projectList.length === 0) return { success: false, error: 'Project not found' }

    const project = projectList[0]

    // Create task
    const [task] = await db.insert(tasks).values({
      project_id: projectId,
      description,
      urgency,
      importance,
    }).returning()

    // For personal projects, assign to first player by default
    // For team projects, assign to selected players or current user if none selected
    if (project.type === 'personal') {
      // Get first player from project
      const projectPlayers = await db.select().from(players).where(eq(players.project_id, projectId)).limit(1)
      if (projectPlayers.length > 0) {
        await db.insert(taskAssignments).values({
          task_id: task.id,
          player_id: projectPlayers[0].id,
        })
      }
    } else {
      // For team projects
      if (assigneeIds.length > 0) {
        // Assign to selected players
        await db.insert(taskAssignments).values(
          assigneeIds.map(playerId => ({
            task_id: task.id,
            player_id: playerId,
          }))
        )
      } else {
        // No assignees selected, assign to current user's player by default
        const currentUserPlayer = await db
          .select()
          .from(players)
          .where(and(eq(players.project_id, projectId), eq(players.user_id, userId)))
          .limit(1)

        if (currentUserPlayer.length > 0) {
          await db.insert(taskAssignments).values({
            task_id: task.id,
            player_id: currentUserPlayer[0].id,
          })
        }
      }
    }

    revalidatePath(`/projects/${projectId}`)
    return { success: true, task }
  } catch (error) {
    console.error('Error creating task:', error)
    return { success: false, error: 'Failed to create task' }
  }
}

export async function updateTask(taskId: number, urgency: number, importance: number) {
  const userId = await getUserId()
  if (!userId) return { success: false, error: 'Not authenticated' }

  if (!db) {
    return { success: false, error: 'Database not available' }
  }

  try {
    // Get task to check project access
    const taskList = await db.select({ project_id: tasks.project_id }).from(tasks).where(eq(tasks.id, taskId))
    if (taskList.length === 0) return { success: false, error: 'Task not found' }

    const hasAccess = await getUserProjectAccess(userId, taskList[0].project_id)
    if (!hasAccess) return { success: false, error: 'Access denied' }

    await db.update(tasks).set({ urgency, importance, updated_at: new Date() }).where(eq(tasks.id, taskId))
    revalidatePath(`/projects/${taskList[0].project_id}`)
    return { success: true }
  } catch (error) {
    console.error('Error updating task:', error)
    return { success: false, error: 'Failed to update task' }
  }
}

export async function deleteTask(taskId: number) {
  const userId = await getUserId()
  if (!userId) return { success: false, error: 'Not authenticated' }

  if (!db) {
    return { success: false, error: 'Database not available' }
  }

  try {
    // Get task to check project access
    const taskList = await db.select({ project_id: tasks.project_id }).from(tasks).where(eq(tasks.id, taskId))
    if (taskList.length === 0) return { success: false, error: 'Task not found' }

    const hasAccess = await getUserProjectAccess(userId, taskList[0].project_id)
    if (!hasAccess) return { success: false, error: 'Access denied' }

    await db.delete(tasks).where(eq(tasks.id, taskId))
    revalidatePath(`/projects/${taskList[0].project_id}`)
    return { success: true }
  } catch (error) {
    console.error('Error deleting task:', error)
    return { success: false, error: 'Failed to delete task' }
  }
}

export async function completeTask(taskId: number) {
  // Complete task has the same effect as delete - remove from map
  return await deleteTask(taskId)
}

// Player actions
export async function createPlayer(projectId: string, name: string, color: string) {
  const userId = await getUserId()
  if (!userId) return { success: false, error: 'Not authenticated' }

  if (!db) {
    return { success: false, error: 'Database not available' }
  }

  try {
    // Check project access
    const hasAccess = await getUserProjectAccess(userId, projectId)
    if (!hasAccess) return { success: false, error: 'Access denied' }

    // Create the player
    const result = await db.insert(players).values({
      project_id: projectId,
      user_id: userId,
      name,
      color,
    }).returning()

    revalidatePath(`/projects/${projectId}`)
    return { success: true, player: result[0] }
  } catch (error) {
    console.error('Error creating player:', error)
    return { success: false, error: 'Failed to create player' }
  }
}

export async function deletePlayer(playerId: number) {
  const userId = await getUserId()
  if (!userId) return { success: false, error: 'Not authenticated' }

  if (!db) {
    return { success: false, error: 'Database not available' }
  }

  try {
    // Get player to check project access
    const playerList = await db.select().from(players).where(eq(players.id, playerId))
    if (playerList.length === 0) return { success: false, error: 'Player not found' }

    const player = playerList[0]
    const hasAccess = await getUserProjectAccess(userId, player.project_id)
    if (!hasAccess) return { success: false, error: 'Access denied' }

    // Delete player (task assignments will be deleted automatically due to cascade)
    await db.delete(players).where(eq(players.id, playerId))

    revalidatePath(`/projects/${player.project_id}`)
    return { success: true }
  } catch (error) {
    console.error('Error deleting player:', error)
    return { success: false, error: 'Failed to delete player' }
  }
}

export async function updatePlayer(playerId: number, name: string, color: string) {
  const userId = await getUserId()
  if (!userId) return { success: false, error: 'Not authenticated' }

  if (!db) {
    return { success: false, error: 'Database not available' }
  }

  try {
    // Get player to check if it belongs to the user
    const playerList = await db.select().from(players).where(eq(players.id, playerId))
    if (playerList.length === 0) return { success: false, error: 'Player not found' }

    const player = playerList[0]
    if (player.user_id !== userId) {
      return { success: false, error: 'You can only update your own player info' }
    }

    await db.update(players).set({ name, color }).where(eq(players.id, playerId))

    revalidatePath(`/projects/${player.project_id}`)
    return { success: true }
  } catch (error) {
    console.error('Error updating player:', error)
    return { success: false, error: 'Failed to update player' }
  }
}

// Fix auto-generated player names - updates all players with "User xxx" names to actual user names
export async function fixPlayerNames() {
  const userId = await getUserId()
  if (!userId) return { success: false, error: 'Not authenticated' }

  if (!db) {
    return { success: false, error: 'Database not available' }
  }

  try {
    // Get user's actual name
    const { getUser } = await import('@/lib/auth')
    const user = await getUser()
    const userName = user?.name || 'User'

    // Find all players belonging to this user with auto-generated names (starting with "User ")
    const userPlayers = await db
      .select()
      .from(players)
      .where(eq(players.user_id, userId))

    let updatedCount = 0
    for (const player of userPlayers) {
      // Check if name matches auto-generated pattern: "User " followed by characters
      if (player.name.startsWith('User ')) {
        await db.update(players).set({ name: userName }).where(eq(players.id, player.id))
        updatedCount++
        revalidatePath(`/projects/${player.project_id}`)
      }
    }

    return { success: true, updatedCount }
  } catch (error) {
    console.error('Error fixing player names:', error)
    return { success: false, error: 'Failed to fix player names' }
  }
}

// Helper functions
export async function getUserProjectAccess(userId: string, projectId: string): Promise<boolean> {
  if (!db) {
    console.warn('Database not available, allowing access')
    return true
  }

  try {
    // Check if user is the owner
    const ownedProjects = await db
      .select()
      .from(projects)
      .where(and(eq(projects.id, projectId), eq(projects.owner_id, userId)))

    if (ownedProjects.length > 0) {
      return true
    }

    // Check if user is a member
    const members = await db
      .select()
      .from(projectMembers)
      .where(and(eq(projectMembers.project_id, projectId), eq(projectMembers.user_id, userId)))

    return members.length > 0
  } catch (error) {
    console.error('Error checking project access:', error)
    return false
  }
}

export async function getProjectWithData(projectId: string) {
  if (!db) {
    console.warn('Database not available, using fallback data')
    return {
      project: fallbackProject,
      tasks: fallbackTasks,
      players: fallbackPlayers,
      lines: []
    }
  }

  try {
    // Get project
    const projectList = await db.select().from(projects).where(eq(projects.id, projectId))
    if (projectList.length === 0) return null

    const project = projectList[0]

    // Get tasks with assignments
    const tasksWithAssignments = await db
      .select({
        id: tasks.id,
        description: tasks.description,
        urgency: tasks.urgency,
        importance: tasks.importance,
        created_at: tasks.created_at,
        updated_at: tasks.updated_at,
        player: {
          id: players.id,
          name: players.name,
          color: players.color,
        },
      })
      .from(tasks)
      .leftJoin(taskAssignments, eq(tasks.id, taskAssignments.task_id))
      .leftJoin(players, eq(taskAssignments.player_id, players.id))
      .where(eq(tasks.project_id, projectId))

    // Group tasks by ID and collect assignees
    const tasksMap = new Map()
    for (const row of tasksWithAssignments) {
      if (!tasksMap.has(row.id)) {
        tasksMap.set(row.id, {
          id: row.id,
          description: row.description,
          urgency: row.urgency,
          importance: row.importance,
          created_at: row.created_at,
          updated_at: row.updated_at,
          assignees: [],
          comments: [],
        })
      }
      if (row.player?.id) {
        tasksMap.get(row.id).assignees.push(row.player)
      }
    }

    // Get players
    const playersData = await db.select().from(players).where(eq(players.project_id, projectId))

    // Get lines
    const linesData = await db.select().from(lines).where(eq(lines.project_id, projectId))

    return {
      project,
      tasks: Array.from(tasksMap.values()),
      players: playersData,
      lines: linesData,
    }
  } catch (error) {
    console.error('Error getting project data:', error)
    return {
      project: fallbackProject,
      tasks: fallbackTasks,
      players: fallbackPlayers,
      lines: []
    }
  }
}

// Line actions
export async function createLine(projectId: string, fromTaskId: number, toTaskId: number) {
  const userId = await getUserId()
  if (!userId) return { success: false, error: 'Not authenticated' }

  if (!db) {
    return { success: false, error: 'Database not available' }
  }

  try {
    const hasAccess = await getUserProjectAccess(userId, projectId)
    if (!hasAccess) return { success: false, error: 'Access denied' }

    const [line] = await db.insert(lines).values({
      project_id: projectId,
      from_task_id: fromTaskId,
      to_task_id: toTaskId,
      style: 'filled',
    }).returning()

    revalidatePath(`/projects/${projectId}`)
    return { success: true, line }
  } catch (error) {
    console.error('Error creating line:', error)
    return { success: false, error: 'Failed to create line' }
  }
}

export async function deleteLine(lineId: number) {
  const userId = await getUserId()
  if (!userId) return { success: false, error: 'Not authenticated' }

  if (!db) {
    return { success: false, error: 'Database not available' }
  }

  try {
    // Get line to check project access
    const lineList = await db.select({ project_id: lines.project_id }).from(lines).where(eq(lines.id, lineId))
    if (lineList.length === 0) return { success: false, error: 'Line not found' }

    const hasAccess = await getUserProjectAccess(userId, lineList[0].project_id)
    if (!hasAccess) return { success: false, error: 'Access denied' }

    await db.delete(lines).where(eq(lines.id, lineId))
    revalidatePath(`/projects/${lineList[0].project_id}`)
    return { success: true }
  } catch (error) {
    console.error('Error deleting line:', error)
    return { success: false, error: 'Failed to delete line' }
  }
}

export async function toggleLine(projectId: string, fromTaskId: number, toTaskId: number) {
  const userId = await getUserId()
  if (!userId) return { success: false, error: 'Not authenticated' }

  if (!db) {
    return { success: false, error: 'Database not available' }
  }

  try {
    const hasAccess = await getUserProjectAccess(userId, projectId)
    if (!hasAccess) return { success: false, error: 'Access denied' }

    // Check if line exists
    const existingLines = await db.select().from(lines).where(
      and(
        eq(lines.project_id, projectId),
        eq(lines.from_task_id, fromTaskId),
        eq(lines.to_task_id, toTaskId)
      )
    )

    if (existingLines.length > 0) {
      // Delete existing line
      await db.delete(lines).where(eq(lines.id, existingLines[0].id))
      revalidatePath(`/projects/${projectId}`)
      return { success: true, action: 'deleted', lineId: existingLines[0].id }
    } else {
      // Create new line
      const [line] = await db.insert(lines).values({
        project_id: projectId,
        from_task_id: fromTaskId,
        to_task_id: toTaskId,
        style: 'filled',
      }).returning()

      revalidatePath(`/projects/${projectId}`)
      return { success: true, action: 'created', line }
    }
  } catch (error) {
    console.error('Error toggling line:', error)
    return { success: false, error: 'Failed to toggle line' }
  }
}
