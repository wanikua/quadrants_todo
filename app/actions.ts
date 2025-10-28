"use server"

import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/database"
import { revalidatePath } from "next/cache"
import type { Task } from "@/app/types"

export async function createTaskAction(projectId: string, title: string, quadrant: string) {
  try {
    const user = await requireAuth()
    await db.createTask({
      projectId,
      title,
      quadrant,
      userId: user.id,
    })
    revalidatePath(`/projects/${projectId}`)
    return { success: true }
  } catch (error) {
    console.error("Error creating task:", error)
    return { error: "Failed to create task" }
  }
}

export async function updateTaskAction(taskId: string, updates: Partial<Task>) {
  try {
    await requireAuth() // Verify authentication
    await db.updateTask(taskId, updates)
    return { success: true }
  } catch (error) {
    console.error("Error updating task:", error)
    return { error: "Failed to update task" }
  }
}

export async function deleteTaskAction(taskId: string) {
  try {
    await requireAuth() // Verify authentication
    await db.deleteTask(taskId)
    return { success: true }
  } catch (error) {
    console.error("Error deleting task:", error)
    return { error: "Failed to delete task" }
  }
}

export async function createProjectAction(name: string, description?: string) {
  try {
    const user = await requireAuth()
    const project = await db.createProject({
      name,
      description: description || "",
      ownerId: user.id,
    })
    revalidatePath("/projects")
    return { success: true, projectId: project.id }
  } catch (error) {
    console.error("Error creating project:", error)
    return { error: "Failed to create project" }
  }
}

export async function createPlayerAction(name: string) {
  try {
    await requireAuth() // Verify authentication
    // Implement player creation logic if needed
    return { success: true }
  } catch (error) {
    console.error("Error creating player:", error)
    return { error: "Failed to create player" }
  }
}
