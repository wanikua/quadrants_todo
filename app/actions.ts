"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/database"
import { requireAuth } from "@/lib/auth"

export async function createTaskAction(formData: FormData) {
  const userId = await requireAuth()
  const projectId = formData.get("projectId") as string
  const title = formData.get("title") as string
  const quadrant = formData.get("quadrant") as string

  if (!projectId || !title || !quadrant) {
    throw new Error("Missing required fields")
  }

  await db.createTask({
    projectId,
    title,
    quadrant: quadrant as
      | "urgent-important"
      | "not-urgent-important"
      | "urgent-not-important"
      | "not-urgent-not-important",
    userId,
  })

  revalidatePath(`/projects/${projectId}`)
  return { success: true }
}

export async function createPlayerAction(formData: FormData) {
  const userId = await requireAuth()
  const name = formData.get("name") as string
  const email = formData.get("email") as string

  if (!name || !email) {
    throw new Error("Missing required fields")
  }

  const player = await db.createPlayer({
    name,
    email,
    userId,
  })

  revalidatePath("/players")
  return { success: true, player }
}

export async function updateTaskAction(
  taskId: string,
  updates: {
    title?: string
    completed?: boolean
    quadrant?: string
  },
) {
  await requireAuth()
  await db.updateTask(taskId, updates)
  revalidatePath("/projects")
  return { success: true }
}

export async function deleteTaskAction(taskId: string) {
  await requireAuth()
  await db.deleteTask(taskId)
  revalidatePath("/projects")
  return { success: true }
}

export async function createProjectAction(formData: FormData) {
  const userId = await requireAuth()
  const name = formData.get("name") as string
  const description = formData.get("description") as string

  if (!name) {
    throw new Error("Project name is required")
  }

  const project = await db.createProject({
    name,
    description: description || "",
    ownerId: userId,
  })

  revalidatePath("/projects")
  return { success: true, project }
}

export async function deleteProjectAction(projectId: string) {
  await requireAuth()
  await db.deleteProject(projectId)
  revalidatePath("/projects")
  return { success: true }
}
