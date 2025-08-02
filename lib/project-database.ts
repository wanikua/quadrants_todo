import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

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

export async function createProject(name: string, type: "personal" | "team", ownerId: string) {
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

async function createProjectTables(projectId: string) {
  const taskTableName = `project_${projectId}_tasks`
  const playerTableName = `project_${projectId}_players`
  const lineTableName = `project_${projectId}_lines`

  try {
    // Create tasks table
    await sql`
      CREATE TABLE ${sql(taskTableName)} (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        quadrant INTEGER NOT NULL CHECK (quadrant IN (1, 2, 3, 4)),
        x REAL NOT NULL,
        y REAL NOT NULL,
        width REAL DEFAULT 200,
        height REAL DEFAULT 100,
        color TEXT DEFAULT '#3b82f6',
        assigned_to INTEGER,
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
        start_x REAL NOT NULL,
        start_y REAL NOT NULL,
        end_x REAL NOT NULL,
        end_y REAL NOT NULL,
        color TEXT DEFAULT '#000000',
        stroke_width REAL DEFAULT 2,
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
  const tableName = `project_${projectId}_lines`
  try {
    const lines = await sql`SELECT * FROM ${sql(tableName)} ORDER BY created_at DESC`
    return lines
  } catch (error) {
    console.error("Error fetching project lines:", error)
    return []
  }
}
