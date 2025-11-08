// Shared type definitions for Quadrants project
// Used across web and mobile applications

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
  role: 'owner' | 'member'
  joined_at?: string
}

// AI-related types
export interface TaskPrediction {
  description: string
  urgency: number
  importance: number
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
  error?: string
}
