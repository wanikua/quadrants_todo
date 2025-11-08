// Shared API client for Quadrants project
// Used across web and mobile applications

import type {
  Task,
  Player,
  Comment,
  Project,
  TaskPrediction,
  AIResponse
} from '../types'

// API configuration
const getApiUrl = (): string => {
  if (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL
  }
  if (typeof window !== 'undefined') {
    return window.location.origin
  }
  return 'https://quadrants.vercel.app'
}

const API_URL = getApiUrl()

// Helper function for API requests
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      error: response.statusText
    }))
    throw new Error(error.error || error.message || 'API request failed')
  }

  return response.json()
}

// ===== Task API =====

export async function getTasks(projectId: string): Promise<Task[]> {
  return apiRequest<Task[]>(`/api/projects/${projectId}/tasks`)
}

export async function createTask(
  projectId: string,
  data: {
    description: string
    urgency: number
    importance: number
    assigneeIds?: number[]
  }
): Promise<Task> {
  return apiRequest<Task>(`/api/projects/${projectId}/tasks`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateTask(
  taskId: number,
  data: {
    description?: string
    urgency?: number
    importance?: number
    assigneeIds?: number[]
  }
): Promise<Task> {
  return apiRequest<Task>(`/api/tasks/${taskId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export async function deleteTask(taskId: number): Promise<void> {
  return apiRequest<void>(`/api/tasks/${taskId}`, {
    method: 'DELETE',
  })
}

export async function completeTask(taskId: number): Promise<Task> {
  return apiRequest<Task>(`/api/tasks/${taskId}/complete`, {
    method: 'POST',
  })
}

// ===== Player API =====

export async function getPlayers(projectId: string): Promise<Player[]> {
  return apiRequest<Player[]>(`/api/projects/${projectId}/players`)
}

export async function createPlayer(
  projectId: string,
  data: {
    name: string
    color: string
  }
): Promise<Player> {
  return apiRequest<Player>(`/api/projects/${projectId}/players`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function deletePlayer(playerId: number): Promise<void> {
  return apiRequest<void>(`/api/players/${playerId}`, {
    method: 'DELETE',
  })
}

// ===== Comment API =====

export async function addComment(
  taskId: number,
  data: {
    content: string
    authorName: string
  }
): Promise<Comment> {
  return apiRequest<Comment>(`/api/tasks/${taskId}/comments`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function deleteComment(commentId: number): Promise<void> {
  return apiRequest<void>(`/api/comments/${commentId}`, {
    method: 'DELETE',
  })
}

// ===== Project API =====

export async function getProjects(): Promise<Project[]> {
  return apiRequest<Project[]>('/api/projects')
}

export async function getProject(projectId: string): Promise<Project> {
  return apiRequest<Project>(`/api/projects/${projectId}`)
}

export async function createProject(data: {
  name: string
  description?: string
  type: 'personal' | 'team'
}): Promise<Project> {
  return apiRequest<Project>('/api/projects', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateProject(
  projectId: string,
  data: {
    name?: string
    description?: string
  }
): Promise<Project> {
  return apiRequest<Project>(`/api/projects/${projectId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export async function deleteProject(projectId: string): Promise<void> {
  return apiRequest<void>(`/api/projects/${projectId}`, {
    method: 'DELETE',
  })
}

export async function joinProject(inviteCode: string): Promise<Project> {
  return apiRequest<Project>('/api/projects/join', {
    method: 'POST',
    body: JSON.stringify({ inviteCode }),
  })
}

// ===== AI API (CRITICAL for Quick Add feature) =====

/**
 * Predict task priorities using AI
 * This is the CORE functionality for the Quick Add feature
 * @param tasks - Array of task descriptions
 * @param projectId - Project ID for context
 * @returns Array of predictions with urgency and importance values
 */
export async function predictTaskPriorities(
  tasks: string[],
  projectId: string
): Promise<TaskPrediction[]> {
  const response = await apiRequest<AIResponse>('/api/ai/predict-tasks', {
    method: 'POST',
    body: JSON.stringify({ tasks, projectId }),
  })

  if (response.error) {
    throw new Error(response.error)
  }

  return response.predictions || []
}

/**
 * Organize tasks to avoid overlaps using AI
 * @param tasks - Array of tasks with current positions
 * @param projectId - Project ID
 * @returns Array of tasks with optimized positions
 */
export async function organizeTasks(
  tasks: { id: number; urgency: number; importance: number }[],
  projectId: string
): Promise<{ id: number; urgency: number; importance: number }[]> {
  const response = await apiRequest<AIResponse>('/api/ai/organize-tasks', {
    method: 'POST',
    body: JSON.stringify({ tasks, projectId }),
  })

  if (response.error) {
    throw new Error(response.error)
  }

  return response.organizedTasks || []
}

/**
 * Send user adjustment data to AI learning system
 * @param taskId - Task ID
 * @param newUrgency - Adjusted urgency value
 * @param newImportance - Adjusted importance value
 */
export async function learnFromAdjustment(
  taskId: number,
  newUrgency: number,
  newImportance: number
): Promise<void> {
  await apiRequest<{ success: boolean }>('/api/ai/learn-from-adjustment', {
    method: 'POST',
    body: JSON.stringify({ taskId, newUrgency, newImportance }),
  })
}

// ===== Sync API =====

/**
 * Get all project data for real-time sync
 * @param projectId - Project ID
 * @returns Complete project data
 */
export async function syncProjectData(projectId: string): Promise<{
  tasks: Task[]
  players: Player[]
  activeUsers: number
}> {
  return apiRequest(`/api/projects/${projectId}/sync`)
}
