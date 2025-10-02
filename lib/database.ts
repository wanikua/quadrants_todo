import { neon } from "@neondatabase/serverless"
import { crypto } from "crypto"

const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set")
}

export const sql = neon(DATABASE_URL)

let sqlClient: any = null

try {
  sqlClient = neon(DATABASE_URL)
} catch (error) {
  console.error("Failed to initialize database connection:", error)
}

export async function testConnection() {
  if (!sqlClient) {
    console.log("Database not configured")
    return false
  }

  try {
    await sqlClient`SELECT 1`
    console.log("Database connection successful")
    return true
  } catch (error) {
    console.error("Database connection failed:", error)
    return false
  }
}

// Default players for offline mode
const DEFAULT_PLAYERS: Player[] = [
  { id: 1, name: "Alice", color: "#ef4444", created_at: new Date().toISOString() },
  { id: 2, name: "Bob", color: "#f97316", created_at: new Date().toISOString() },
  { id: 3, name: "Charlie", color: "#eab308", created_at: new Date().toISOString() },
]

export interface Player {
  id: number
  name: string
  color: string
  created_at: string
}

export interface Task {
  id: string
  project_id: string
  user_id: string
  title: string
  quadrant: string
  completed: boolean
  created_at: string
  updated_at: string
}

export interface TaskComment {
  id: number
  task_id: string
  content: string
  author_name: string
  created_at: string
}

export interface Line {
  id: number
  from_task_id: string
  to_task_id: string
  style: "filled" | "open"
  size: number
  color: string
  created_at: string
}

export interface TaskWithAssignees extends Task {
  assignees: Player[]
  comments?: TaskComment[]
}

export interface Project {
  id: string
  name: string
  description: string
  user_id: string
  created_at: string
  updated_at: string
}

export async function getPlayers(): Promise<Player[]> {
  if (!sqlClient) {
    console.log("Database not available, returning default players")
    return DEFAULT_PLAYERS
  }

  try {
    const players = await sqlClient`
      SELECT id, name, color, created_at
      FROM players
      ORDER BY created_at ASC
    `
    console.log("Players loaded from database:", players.length)
    return players as Player[]
  } catch (error) {
    console.error("Database query failed, returning default players:", error)
    return DEFAULT_PLAYERS
  }
}

