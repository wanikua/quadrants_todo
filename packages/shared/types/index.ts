export interface Player {
  id: number
  project_id?: string
  user_id?: string
  name: string
  color: string
  created_at?: string
}

export interface Comment {
  id: number
  task_id: number
  content: string
  author_name: string
  created_at?: string
}

export interface Task {
  id: number
  project_id?: string
  description: string
  urgency: number
  importance: number
  predicted_urgency?: number
  predicted_importance?: number
  archived?: boolean
  created_at?: string | Date
  updated_at?: string | Date
  assignees?: Player[]
  comments?: Comment[]
}

export interface TaskWithAssignees extends Task {
  assignees: Player[]
  comments?: Comment[]
}

export interface Line {
  id: number
  project_id?: string
  from_task_id: number
  to_task_id: number
  style?: string
  size?: number
  color?: string
  created_at?: string
}

export interface Project {
  id: string
  name: string
  description?: string
  type: 'personal' | 'team'
  owner_id: string
  invite_code?: string
  created_at?: string
  updated_at?: string
}

export interface UserActivity {
  id: number
  project_id: string
  user_id: string
  last_seen: Date | string
}

export interface ProjectMember {
  id: string
  project_id: string
  user_id: string
  role: 'owner' | 'admin' | 'member'
  joined_at?: string
}

// AI Types
export interface TaskPrediction {
  description: string
  urgency: number
  importance: number
  reasoning?: string
  assigneeIds?: number[]
}

export interface OrganizedTask {
  id: number
  urgency: number
  importance: number
}

export interface AIResponse {
  predictions?: TaskPrediction[]
  organizedTasks?: OrganizedTask[]
  success?: boolean
  error?: string
}

// Sync Types
export interface SyncData {
  tasks: TaskWithAssignees[]
  players: Player[]
  lines: Line[]
  activeUsers?: number
}
