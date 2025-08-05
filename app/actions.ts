"use server"

import { auth } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"
import * as db from "@/lib/database"
import {
  createProject as createProjectDb,
  joinProject as joinProjectDb,
  deleteProject as deleteProjectDb,
  createProjectPlayer,
  createProjectTask,
  updateProjectTask,
  deleteProjectTask,
  deleteProjectPlayer,
  addProjectTaskComment,
  deleteProjectTaskComment,
  createProjectLine,
  deleteProjectLine,
  getUserProjectAccess,
  initializeProjectDatabase,
  getProjectLines,
} from "@/lib/project-database"

// Project management actions
export async function createProject(name: string, type: "personal" | "team") {
  const { userId } = await auth()

  if (!userId) {
    return { success: false, error: "Not authenticated" }
  }

  const result = await createProjectDb(name, type, userId)

  if (result.success) {
    revalidatePath("/projects")
  }

  return result
}

export async function deleteProjectAction(projectId: string) {
  const { userId } = await auth()

  if (!userId) {
    return { success: false, error: "Not authenticated" }
  }

  try {
    const hasAccess = await getUserProjectAccess(userId, projectId)
    if (!hasAccess) {
      return { success: false, error: "Access denied" }
    }

    await deleteProjectDb(projectId, userId)
    revalidatePath("/projects")
    return { success: true }
  } catch (error) {
    console.error("Failed to delete project:", error)
    return { success: false, error: "Failed to delete project" }
  }
}

export async function joinProject(inviteCode: string) {
  const { userId } = await auth()

  if (!userId) {
    return { success: false, error: "Not authenticated" }
  }

  const result = await joinProjectDb(inviteCode, userId)

  if (result.success) {
    revalidatePath("/projects")
  }

  return result
}

