import { neon } from "@neondatabase/serverless"

// Check if DATABASE_URL is available
const DATABASE_URL = process.env.DATABASE_URL

let sql: any = null

if (DATABASE_URL) {
  try {
    sql = neon(DATABASE_URL)
  } catch (error) {
    console.error("Failed to initialize database connection:", error)
  }
}

export async function testConnection() {
  if (!sql) {
    console.log("Database not configured")
    return false
  }

  try {
    await sql`SELECT 1`
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
  id: number
  description: string
  urgency: number
  importance: number
  created_at: string
}

export interface TaskComment {
  id: number
  task_id: number
  content: string
  author_name: string
  created_at: string
}

export interface Line {
  id: number
  from_task_id: number
  to_task_id: number
  style: "filled" | "open"
  size: number
  color: string
  created_at: string
}

export interface TaskWithAssignees extends Task {
  assignees: Player[]
  comments?: TaskComment[]
}


export async function getPlayers(): Promise<Player[]> {
  if (!sql) {
    console.log("Database not available, returning default players")
    return DEFAULT_PLAYERS
  }

  try {
    const players = await sql`
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

export async function getTasks(): Promise<TaskWithAssignees[]> {
  if (!sql) {
    console.log("Database not available, returning empty tasks")
    return []
  }

  try {
    // First, try to get tasks with comments (if table exists)
    let tasks: TaskWithAssignees[]
    try {
      const tasksResult = await sql`
        SELECT 
          t.id,
          t.description,
          t.urgency,
          t.importance,
          t.created_at,
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
        GROUP BY t.id, t.description, t.urgency, t.importance, t.created_at
        ORDER BY t.created_at DESC
      `
      tasks = tasksResult as TaskWithAssignees[]
    } catch (commentsError) {
      console.log("Comments table not found, falling back to tasks without comments")
      // Fallback query without comments
      const tasksResult = await sql`
        SELECT 
          t.id,
          t.description,
          t.urgency,
          t.importance,
          t.created_at,
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
        GROUP BY t.id, t.description, t.urgency, t.importance, t.created_at
        ORDER BY t.created_at DESC
      `
      tasks = (tasksResult as any[]).map((task) => ({
        ...task,
        comments: [],
      }))
    }

    return tasks
  } catch (error) {
    console.error("Database query failed, returning empty tasks:", error)
    return []
  }
}

export async function createPlayer(name: string, color: string): Promise<Player> {
  if (!sql) {
    throw new Error("Database not available")
  }

  try {
    const result = await sql`
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

export async function createTask(
  description: string,
  urgency: number,
  importance: number,
  assigneeIds: number[],
): Promise<TaskWithAssignees> {
  if (!sql) {
    throw new Error("Database not available")
  }

  try {
    // Create the task
    const taskResult = await sql`
      INSERT INTO tasks (description, urgency, importance)
      VALUES (${description}, ${urgency}, ${importance})
      RETURNING id, description, urgency, importance, created_at
    `

  const task = taskResult[0] as Task

  // Create assignments if any assignees are provided
  if (assigneeIds.length > 0) {
    for (const assigneeId of assigneeIds) {
      await sql`
        INSERT INTO task_assignments (task_id, player_id)
        VALUES (${task.id}, ${assigneeId})
      `
    }
  }

  // Get the complete task with assignees
  const completeTaskResult = await sql`
    SELECT 
      t.id,
      t.description,
      t.urgency,
      t.importance,
      t.created_at,
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
    WHERE t.id = ${task.id}
    GROUP BY t.id, t.description, t.urgency, t.importance, t.created_at
  `

    const completeTask = completeTaskResult[0] as TaskWithAssignees
    completeTask.comments = []
    return completeTask
  } catch (error) {
    console.error("Failed to create task:", error)
    throw error
  }
}

export async function updateTask(
  taskId: number,
  description: string,
  urgency: number,
  importance: number,
  assigneeIds: number[],
): Promise<TaskWithAssignees> {
  if (!sql) {
    throw new Error("Database not available")
  }

  try {
    // Update the task
    await sql`
      UPDATE tasks 
      SET description = ${description}, urgency = ${urgency}, importance = ${importance}
      WHERE id = ${taskId}
    `

  // Delete existing assignments
  await sql`DELETE FROM task_assignments WHERE task_id = ${taskId}`

  // Create new assignments
  if (assigneeIds.length > 0) {
    for (const assigneeId of assigneeIds) {
      await sql`
        INSERT INTO task_assignments (task_id, player_id)
        VALUES (${taskId}, ${assigneeId})
      `
    }
  }

  // Get the updated task with assignees and comments
  try {
    const updatedTaskResult = await sql`
      SELECT 
        t.id,
        t.description,
        t.urgency,
        t.importance,
        t.created_at,
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
      WHERE t.id = ${taskId}
      GROUP BY t.id, t.description, t.urgency, t.importance, t.created_at
    `
    return updatedTaskResult[0] as TaskWithAssignees
  } catch (commentsError) {
    // Fallback without comments
    const updatedTaskResult = await sql`
      SELECT 
        t.id,
        t.description,
        t.urgency,
        t.importance,
        t.created_at,
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
      WHERE t.id = ${taskId}
      GROUP BY t.id, t.description, t.urgency, t.importance, t.created_at
    `
      const task = updatedTaskResult[0] as TaskWithAssignees
      task.comments = []
      return task
    }
  } catch (error) {
    console.error("Failed to update task:", error)
    throw error
  }
}

export async function deleteTask(taskId: number): Promise<void> {
  if (!sql) {
    throw new Error("Database not available")
  }

  try {
    await sql`DELETE FROM tasks WHERE id = ${taskId}`
  } catch (error) {
    console.error("Failed to delete task:", error)
    throw error
  }
}

export async function deletePlayer(playerId: number): Promise<void> {
  if (!sql) {
    throw new Error("Database not available")
  }

  try {
    // Delete player (cascade will handle task_assignments)
    await sql`DELETE FROM players WHERE id = ${playerId}`

    // Delete tasks that have no remaining assignees
    await sql`
      DELETE FROM tasks 
      WHERE id NOT IN (
        SELECT DISTINCT task_id FROM task_assignments
      )
    `
  } catch (error) {
    console.error("Failed to delete player:", error)
    throw error
  }
}

export async function addTaskComment(taskId: number, content: string, authorName: string): Promise<TaskComment> {
  if (!sql) {
    throw new Error("Database not available")
  }

  try {
    const result = await sql`
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
  if (!sql) {
    throw new Error("Database not available")
  }

  try {
    await sql`DELETE FROM task_comments WHERE id = ${commentId}`
  } catch (error) {
    console.error("Failed to delete comment:", error)
    throw error
  }
}

export async function getLines(): Promise<Line[]> {
  if (!sql) {
    return []
  }

  try {
    const lines = await sql`
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
  fromTaskId: number,
  toTaskId: number,
  style: "filled" | "open" = "filled",
  size: number = 8,
  color: string = "#374151"
): Promise<Line> {
  if (!sql) {
    throw new Error("Database not available")
  }

  try {
    const result = await sql`
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
  if (!sql) {
    throw new Error("Database not available")
  }

  try {
    await sql`DELETE FROM task_lines WHERE id = ${lineId}`
  } catch (error) {
    console.error("Failed to delete line:", error)
    throw error
  }
}

export async function initializeDatabase(): Promise<void> {
  if (!sql) {
    throw new Error("Database not available")
  }

  try {
    // Create comments table if it doesn't exist
    await sql`
      CREATE TABLE IF NOT EXISTS task_comments (
          id SERIAL PRIMARY KEY,
          task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
          content TEXT NOT NULL,
          author_name VARCHAR(255) NOT NULL DEFAULT 'Anonymous',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `
    
    // Create lines table if it doesn't exist
    await sql`
      CREATE TABLE IF NOT EXISTS task_lines (
          id SERIAL PRIMARY KEY,
          from_task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
          to_task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
          style VARCHAR(10) NOT NULL DEFAULT 'filled' CHECK (style IN ('filled', 'open')),
          size INTEGER NOT NULL DEFAULT 8 CHECK (size > 0),
          color VARCHAR(7) NOT NULL DEFAULT '#374151',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(from_task_id, to_task_id)
      )
    `
    
    // Create indexes
    await sql`CREATE INDEX IF NOT EXISTS idx_task_comments_task_id ON task_comments(task_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_task_comments_created_at ON task_comments(created_at)`
    await sql`CREATE INDEX IF NOT EXISTS idx_task_lines_from_task_id ON task_lines(from_task_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_task_lines_to_task_id ON task_lines(to_task_id)`
    
    console.log("Database initialized successfully")
  } catch (error) {
    console.error("Failed to initialize database:", error)
    throw error
  }
}
