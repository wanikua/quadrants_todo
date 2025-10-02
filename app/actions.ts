"use server"

import { sql } from "@vercel/postgres"
import { revalidatePath } from "next/cache"
import { getUserId } from "@/lib/auth"

export async function getProjects() {
  try {
    const userId = await getUserId()
    if (!userId) {
      throw new Error("Unauthorized")
    }

    const { rows } = await sql`
      SELECT * FROM projects 
      WHERE user_id = ${userId} 
      ORDER BY created_at DESC
    `

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description || "",
      userId: row.user_id,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
    }))
  } catch (error) {
    console.error("Error fetching projects:", error)
    return []
  }
}

export async function createProject(formData: FormData) {
  try {
    const userId = await getUserId()
    if (!userId) {
      throw new Error("Unauthorized")
    }

    const name = formData.get("name") as string
    const description = formData.get("description") as string

    if (!name) {
      throw new Error("Project name is required")
    }

    const { rows } = await sql`
      INSERT INTO projects (name, description, user_id)
      VALUES (${name}, ${description}, ${userId})
      RETURNING *
    `

    revalidatePath("/projects")

    return {
      success: true,
      project: {
        id: rows[0].id,
        name: rows[0].name,
        description: rows[0].description || "",
        userId: rows[0].user_id,
        createdAt: rows[0].created_at.toISOString(),
        updatedAt: rows[0].updated_at.toISOString(),
      },
    }
  } catch (error) {
    console.error("Error creating project:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create project",
    }
  }
}

export async function deleteProject(projectId: string) {
  try {
    const userId = await getUserId()
    if (!userId) {
      throw new Error("Unauthorized")
    }

    await sql`
      DELETE FROM tasks 
      WHERE project_id = ${projectId} 
      AND user_id = ${userId}
    `

    await sql`
      DELETE FROM projects 
      WHERE id = ${projectId} 
      AND user_id = ${userId}
    `

    revalidatePath("/projects")

    return { success: true }
  } catch (error) {
    console.error("Error deleting project:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete project",
    }
  }
}

export async function getTasks(projectId: string) {
  try {
    const userId = await getUserId()
    if (!userId) {
      throw new Error("Unauthorized")
    }

    const { rows } = await sql`
      SELECT * FROM tasks 
      WHERE project_id = ${projectId} 
      AND user_id = ${userId}
      ORDER BY created_at DESC
    `

    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      description: row.description || "",
      quadrant: row.quadrant,
      projectId: row.project_id,
      userId: row.user_id,
      completed: row.completed || false,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
    }))
  } catch (error) {
    console.error("Error fetching tasks:", error)
    return []
  }
}

export async function createPlayerAction(name: string, color: string, projectId?: string) {
  try {
    const userId = await getUserId()
    if (!userId) {
      throw new Error("Unauthorized")
    }

    const { rows } = await sql`
      INSERT INTO players (name, color, user_id, project_id)
      VALUES (${name}, ${color}, ${userId}, ${projectId || null})
      RETURNING *
    `

    if (projectId) {
      revalidatePath(`/projects/${projectId}`)
    } else {
      revalidatePath("/")
    }

    return {
      success: true,
      player: {
        id: rows[0].id,
        name: rows[0].name,
        color: rows[0].color,
        userId: rows[0].user_id,
        projectId: rows[0].project_id,
      },
    }
  } catch (error) {
    console.error("Error creating player:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create player",
    }
  }
}

export async function createTask(data: {
  title: string
  description?: string
  quadrant: number
  projectId: string
}) {
  try {
    const userId = await getUserId()
    if (!userId) {
      throw new Error("Unauthorized")
    }

    const { rows } = await sql`
      INSERT INTO tasks (title, description, quadrant, project_id, user_id, completed)
      VALUES (${data.title}, ${data.description || ""}, ${data.quadrant}, ${data.projectId}, ${userId}, false)
      RETURNING *
    `

    revalidatePath(`/projects/${data.projectId}`)

    return {
      success: true,
      task: {
        id: rows[0].id,
        title: rows[0].title,
        description: rows[0].description || "",
        quadrant: rows[0].quadrant,
        projectId: rows[0].project_id,
        userId: rows[0].user_id,
        completed: rows[0].completed || false,
        createdAt: rows[0].created_at.toISOString(),
        updatedAt: rows[0].updated_at.toISOString(),
      },
    }
  } catch (error) {
    console.error("Error creating task:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create task",
    }
  }
}

