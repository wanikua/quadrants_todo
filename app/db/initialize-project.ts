'use server'

import { db } from './index'
import { players, projectMembers, projects } from './schema'
import { eq } from 'drizzle-orm'
import { getUserId } from '@/lib/auth'

export async function initializeProjectPlayers(projectId: string) {
  if (!db) {
    return { success: false, error: 'Database not available' }
  }

  try {
    // Check if players already exist
    const existingPlayers = await db.select().from(players).where(eq(players.project_id, projectId))

    if (existingPlayers.length > 0) {
      return { success: true, message: 'Players already exist' }
    }

    // Get project to check its type
    const projectList = await db.select().from(projects).where(eq(projects.id, projectId))
    if (projectList.length === 0) {
      return { success: false, error: 'Project not found' }
    }
    const project = projectList[0]

    // Get all project members
    const members = await db.select().from(projectMembers).where(eq(projectMembers.project_id, projectId))

    if (members.length === 0) {
      return { success: false, error: 'No project members found' }
    }

    // Assign colors to members
    const colors = [
      '#ef4444', '#f97316', '#eab308', '#22c55e',
      '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'
    ]

    // Create players for each member
    await db.insert(players).values(
      members.map((member: { id: string; project_id: string; user_id: string; role: string; joined_at: Date | null }, index: number) => ({
        project_id: projectId,
        user_id: member.user_id,
        name: `User ${member.user_id.substring(0, 8)}`, // Will be replaced with actual user name
        color: colors[index % colors.length],
      }))
    )

    return { success: true, message: 'Players initialized' }
  } catch (error) {
    console.error('Error initializing players:', error)
    return { success: false, error: 'Failed to initialize players' }
  }
}