export async function getTasks(userId: string, projectId: string): Promise<TaskWithAssignees[]> {
  if (!sqlClient) {
    console.log("Database not available, returning empty tasks")
    return []
  }

  try {
    // First, try to get tasks with comments (if table exists)
    let tasks: TaskWithAssignees[]
    try {
      const tasksResult = await sqlClient`
        SELECT 
          t.id,
          t.project_id,
          t.user_id,
          t.title,
          t.quadrant,
          t.completed,
          t.created_at,
          t.updated_at,
          COALESCE(
            JSON_AGG(
              CASE WHEN p.id IS NOT NULL THEN
                JSON_BUILD_OBJECT(
                  'id', p.id,
                  'name', p.name,
                  'color', p.color,
                  'created_at', p.created_at
                )
              END
            ) FILTER (WHERE p.id IS NOT NULL), 
            '[]'
          ) as assignees,
          COALESCE(
            JSON_AGG(
              CASE WHEN c.id IS NOT NULL THEN
                JSON_BUILD_OBJECT(
                  'id', c.id,
                  'task_id', c.task_id,
                  'content', c.content,
                  'author_name', c.author_name,
                  'created_at', c.created_at
                )
              END
              ORDER BY c.created_at DESC
            ) FILTER (WHERE c.id IS NOT NULL),
            '[]'
          ) as comments
        FROM tasks t
        LEFT JOIN task_assignments ta ON t.id = ta.task_id
        LEFT JOIN players p ON ta.player_id = p.id
        LEFT JOIN task_comments c ON t.id = c.task_id
        WHERE t.user_id = ${userId} AND t.project_id = ${projectId}
        GROUP BY t.id, t.project_id, t.user_id, t.title, t.quadrant, t.completed, t.created_at, t.updated_at
        ORDER BY t.created_at DESC
      `
      tasks = tasksResult as TaskWithAssignees[]
    } catch (commentsError) {
      console.log("Comments table not found, falling back to tasks without comments")
      // Fallback query without comments
      try {
        const tasksResult = await sqlClient`
          SELECT 
            t.id,
            t.project_id,
            t.user_id,
            t.title,
            t.quadrant,
            t.completed,
            t.created_at,
            t.updated_at,
            COALESCE(
              JSON_AGG(
                CASE WHEN p.id IS NOT NULL THEN
                  JSON_BUILD_OBJECT(
                    'id', p.id,
                    'name', p.name,
                    'color', p.color,
                    'created_at', p.created_at
                  )
                END
              ) FILTER (WHERE p.id IS NOT NULL), 
              '[]'
            ) as assignees
          FROM tasks t
          LEFT JOIN task_assignments ta ON t.id = ta.task_id
          LEFT JOIN players p ON ta.player_id = p.id
          WHERE t.user_id = ${userId} AND t.project_id = ${projectId}
          GROUP BY t.id, t.project_id, t.user_id, t.title, t.quadrant, t.completed, t.created_at, t.updated_at
          ORDER BY t.created_at DESC
        `
        tasks = (tasksResult as any[]).map((task) => ({
          ...task,
          comments: [],
        }))
      } catch (basicError) {
        console.log("Basic tasks table not found, returning empty array")
        return []
      }
    }

    return tasks
  } catch (error) {
    console.error("Database query failed, returning empty tasks:", error)
    return []
  }
}

export async function createPlayer(name: string, color: string): Promise<Player> {
  if (!sqlClient) {
    throw new Error("Database not available")
  }

  try {
    const result = await sqlClient`
      INSERT INTO players (name, color)
      VALUES (${name}, ${color})
      RETURNING id, name, color, created_at
    `
    return result[0] as Player
  } catch (error) {
    console.error("Failed to create player:", error)
    throw error
  }
}

export async function createTask(userId: string, projectId: string, title: string, quadrant: string): Promise<string> {
  if (!sqlClient) {
    throw new Error("Database not available")
  }

  try {
    const taskId = crypto.randomUUID()
    await sqlClient`
      INSERT INTO tasks (id, project_id, user_id, title, quadrant, created_at)
      VALUES (${taskId}, ${projectId}, ${userId}, ${title}, ${quadrant}, NOW())
    `
    return taskId
  } catch (error) {
    console.error("Failed to create task:", error)
    throw error
  }
}

export async function updateTask(taskId: string, userId: string, updates: any): Promise<void> {
  if (!sqlClient) {
    throw new Error("Database not available")
  }

  try {
    const { title, quadrant, completed } = updates
    await sqlClient`
      UPDATE tasks
      SET 
        title = COALESCE(${title}, title),
        quadrant = COALESCE(${quadrant}, quadrant),
        completed = COALESCE(${completed}, completed),
        updated_at = NOW()
      WHERE id = ${taskId} AND user_id = ${userId}
    `
  } catch (error) {
    console.error("Failed to update task:", error)
    throw error
  }
}

export async function deleteTask(taskId: string, userId: string): Promise<void> {
  if (!sqlClient) {
    throw new Error("Database not available")
  }

  try {
    await sqlClient`
      DELETE FROM tasks
      WHERE id = ${taskId} AND user_id = ${userId}
    `
  } catch (error) {
    console.error("Failed to delete task:", error)
    throw error
  }
}

