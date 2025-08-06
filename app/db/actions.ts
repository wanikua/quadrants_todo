import { db, sql } from './index'
import { projects, tasks, players, comments, lines, projectAccess } from './schema'
import { eq, and } from 'drizzle-orm'
import { auth } from '@clerk/nextjs/server'

// Fallback data for when database is not available
const fallbackProject = {
  id: 'demo',
  name: 'Demo Project',
  type: 'personal' as const,
  ownerId: 'demo-user',
  accessCode: null,
  createdAt: new Date(),
  updatedAt: new Date()
}

const fallbackTasks = [
  {
    id: '1',
    projectId: 'demo',
    description: 'Complete project documentation',
    urgency: 80,
    importance: 90,
    completed: false,
    assignedTo: null,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '2',
    projectId: 'demo',
    description: 'Review code changes',
    urgency: 60,
    importance: 70,
    completed: false,
    assignedTo: null,
    createdAt: new Date(),
    updatedAt: new Date()
  }
]

const fallbackPlayers = [
  {
    id: '1',
    projectId: 'demo',
    name: 'Demo User',
    color: '#3b82f6',
    createdAt: new Date(),
    updatedAt: new Date()
  }
]

export async function getProjectWithData(projectId: string) {
  if (!db || !sql) {
    console.warn('Database not available, using fallback data')
    return {
      project: fallbackProject,
      tasks: fallbackTasks,
      players: fallbackPlayers,
      lines: []
    }
  }

  try {
    const [project] = await db.select().from(projects).where(eq(projects.id, projectId))
    
    if (!project) {
      return null
    }

    const [projectTasks, projectPlayers, projectLines] = await Promise.all([
      db.select().from(tasks).where(eq(tasks.projectId, projectId)),
      db.select().from(players).where(eq(players.projectId, projectId)),
      db.select().from(lines).where(eq(lines.projectId, projectId))
    ])

    return {
      project,
      tasks: projectTasks,
      players: projectPlayers,
      lines: projectLines
    }
  } catch (error) {
    console.error('Error fetching project data:', error)
    return {
      project: fallbackProject,
      tasks: fallbackTasks,
      players: fallbackPlayers,
      lines: []
    }
  }
}

export async function getUserProjectAccess(userId: string, projectId: string) {
  if (!db || !sql) {
    console.warn('Database not available, allowing access')
    return true
  }

  try {
    const [project] = await db.select().from(projects).where(eq(projects.id, projectId))
    
    if (!project) {
      return false
    }

    // Owner has access
    if (project.ownerId === userId) {
      return true
    }

    // Check project access table
    const [access] = await db.select()
      .from(projectAccess)
      .where(and(
        eq(projectAccess.projectId, projectId),
        eq(projectAccess.userId, userId)
      ))

    return !!access
  } catch (error) {
    console.error('Error checking project access:', error)
    return false
  }
}

export async function getUserProjects(userId: string) {
  if (!db || !sql) {
    console.warn('Database not available, returning demo project')
    return [fallbackProject]
  }

  try {
    // Get projects owned by user
    const ownedProjects = await db.select()
      .from(projects)
      .where(eq(projects.ownerId, userId))

    // Get projects user has access to
    const accessibleProjects = await db.select({
      id: projects.id,
      name: projects.name,
      type: projects.type,
      ownerId: projects.ownerId,
      accessCode: projects.accessCode,
      createdAt: projects.createdAt,
      updatedAt: projects.updatedAt
    })
      .from(projects)
      .innerJoin(projectAccess, eq(projects.id, projectAccess.projectId))
      .where(eq(projectAccess.userId, userId))

    // Combine and deduplicate
    const allProjects = [...ownedProjects, ...accessibleProjects]
    const uniqueProjects = allProjects.filter((project, index, self) => 
      index === self.findIndex(p => p.id === project.id)
    )

    return uniqueProjects
  } catch (error) {
    console.error('Error fetching user projects:', error)
    return [fallbackProject]
  }
}
