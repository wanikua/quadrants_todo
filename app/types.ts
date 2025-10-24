export interface Player {
  id: number
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
  owner_id: string
  access_code?: string
  created_at?: string
  updated_at?: string
}

export interface ProjectMember {
  id: string
  project_id: string
  user_id: string
  role: 'owner' | 'member'
  joined_at?: string
}

export type StateAction =
  | { type: 'SET_PLAYERS'; players: Player[] }
  | { type: 'ADD_PLAYER'; player: Player }
  | { type: 'DELETE_PLAYER'; playerId: number }
  | { type: 'SET_TASKS'; tasks: Task[] }
  | { type: 'ADD_TASK'; task: Task }
  | { type: 'UPDATE_TASK'; task: Task }
  | { type: 'DELETE_TASK'; taskId: number }
  | { type: 'SET_LINES'; lines: Line[] }
  | { type: 'ADD_LINE'; line: Line }
  | { type: 'DELETE_LINE'; lineId: number }
  | { type: 'TOGGLE_LINE'; from: number; to: number }
  | { type: 'ADD_COMMENT'; taskId: number; comment: Comment }
  | { type: 'DELETE_COMMENT'; taskId: number; commentId: number }
  | { type: 'SET_DATABASE_STATUS'; status: boolean }
  | { type: 'SET_DRAWING_MODE'; enabled: boolean }
  | { type: 'SET_SELECTED_TASK'; taskId: number | null }
  | { type: 'SET_STARTING_TASK'; taskId: number | null }

export interface AppState {
  players: Player[]
  tasks: TaskWithAssignees[]
  lines: Line[]
  isDrawingMode: boolean
  startingTaskForLine: number | null
  selectedTaskForDetail: number | null
  isDatabaseConnected: boolean
}