export async function createTaskAction(
  description: string,
  urgency: number,
  importance: number,
  assigneeIds: number[],
  projectId?: string,
) {
  try {
    const userId = await getUserId()
    if (!userId) {
      throw new Error("Unauthorized")
    }

    const { rows } = await sql`
      INSERT INTO tasks (title, description, quadrant, project_id, user_id, completed)
      VALUES (${description}, ${""}, ${Math.floor((urgency + importance) / 2)}, ${projectId || null}, ${userId}, false)
      RETURNING *
    `

    if (projectId) {
      revalidatePath(`/projects/${projectId}`)
    } else {
      revalidatePath("/")
    }

    return {
      success: true,
      task: {
        id: rows[0].id,
        title: rows[0].title,
        description: rows[0].description || "",
        quadrant: rows[0].quadrant,
        projectId: rows[0].project_id,
        userId: rows[0].user_id,
        completed: rows[0].completed || false,
        createdAt: rows[0].created_at.toISOString(),
        updatedAt: rows[0].updated_at.toISOString(),
      },
    }
  } catch (error) {
    console.error("Error creating task:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create task",
    }
  }
}

export async function updateTask(
  taskId: string,
  data: {
    title?: string
    description?: string
    quadrant?: number
    completed?: boolean
  },
) {
  try {
    const userId = await getUserId()
    if (!userId) {
      throw new Error("Unauthorized")
    }

    const updates: string[] = []
    const values: any[] = []
    let paramCount = 1

    if (data.title !== undefined) {
      updates.push(`title = $${paramCount++}`)
      values.push(data.title)
    }
    if (data.description !== undefined) {
      updates.push(`description = $${paramCount++}`)
      values.push(data.description)
    }
    if (data.quadrant !== undefined) {
      updates.push(`quadrant = $${paramCount++}`)
      values.push(data.quadrant)
    }
    if (data.completed !== undefined) {
      updates.push(`completed = $${paramCount++}`)
      values.push(data.completed)
    }

    updates.push(`updated_at = NOW()`)
    values.push(taskId, userId)

    const query = `
      UPDATE tasks 
      SET ${updates.join(", ")}
      WHERE id = $${paramCount++} AND user_id = $${paramCount}
      RETURNING *
    `

    const { rows } = await sql.query(query, values)

    if (rows.length === 0) {
      throw new Error("Task not found or unauthorized")
    }

    revalidatePath(`/projects/${rows[0].project_id}`)

    return {
      success: true,
      task: {
        id: rows[0].id,
        title: rows[0].title,
        description: rows[0].description || "",
        quadrant: rows[0].quadrant,
        projectId: rows[0].project_id,
        userId: rows[0].user_id,
        completed: rows[0].completed || false,
        createdAt: rows[0].created_at.toISOString(),
        updatedAt: rows[0].updated_at.toISOString(),
      },
    }
  } catch (error) {
    console.error("Error updating task:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update task",
    }
  }
}

export async function deleteTask(taskId: string) {
  try {
    const userId = await getUserId()
    if (!userId) {
      throw new Error("Unauthorized")
    }

    const { rows } = await sql`
      DELETE FROM tasks 
      WHERE id = ${taskId} 
      AND user_id = ${userId}
      RETURNING project_id
    `

    if (rows.length > 0) {
      revalidatePath(`/projects/${rows[0].project_id}`)
    }

    return { success: true }
  } catch (error) {
    console.error("Error deleting task:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete task",
    }
  }
}
