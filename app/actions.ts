"use server"

import { revalidatePath } from "next/cache"
import * as db from "@/lib/database"

export async function createPlayerAction(name: string, color: string) {
  try {
    const player = await db.createPlayer(name, color)
    revalidatePath("/")
    return { success: true, player }
  } catch (error) {
    console.error("Failed to create player:", error)
    return { success: false, error: "Failed to create player" }
  }
}

export async function createTaskAction(
  description: string,
  urgency: number,
  importance: number,
  assigneeIds: number[],
) {
  try {
    const task = await db.createTask(description, urgency, importance, assigneeIds)
    revalidatePath("/")
    return { success: true, task }
  } catch (error) {
    console.error("Failed to create task:", error)
    return { success: false, error: "Failed to create task" }
  }
}

export async function updateTaskAction(
  taskId: number,
  description: string,
  urgency: number,
  importance: number,
  assigneeIds: number[],
) {
  try {
    const task = await db.updateTask(taskId, description, urgency, importance, assigneeIds)
    revalidatePath("/")
    return { success: true, task }
  } catch (error) {
    console.error("Failed to update task:", error)
    return { success: false, error: "Failed to update task" }
  }
}

export async function deleteTaskAction(taskId: number) {
  try {
    await db.deleteTask(taskId)
    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("Failed to delete task:", error)
    return { success: false, error: "Failed to delete task" }
  }
}

export async function deletePlayerAction(playerId: number) {
  try {
    await db.deletePlayer(playerId)
    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("Failed to delete player:", error)
    return { success: false, error: "Failed to delete player" }
  }
}

export async function addTaskCommentAction(taskId: number, content: string, authorName: string) {
  try {
    const comment = await db.addTaskComment(taskId, content, authorName)
    revalidatePath("/")
    return { success: true, comment }
  } catch (error) {
    console.error("Failed to add comment:", error)
    return { success: false, error: "Failed to add comment" }
  }
}

export async function deleteTaskCommentAction(commentId: number) {
  try {
    await db.deleteTaskComment(commentId)
    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("Failed to delete comment:", error)
    return { success: false, error: "Failed to delete comment" }
  }
}

export async function createLineAction(fromTaskId: number, toTaskId: number, style?: "filled" | "open", size?: number, color?: string) {
  try {
    const line = await db.createLine(fromTaskId, toTaskId, style, size, color)
    revalidatePath("/")
    return { success: true, line }
  } catch (error) {
    console.error("Failed to create line:", error)
    return { success: false, error: "Failed to create line" }
  }
}

export async function toggleLineAction(fromTaskId: number, toTaskId: number, style?: "filled" | "open", size?: number, color?: string) {
  try {
    // Check if line already exists
    const lines = await db.getLines()
    const existingLine = lines.find(
      (line) =>
        (line.from_task_id === fromTaskId && line.to_task_id === toTaskId) ||
        (line.from_task_id === toTaskId && line.to_task_id === fromTaskId)
    )

    if (existingLine) {
      // Delete existing line
      await db.deleteLine(existingLine.id)
      revalidatePath("/")
      return { success: true, action: "deleted", lineId: existingLine.id }
    } else {
      // Create new line
      const line = await db.createLine(fromTaskId, toTaskId, style, size, color)
      revalidatePath("/")
      return { success: true, action: "created", line }
    }
  } catch (error) {
    console.error("Failed to toggle line:", error)
    return { success: false, error: "Failed to toggle line" }
  }
}

export async function deleteLineAction(lineId: number) {
  try {
    await db.deleteLine(lineId)
    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("Failed to delete line:", error)
    return { success: false, error: "Failed to delete line" }
  }
}

export async function initializeDatabaseAction() {
  try {
    await db.initializeDatabase()
    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("Failed to initialize database:", error)
    return { success: false, error: "Failed to initialize database" }
  }
}