export async function createProject(userId: string, name: string, description?: string): Promise<string> {
  if (!sqlClient) {
    throw new Error("Database not available")
  }

  try {
    const projectId = crypto.randomUUID()
    await sqlClient`
      INSERT INTO projects (id, user_id, name, description, created_at, updated_at)
      VALUES (${projectId}, ${userId}, ${name}, ${description || null}, NOW(), NOW())
    `
    return projectId
  } catch (error) {
    console.error("Failed to create project:", error)
    throw error
  }
}

export async function getProjects(userId: string): Promise<Project[]> {
  if (!sqlClient) {
    console.log("Database not available, returning empty projects")
    return []
  }

  try {
    const projects = await sqlClient`
      SELECT * FROM projects
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
    `
    console.log("Projects loaded from database:", projects.length)
    return projects as Project[]
  } catch (error) {
    console.error("Database query failed, returning empty projects:", error)
    return []
  }
}

export async function deleteProject(projectId: string, userId: string): Promise<void> {
  if (!sqlClient) {
    throw new Error("Database not available")
  }

  try {
    // Delete tasks first
    await sqlClient`DELETE FROM tasks WHERE project_id = ${projectId}`
    // Then delete project
    await sqlClient`DELETE FROM projects WHERE id = ${projectId} AND user_id = ${userId}`
  } catch (error) {
    console.error("Failed to delete project:", error)
    throw error
  }
}

export async function addTaskComment(taskId: string, content: string, authorName: string): Promise<TaskComment> {
  if (!sqlClient) {
    throw new Error("Database not available")
  }

  try {
    const result = await sqlClient`
      INSERT INTO task_comments (task_id, content, author_name)
      VALUES (${taskId}, ${content}, ${authorName})
      RETURNING id, task_id, content, author_name, created_at
    `
    return result[0] as TaskComment
  } catch (error) {
    console.error("Failed to add comment:", error)
    throw error
  }
}

export async function deleteTaskComment(commentId: number): Promise<void> {
  if (!sqlClient) {
    throw new Error("Database not available")
  }

  try {
    await sqlClient`DELETE FROM task_comments WHERE id = ${commentId}`
  } catch (error) {
    console.error("Failed to delete comment:", error)
    throw error
  }
}

export async function getLines(): Promise<Line[]> {
  if (!sqlClient) {
    return []
  }

  try {
    const lines = await sqlClient`
      SELECT id, from_task_id, to_task_id, style, size, color, created_at
      FROM task_lines
      ORDER BY created_at ASC
    `
    return lines as Line[]
  } catch (error) {
    console.error("Failed to get lines (table may not exist):", error)
    return []
  }
}

export async function createLine(
  fromTaskId: string,
  toTaskId: string,
  style: "filled" | "open" = "filled",
  size = 8,
  color = "#374151",
): Promise<Line> {
  if (!sqlClient) {
    throw new Error("Database not available")
  }

  try {
    const result = await sqlClient`
      INSERT INTO task_lines (from_task_id, to_task_id, style, size, color)
      VALUES (${fromTaskId}, ${toTaskId}, ${style}, ${size}, ${color})
      RETURNING id, from_task_id, to_task_id, style, size, color, created_at
    `
    return result[0] as Line
  } catch (error) {
    console.error("Failed to create line:", error)
    throw error
  }
}

export async function deleteLine(lineId: number): Promise<void> {
  if (!sqlClient) {
    throw new Error("Database not available")
  }

  try {
    await sqlClient`DELETE FROM task_lines WHERE id = ${lineId}`
  } catch (error) {
    console.error("Failed to delete line:", error)
    throw error
  }
}

export async function getLine(fromTaskId: string, toTaskId: string): Promise<Line | null> {
  if (!sqlClient) {
    return null
  }

  try {
    const result = await sqlClient`
      SELECT id, from_task_id, to_task_id, style, size, color, created_at
      FROM task_lines
      WHERE (from_task_id = ${fromTaskId} AND to_task_id = ${toTaskId})
         OR (from_task_id = ${toTaskId} AND to_task_id = ${fromTaskId})
      LIMIT 1
    `
    return result.length > 0 ? (result[0] as Line) : null
  } catch (error) {
    console.error("Failed to get line:", error)
    return null
  }
}