// Task management actions (project-specific)
export async function createPlayerAction(name: string, color: string, projectId?: string) {
  const { userId } = await auth()

  if (!userId) {
    return { success: false, error: "Not authenticated" }
  }

  try {
    if (projectId) {
      const hasAccess = await getUserProjectAccess(userId, projectId)
      if (!hasAccess) {
        return { success: false, error: "Access denied" }
      }

      const player = await createProjectPlayer(projectId, name, color)
      revalidatePath(`/projects/${projectId}`)
      return { success: true, player }
    } else {
      const player = await db.createPlayer(name, color)
      revalidatePath("/")
      return { success: true, player }
    }
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
  projectId?: string,
) {
  const { userId } = await auth()

  if (!userId) {
    return { success: false, error: "Not authenticated" }
  }

  try {
    if (projectId) {
      const hasAccess = await getUserProjectAccess(userId, projectId)
      if (!hasAccess) {
        return { success: false, error: "Access denied" }
      }

      const task = await createProjectTask(projectId, description, urgency, importance, assigneeIds)
      revalidatePath(`/projects/${projectId}`)
      return { success: true, task }
    } else {
      const task = await db.createTask(description, urgency, importance, assigneeIds)
      revalidatePath("/")
      return { success: true, task }
    }
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
  projectId?: string,
) {
  const { userId } = await auth()

  if (!userId) {
    return { success: false, error: "Not authenticated" }
  }

  try {
    if (projectId) {
      const hasAccess = await getUserProjectAccess(userId, projectId)
      if (!hasAccess) {
        return { success: false, error: "Access denied" }
      }

      const task = await updateProjectTask(projectId, taskId, description, urgency, importance, assigneeIds)
      revalidatePath(`/projects/${projectId}`)
      return { success: true, task }
    } else {
      const task = await db.updateTask(taskId, description, urgency, importance, assigneeIds)
      revalidatePath("/")
      return { success: true, task }
    }
  } catch (error) {
    console.error("Failed to update task:", error)
    return { success: false, error: "Failed to update task" }
  }
}

export async function deleteTaskAction(taskId: number, projectId?: string) {
  const { userId } = await auth()

  if (!userId) {
    return { success: false, error: "Not authenticated" }
  }

  try {
    if (projectId) {
      const hasAccess = await getUserProjectAccess(userId, projectId)
      if (!hasAccess) {
        return { success: false, error: "Access denied" }
      }

      await deleteProjectTask(projectId, taskId)
      revalidatePath(`/projects/${projectId}`)
    } else {
      await db.deleteTask(taskId)
      revalidatePath("/")
    }
    return { success: true }
  } catch (error) {
    console.error("Failed to delete task:", error)
    return { success: false, error: "Failed to delete task" }
  }
}

export async function deletePlayerAction(playerId: number, projectId?: string) {
  const { userId } = await auth()

  if (!userId) {
    return { success: false, error: "Not authenticated" }
  }

  try {
    if (projectId) {
      const hasAccess = await getUserProjectAccess(userId, projectId)
      if (!hasAccess) {
        return { success: false, error: "Access denied" }
      }

      await deleteProjectPlayer(projectId, playerId)
      revalidatePath(`/projects/${projectId}`)
    } else {
      await db.deletePlayer(playerId)
      revalidatePath("/")
    }
    return { success: true }
  } catch (error) {
    console.error("Failed to delete player:", error)
    return { success: false, error: "Failed to delete player" }
  }
}

export async function addTaskCommentAction(taskId: number, content: string, authorName: string, projectId?: string) {
  const { userId } = await auth()

  if (!userId) {
    return { success: false, error: "Not authenticated" }
  }

  try {
    if (projectId) {
      const hasAccess = await getUserProjectAccess(userId, projectId)
      if (!hasAccess) {
        return { success: false, error: "Access denied" }
      }

      const comment = await addProjectTaskComment(projectId, taskId, content, authorName)
      revalidatePath(`/projects/${projectId}`)
      return { success: true, comment }
    } else {
      const comment = await db.addTaskComment(taskId, content, authorName)
      revalidatePath("/")
      return { success: true, comment }
    }
  } catch (error) {
    console.error("Failed to add comment:", error)
    return { success: false, error: "Failed to add comment" }
  }
}

export async function deleteTaskCommentAction(commentId: number, projectId?: string) {
  const { userId } = await auth()

  if (!userId) {
    return { success: false, error: "Not authenticated" }
  }

  try {
    if (projectId) {
      const hasAccess = await getUserProjectAccess(userId, projectId)
      if (!hasAccess) {
        return { success: false, error: "Access denied" }
      }

      await deleteProjectTaskComment(projectId, commentId)
      revalidatePath(`/projects/${projectId}`)
    } else {
      await db.deleteTaskComment(commentId)
      revalidatePath("/")
    }
    return { success: true }
  } catch (error) {
    console.error("Failed to delete comment:", error)
    return { success: false, error: "Failed to delete comment" }
  }
}

export async function createLineAction(
  fromTaskId: number,
  toTaskId: number,
  style?: "filled" | "open",
  size?: number,
  color?: string,
  projectId?: string,
) {
  const { userId } = await auth()

  if (!userId) {
    return { success: false, error: "Not authenticated" }
  }

  try {
    if (projectId) {
      const hasAccess = await getUserProjectAccess(userId, projectId)
      if (!hasAccess) {
        return { success: false, error: "Access denied" }
      }

      const line = await createProjectLine(projectId, fromTaskId, toTaskId, style, size, color)
      revalidatePath(`/projects/${projectId}`)
      return { success: true, line }
    } else {
      const line = await db.createLine(fromTaskId, toTaskId, style, size, color)
      revalidatePath("/")
      return { success: true, line }
    }
  } catch (error) {
    console.error("Failed to create line:", error)
    return { success: false, error: "Failed to create line" }
  }
}

export async function toggleLineAction(
  fromTaskId: number,
  toTaskId: number,
  style?: "filled" | "open",
  size?: number,
  color?: string,
  projectId?: string,
) {
  const { userId } = await auth()

  if (!userId) {
    return { success: false, error: "Not authenticated" }
  }

  try {
    if (projectId) {
      const hasAccess = await getUserProjectAccess(userId, projectId)
      if (!hasAccess) {
        return { success: false, error: "Access denied" }
      }

      const lines = await getProjectLines(projectId)
      const existingLine = lines.find(
        (line) =>
          (line.from_task_id === fromTaskId && line.to_task_id === toTaskId) ||
          (line.from_task_id === toTaskId && line.to_task_id === fromTaskId),
      )

      if (existingLine) {
        await deleteProjectLine(projectId, existingLine.id)
        revalidatePath(`/projects/${projectId}`)
        return { success: true, action: "deleted", lineId: existingLine.id }
      } else {
        const line = await createProjectLine(projectId, fromTaskId, toTaskId, style, size, color)
        revalidatePath(`/projects/${projectId}`)
        return { success: true, action: "created", line }
      }
    } else {
      // Check if line already exists
      const existingLine = await db.getLine(fromTaskId, toTaskId)

      if (existingLine) {
        await db.deleteLine(existingLine.id)
        revalidatePath("/")
        return { success: true, action: "deleted", lineId: existingLine.id }
      } else {
        const line = await db.createLine(fromTaskId, toTaskId, style, size, color)
        revalidatePath("/")
        return { success: true, action: "created", line }
      }
    }
  } catch (error) {
    console.error("Failed to toggle line:", error)
    return { success: false, error: "Failed to toggle line" }
  }
}

export async function deleteLineAction(lineId: number, projectId?: string) {
  const { userId } = await auth()

  if (!userId) {
    return { success: false, error: "Not authenticated" }
  }

  try {
    if (projectId) {
      const hasAccess = await getUserProjectAccess(userId, projectId)
      if (!hasAccess) {
        return { success: false, error: "Access denied" }
      }

      await deleteProjectLine(projectId, lineId)
      revalidatePath(`/projects/${projectId}`)
    } else {
      await db.deleteLine(lineId)
      revalidatePath("/")
    }
    return { success: true }
  } catch (error) {
    console.error("Failed to delete line:", error)
    return { success: false, error: "Failed to delete line" }
  }
}

export async function initializeDatabaseAction() {
  try {
    await db.initializeDatabase()
    await initializeProjectDatabase()
    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("Failed to initialize database:", error)
    return { success: false, error: "Failed to initialize database" }
  }
}
