"use server"

import { revalidatePath } from "next/cache"
import { sql } from "@/lib/db"
import { requireAuth } from "@/lib/auth"

export async function createTaskAction(
  projectId: string,
  taskData: {
    title: string
    description?: string
    urgency: number
    importance: number
    status?: string
  },
) {
  const userId = await requireAuth()

  // Verify project ownership
  const project = await sql`
    SELECT id FROM projects 
    WHERE id = ${projectId} AND user_id = ${userId}
  `

  if (project.length === 0) {
    throw new Error("Project not found or unauthorized")
  }

  const result = await sql`
    INSERT INTO tasks (
      project_id,
      title,
      description,
      urgency,
      importance,
      status,
      created_at,
      updated_at
    ) VALUES (
      ${projectId},
      ${taskData.title},
      ${taskData.description || ""},
      ${taskData.urgency},
      ${taskData.importance},
      ${taskData.status || "pending"},
      NOW(),
      NOW()
    )
    RETURNING *
  `

  revalidatePath(`/projects/${projectId}`)

  return result[0]
}

export async function createPlayerAction(playerData: {
  name: string
  email?: string
}) {
  const userId = await requireAuth()

  const result = await sql`
    INSERT INTO players (
      user_id,
      name,
      email,
      created_at
    ) VALUES (
      ${userId},
      ${playerData.name},
      ${playerData.email || null},
      NOW()
    )
    RETURNING *
  `

  revalidatePath("/players")

  return result[0]
}

export async function updateTaskAction(
  taskId: string,
  updates: {
    title?: string
    description?: string
    urgency?: number
    importance?: number
    status?: string
  },
) {
  const userId = await requireAuth()

  // Verify task ownership through project
  const task = await sql`
    SELECT t.id 
    FROM tasks t
    JOIN projects p ON t.project_id = p.id
    WHERE t.id = ${taskId} AND p.user_id = ${userId}
  `

  if (task.length === 0) {
    throw new Error("Task not found or unauthorized")
  }

  const setClauses = []
  const values = []

  if (updates.title !== undefined) {
    setClauses.push(`title = $${setClauses.length + 1}`)
    values.push(updates.title)
  }
  if (updates.description !== undefined) {
    setClauses.push(`description = $${setClauses.length + 1}`)
    values.push(updates.description)
  }
  if (updates.urgency !== undefined) {
    setClauses.push(`urgency = $${setClauses.length + 1}`)
    values.push(updates.urgency)
  }
  if (updates.importance !== undefined) {
    setClauses.push(`importance = $${setClauses.length + 1}`)
    values.push(updates.importance)
  }
  if (updates.status !== undefined) {
    setClauses.push(`status = $${setClauses.length + 1}`)
    values.push(updates.status)
  }

  setClauses.push("updated_at = NOW()")

  const result = await sql.query(
    `UPDATE tasks SET ${setClauses.join(", ")} WHERE id = $${values.length + 1} RETURNING *`,
    [...values, taskId],
  )

  const projectId = await sql`
    SELECT project_id FROM tasks WHERE id = ${taskId}
  `

  if (projectId.length > 0) {
    revalidatePath(`/projects/${projectId[0].project_id}`)
  }

  return result.rows[0]
}

export async function deleteTaskAction(taskId: string) {
  const userId = await requireAuth()

  // Get project ID before deletion
  const projectId = await sql`
    SELECT p.id as project_id
    FROM tasks t
    JOIN projects p ON t.project_id = p.id
    WHERE t.id = ${taskId} AND p.user_id = ${userId}
  `

  if (projectId.length === 0) {
    throw new Error("Task not found or unauthorized")
  }

  await sql`
    DELETE FROM tasks 
    WHERE id = ${taskId}
  `

  revalidatePath(`/projects/${projectId[0].project_id}`)

  return { success: true }
}