export async function initializeDatabase(): Promise<void> {
  if (!sqlClient) {
    console.log("Database not available, skipping initialization")
    return
  }

  try {
    // Create comments table if it doesn't exist
    await sqlClient`
      CREATE TABLE IF NOT EXISTS task_comments (
          id SERIAL PRIMARY KEY,
          task_id VARCHAR(255) NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
          content TEXT NOT NULL,
          author_name VARCHAR(255) NOT NULL DEFAULT 'Anonymous',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `

    // Create lines table if it doesn't exist
    await sqlClient`
      CREATE TABLE IF NOT EXISTS task_lines (
          id SERIAL PRIMARY KEY,
          from_task_id VARCHAR(255) NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
          to_task_id VARCHAR(255) NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
          style VARCHAR(10) NOT NULL DEFAULT 'filled' CHECK (style IN ('filled', 'open')),
          size INTEGER NOT NULL DEFAULT 8 CHECK (size > 0),
          color VARCHAR(7) NOT NULL DEFAULT '#374151',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(from_task_id, to_task_id)
      )
    `

    // Create indexes
    await sqlClient`CREATE INDEX IF NOT EXISTS idx_task_comments_task_id ON task_comments(task_id)`
    await sqlClient`CREATE INDEX IF NOT EXISTS idx_task_comments_created_at ON task_comments(created_at)`
    await sqlClient`CREATE INDEX IF NOT EXISTS idx_task_lines_from_task_id ON task_lines(from_task_id)`
    await sqlClient`CREATE INDEX IF NOT EXISTS idx_task_lines_to_task_id ON task_lines(to_task_id)`

    console.log("Database initialized successfully")
  } catch (error) {
    console.error("Failed to initialize database:", error)
    // Don't throw error here, just log it
  }
}

// Database helper functions
export const dbHelper = {
  async createTask(userId: string, projectId: string, title: string, quadrant: string) {
    const taskId = crypto.randomUUID()
    await sqlClient`
      INSERT INTO tasks (id, project_id, user_id, title, quadrant, created_at)
      VALUES (${taskId}, ${projectId}, ${userId}, ${title}, ${quadrant}, NOW())
    `
    return taskId
  },

  async updateTask(taskId: string, userId: string, updates: any) {
    const { title, quadrant, completed } = updates
    await sqlClient`
      UPDATE tasks
      SET 
        title = COALESCE(${title}, title),
        quadrant = COALESCE(${quadrant}, quadrant),
        completed = COALESCE(${completed}, completed),
        updated_at = NOW()
      WHERE id = ${taskId} AND user_id = ${userId}
    `
  },

  async deleteTask(taskId: string, userId: string) {
    await sqlClient`
      DELETE FROM tasks
      WHERE id = ${taskId} AND user_id = ${userId}
    `
  },

  async getTasks(userId: string, projectId: string) {
    return await sqlClient`
      SELECT * FROM tasks
      WHERE user_id = ${userId} AND project_id = ${projectId}
      ORDER BY created_at DESC
    `
  },

  async createProject(userId: string, name: string, description?: string) {
    const projectId = crypto.randomUUID()
    await sqlClient`
      INSERT INTO projects (id, user_id, name, description, created_at, updated_at)
      VALUES (${projectId}, ${userId}, ${name}, ${description || null}, NOW(), NOW())
    `
    return projectId
  },

  async getProjects(userId: string) {
    return await sqlClient`
      SELECT * FROM projects
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
    `
  },

  async deleteProject(projectId: string, userId: string) {
    await sqlClient`
      DELETE FROM tasks WHERE project_id = ${projectId}
    `
    await sqlClient`
      DELETE FROM projects WHERE id = ${projectId} AND user_id = ${userId}
    `
  },
}
