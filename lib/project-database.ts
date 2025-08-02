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

export interface Project {
  id: string
  name: string
  type: "personal" | "team"
  owner_id: string
  invite_code?: string
  created_at: string
}

export interface ProjectMember {
  id: string
  project_id: string
  user_id: string
  role: "owner" | "admin" | "member"
  joined_at: string
}

// Initialize project management tables
export async function initializeProjectDatabase() {
  if (!sql) {
    console.log("Database not configured for project initialization")
    return
  }

  try {
    // Create projects table
    await sql`
      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('personal', 'team')),
        owner_id TEXT NOT NULL,
        invite_code TEXT UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    // Create project members table
    await sql`
      CREATE TABLE IF NOT EXISTS project_members (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        user_id TEXT NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member')),
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(project_id, user_id)
      )
    `

    console.log("Project database initialized successfully")
  } catch (error) {
    console.error("Error initializing project database:", error)
    throw error
  }
}

export async function createProject(name: string, type: "personal" | "team", ownerId: string) {
  if (!sql) {
    return { success: false, error: "Database not configured" }
  }

  const projectId = `proj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  const inviteCode = type === "team" ? `invite_${Math.random().toString(36).substr(2, 8)}` : null

  try {
    // Create project
    await sql`
      INSERT INTO projects (id, name, type, owner_id, invite_code, created_at)
      VALUES (${projectId}, ${name}, ${type}, ${ownerId}, ${inviteCode}, NOW())
    `

    // Add owner as member
    await sql`
      INSERT INTO project_members (id, project_id, user_id, role, joined_at)
      VALUES (${`member_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`}, ${projectId}, ${ownerId}, 'owner', NOW())
    `

    // Create project-specific tables
    await createProjectTables(projectId)

    return { success: true, projectId, inviteCode }
  } catch (error) {
    console.error("Error creating project:", error)
    return { success: false, error: "Failed to create project" }
  }
}

export async function joinProject(inviteCode: string, userId: string) {
  if (!sql) {
    return { success: false, error: "Database not configured" }
  }

  try {
    // Find project by invite code
    const projects = await sql`
      SELECT id, name FROM projects WHERE invite_code = ${inviteCode} AND type = 'team'
    `

    if (projects.length === 0) {
      return { success: false, error: "Invalid invite code" }
    }

    const project = projects[0]

    // Check if user is already a member
    const existingMember = await sql`
      SELECT id FROM project_members WHERE project_id = ${project.id} AND user_id = ${userId}
    `

    if (existingMember.length > 0) {
      return { success: false, error: "You are already a member of this project" }
    }

    // Add user as member
    await sql`
      INSERT INTO project_members (id, project_id, user_id, role, joined_at)
      VALUES (${`member_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`}, ${project.id}, ${userId}, 'member', NOW())
    `

    return { success: true, projectId: project.id, projectName: project.name }
  } catch (error) {
    console.error("Error joining project:", error)
    return { success: false, error: "Failed to join project" }
  }
}

export async function getProjectsForUser(userId: string) {
  if (!sql) {
    return []
  }

  try {
    const projects = await sql`
      SELECT 
        p.id,
        p.name,
        p.type,
        p.created_at,
        pm.role,
        (SELECT COUNT(*) FROM project_members WHERE project_id = p.id) as member_count
      FROM projects p
      JOIN project_members pm ON p.id = pm.project_id
      WHERE pm.user_id = ${userId}
      ORDER BY p.created_at DESC
    `

    return projects.map((project) => ({
      id: project.id,
      name: project.name,
      type: project.type as "personal" | "team",
      role: project.role as "owner" | "admin" | "member",
      created_at: project.created_at,
      member_count: Number.parseInt(project.member_count as string),
    }))
  } catch (error) {
    console.error("Error fetching projects:", error)
    return []
  }
}

export async function getProject(projectId: string, userId: string) {
  if (!sql) {
    return null
  }

  try {
    const projects = await sql`
      SELECT 
        p.id,
        p.name,
        p.type,
        p.owner_id,
        p.invite_code,
        p.created_at,
        pm.role
      FROM projects p
      JOIN project_members pm ON p.id = pm.project_id
      WHERE p.id = ${projectId} AND pm.user_id = ${userId}
    `

    if (projects.length === 0) {
      return null
    }

    return projects[0]
  } catch (error) {
    console.error("Error fetching project:", error)
    return null
  }
}

export async function deleteProject(projectId: string, userId: string) {
  if (!sql) {
    throw new Error("Database not configured")
  }

  try {
    // Check if user is the owner
    const [member] = await sql`
      SELECT * FROM project_members
      WHERE project_id = ${projectId} AND user_id = ${userId} AND role = 'owner'
    `

    if (!member) {
      throw new Error("Only project owners can delete projects")
    }

    // Drop project-specific tables
    await sql`DROP TABLE IF EXISTS ${sql(`project_${projectId}_lines`)} CASCADE`
    await sql`DROP TABLE IF EXISTS ${sql(`project_${projectId}_tasks`)} CASCADE`
    await sql`DROP TABLE IF EXISTS ${sql(`project_${projectId}_players`)} CASCADE`

    // Delete the project (this will cascade to project_members)
    await sql`DELETE FROM projects WHERE id = ${projectId}`

    console.log(`Project ${projectId} deleted successfully`)
  } catch (error) {
    console.error("Error deleting project:", error)
    throw error
  }
}

export async function getUserProjectAccess(userId: string, projectId: string): Promise<ProjectMember | null> {
  if (!sql) {
    return null
  }

  try {
    const [member] = await sql`
      SELECT * FROM project_members
      WHERE project_id = ${projectId} AND user_id = ${userId}
    `
    return member || null
  } catch (error) {
    console.error("Error checking project access:", error)
    return null
  }
}

async function createProjectTables(projectId: string) {
  if (!sql) {
    throw new Error("Database not configured")
  }

  const taskTableName = `project_${projectId}_tasks`
  const playerTableName = `project_${projectId}_players`
  const lineTableName = `project_${projectId}_lines`

  try {
    // Create tasks table
    await sql`
      CREATE TABLE ${sql(taskTableName)} (
        id SERIAL PRIMARY KEY,
        description TEXT NOT NULL,
        urgency INTEGER NOT NULL CHECK (urgency >= 0 AND urgency <= 100),
        importance INTEGER NOT NULL CHECK (importance >= 0 AND importance <= 100),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `

    // Create players table
    await sql`
      CREATE TABLE ${sql(playerTableName)} (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        color TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `

    // Create lines table
    await sql`
      CREATE TABLE ${sql(lineTableName)} (
        id SERIAL PRIMARY KEY,
        from_task_id INTEGER NOT NULL,
        to_task_id INTEGER NOT NULL,
        style VARCHAR(10) NOT NULL DEFAULT 'filled' CHECK (style IN ('filled', 'open')),
        size INTEGER NOT NULL DEFAULT 8 CHECK (size > 0),
        color VARCHAR(7) NOT NULL DEFAULT '#374151',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `

    // Insert default players
    await sql`
      INSERT INTO ${sql(playerTableName)} (name, color) VALUES
      ('Alice', '#ef4444'),
      ('Bob', '#f97316'),
      ('Charlie', '#eab308')
    `
  } catch (error) {
    console.error("Error creating project tables:", error)
    throw error
  }
}

export async function getProjectTasks(projectId: string) {
  if (!sql) {
    return []
  }

  const tableName = `project_${projectId}_tasks`
  try {
    const tasks = await sql`SELECT * FROM ${sql(tableName)} ORDER BY created_at DESC`
    return tasks
  } catch (error) {
    console.error("Error fetching project tasks:", error)
    return []
  }
}

export async function getProjectPlayers(projectId: string) {
  if (!sql) {
    return []
  }

  const tableName = `project_${projectId}_players`
  try {
    const players = await sql`SELECT * FROM ${sql(tableName)} ORDER BY created_at ASC`
    return players
  } catch (error) {
    console.error("Error fetching project players:", error)
    return []
  }
}

export async function getProjectLines(projectId: string) {
  if (!sql) {
    return []
  }

  const tableName = `project_${projectId}_lines`
  try {
    const lines = await sql`SELECT * FROM ${sql(tableName)} ORDER BY created_at DESC`
    return lines
  } catch (error) {
    console.error("Error fetching project lines:", error)
    return []
  }
}

export async function createProjectPlayer(projectId: string, name: string, color: string) {
  if (!sql) {
    throw new Error("Database not configured")
  }

  const tableName = `project_${projectId}_players`
  try {
    const [player] = await sql`
      INSERT INTO ${sql(tableName)} (name, color)
      VALUES (${name}, ${color})
      RETURNING *
    `
    return player
  } catch (error) {
    console.error("Error creating project player:", error)
    throw error
  }
}

export async function createProjectTask(
  projectId: string,
  description: string,
  urgency: number,
  importance: number,
  assigneeIds: number[],
) {
  if (!sql) {
    throw new Error("Database not configured")
  }

  const tableName = `project_${projectId}_tasks`
  try {
    const [task] = await sql`
      INSERT INTO ${sql(tableName)} (description, urgency, importance)
      VALUES (${description}, ${urgency}, ${importance})
      RETURNING *
    `
    return task
  } catch (error) {
    console.error("Error creating project task:", error)
    throw error
  }
}

export async function updateProjectTask(
  projectId: string,
  taskId: number,
  description: string,
  urgency: number,
  importance: number,
  assigneeIds: number[],
) {
  if (!sql) {
    throw new Error("Database not configured")
  }

  const tableName = `project_${projectId}_tasks`
  try {
    const [task] = await sql`
      UPDATE ${sql(tableName)}
      SET description = ${description}, urgency = ${urgency}, importance = ${importance}, updated_at = NOW()
      WHERE id = ${taskId}
      RETURNING *
    `
    return task
  } catch (error) {
    console.error("Error updating project task:", error)
    throw error
  }
}

export async function deleteProjectTask(projectId: string, taskId: number) {
  if (!sql) {
    throw new Error("Database not configured")
  }

  const tableName = `project_${projectId}_tasks`
  try {
    await sql`DELETE FROM ${sql(tableName)} WHERE id = ${taskId}`
  } catch (error) {
    console.error("Error deleting project task:", error)
    throw error
  }
}

export async function deleteProjectPlayer(projectId: string, playerId: number) {
  if (!sql) {
    throw new Error("Database not configured")
  }

  const tableName = `project_${projectId}_players`
  try {
    await sql`DELETE FROM ${sql(tableName)} WHERE id = ${playerId}`
  } catch (error) {
    console.error("Error deleting project player:", error)
    throw error
  }
}

export async function addProjectTaskComment(projectId: string, taskId: number, content: string, authorName: string) {
  // For now, return a mock comment since we haven't implemented comments table for projects
  return {
    id: Date.now(),
    task_id: taskId,
    content,
    author_name: authorName,
    created_at: new Date().toISOString(),
  }
}

export async function deleteProjectTaskComment(projectId: string, commentId: number) {
  // Mock implementation
  console.log(`Deleting comment ${commentId} from project ${projectId}`)
}

export async function createProjectLine(
  projectId: string,
  fromTaskId: number,
  toTaskId: number,
  style?: "filled" | "open",
  size?: number,
  color?: string,
) {
  if (!sql) {
    throw new Error("Database not configured")
  }

  const tableName = `project_${projectId}_lines`
  try {
    const [line] = await sql`
      INSERT INTO ${sql(tableName)} (from_task_id, to_task_id, style, size, color)
      VALUES (${fromTaskId}, ${toTaskId}, ${style || "filled"}, ${size || 8}, ${color || "#374151"})
      RETURNING *
    `
    return line
  } catch (error) {
    console.error("Error creating project line:", error)
    throw error
  }
}

export async function deleteProjectLine(projectId: string, lineId: number) {
  if (!sql) {
    throw new Error("Database not configured")
  }

  const tableName = `project_${projectId}_lines`
  try {
    await sql`DELETE FROM ${sql(tableName)} WHERE id = ${lineId}`
  } catch (error) {
    console.error("Error deleting project line:", error)
    throw error
  }
}
