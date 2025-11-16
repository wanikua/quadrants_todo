import {
  Task,
  TaskWithAssignees,
  Player,
  Comment,
  Line,
  Project,
  TaskPrediction,
  OrganizedTask,
  SyncData,
} from '../types'

// Base URL will be different for web vs mobile
let baseUrl = ''
// Auth token getter function (will be set by mobile app)
let getAuthToken: (() => Promise<string | null>) | null = null

export function setBaseUrl(url: string) {
  baseUrl = url
}

export function setAuthTokenGetter(getter: () => Promise<string | null>) {
  getAuthToken = getter
}

// Helper function for API calls with timeout
async function apiCall<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

  try {
    // Get auth token if getter is available
    const token = getAuthToken ? await getAuthToken() : null

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options?.headers as Record<string, string>,
    }

    // Add Authorization header if token exists
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
      console.log('[API] Sending request with token:', token.substring(0, 20) + '...')
    } else {
      console.log('[API] No auth token available')
    }

    const response = await fetch(`${baseUrl}${endpoint}`, {
      ...options,
      signal: controller.signal,
      headers,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Network error' }))
      throw new Error(error.error || `HTTP ${response.status}`)
    }

    return response.json()
  } catch (error) {
    clearTimeout(timeoutId)
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('请求超时，请检查网络连接')
    }
    throw error
  }
}

// ===== TASK OPERATIONS =====

export async function createTask(
  projectId: string,
  description: string,
  urgency: number,
  importance: number,
  assigneeIds?: number[]
): Promise<Task> {
  return apiCall('/api/tasks', {
    method: 'POST',
    body: JSON.stringify({ projectId, description, urgency, importance, assigneeIds }),
  })
}

export async function updateTask(
  taskId: number,
  updates: {
    description?: string
    urgency?: number
    importance?: number
    assigneeIds?: number[]
  }
): Promise<Task> {
  return apiCall(`/api/tasks/${taskId}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  })
}

export async function deleteTask(taskId: number): Promise<void> {
  return apiCall(`/api/tasks/${taskId}`, {
    method: 'DELETE',
  })
}

export async function completeTask(taskId: number): Promise<void> {
  return apiCall(`/api/tasks/${taskId}/complete`, {
    method: 'POST',
  })
}

export async function restoreTask(taskId: number): Promise<void> {
  return apiCall(`/api/tasks/${taskId}/restore`, {
    method: 'POST',
  })
}

// ===== PLAYER OPERATIONS =====

export async function createPlayer(
  projectId: string,
  name: string,
  color: string
): Promise<Player> {
  return apiCall('/api/players', {
    method: 'POST',
    body: JSON.stringify({ projectId, name, color }),
  })
}

export async function deletePlayer(playerId: number): Promise<void> {
  return apiCall(`/api/players/${playerId}`, {
    method: 'DELETE',
  })
}

// ===== COMMENT OPERATIONS =====

export async function addComment(
  taskId: number,
  content: string,
  authorName: string
): Promise<Comment> {
  return apiCall('/api/comments', {
    method: 'POST',
    body: JSON.stringify({ taskId, content, authorName }),
  })
}

export async function deleteComment(commentId: number): Promise<void> {
  return apiCall(`/api/comments/${commentId}`, {
    method: 'DELETE',
  })
}

// ===== PROJECT OPERATIONS =====

export async function getProjects(): Promise<Project[]> {
  return apiCall('/api/projects')
}

export async function createProject(
  name: string,
  type: 'personal' | 'team',
  description?: string
): Promise<Project> {
  return apiCall('/api/projects', {
    method: 'POST',
    body: JSON.stringify({ name, type, description }),
  })
}

export async function updateProject(
  projectId: string,
  updates: { name?: string; description?: string }
): Promise<Project> {
  return apiCall(`/api/projects/${projectId}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  })
}

export async function deleteProject(projectId: string): Promise<void> {
  return apiCall(`/api/projects/${projectId}`, {
    method: 'DELETE',
  })
}

export async function leaveProject(projectId: string): Promise<void> {
  return apiCall(`/api/projects/${projectId}/leave`, {
    method: 'POST',
  })
}

export async function joinProject(inviteCode: string): Promise<Project> {
  return apiCall('/api/projects/join', {
    method: 'POST',
    body: JSON.stringify({ inviteCode }),
  })
}

// ===== SYNC OPERATIONS =====

export async function syncProjectData(projectId: string): Promise<SyncData> {
  const response = await apiCall<{ success: boolean; data: SyncData }>(`/api/projects/${projectId}/sync`)
  return response.data
}

export async function updateUserActivity(projectId: string): Promise<void> {
  return apiCall(`/api/projects/${projectId}/activity`, {
    method: 'POST',
  })
}

// ===== AI OPERATIONS ⭐ CORE FEATURE =====

/**
 * Predict task priorities using AI
 * This is the CORE feature for Quick Add / Bulk Add
 */
export async function predictTaskPriorities(
  tasks: string[],
  projectId: string
): Promise<TaskPrediction[]> {
  const response = await apiCall<{ predictions: TaskPrediction[] }>(
    '/api/ai/predict-tasks',
    {
      method: 'POST',
      body: JSON.stringify({ tasks, projectId }),
    }
  )
  return response.predictions
}

/**
 * Organize tasks to prevent overlapping
 */
export async function organizeTasks(
  tasks: OrganizedTask[],
  projectId: string
): Promise<OrganizedTask[]> {
  const response = await apiCall<{ organizedTasks: OrganizedTask[] }>(
    '/api/ai/organize-tasks',
    {
      method: 'POST',
      body: JSON.stringify({ tasks, projectId }),
    }
  )
  return response.organizedTasks
}

/**
 * Learn from user adjustments (background task)
 */
export async function learnFromAdjustment(
  taskId: number,
  newUrgency: number,
  newImportance: number
): Promise<void> {
  return apiCall('/api/ai/learn-from-adjustment', {
    method: 'POST',
    body: JSON.stringify({ taskId, newUrgency, newImportance }),
  })
}
