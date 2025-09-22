export interface Player {
  id: string | number
  name: string
  color: string
  created_at?: string
}

export interface Comment {
  id: string | number
  task_id: string | number
  content: string
  author_name: string
  created_at?: string
}

export interface Task {
  id: string | number
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
  id: string | number
  from_task_id: string | number
  to_task_id: string | number
  style?: string
  size?: string
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
  | { type: 'DELETE_PLAYER'; playerId: string | number }
  | { type: 'SET_TASKS'; tasks: Task[] }
  | { type: 'ADD_TASK'; task: Task }
  | { type: 'UPDATE_TASK'; task: Task }
  | { type: 'DELETE_TASK'; taskId: string | number }
  | { type: 'SET_LINES'; lines: Line[] }
  | { type: 'ADD_LINE'; line: Line }
  | { type: 'DELETE_LINE'; lineId: string | number }
  | { type: 'TOGGLE_LINE'; from: string | number; to: string | number }
  | { type: 'ADD_COMMENT'; taskId: string | number; comment: Comment }
  | { type: 'DELETE_COMMENT'; taskId: string | number; commentId: string | number }
  | { type: 'SET_DATABASE_STATUS'; status: boolean }
  | { type: 'SET_DRAWING_MODE'; enabled: boolean }
  | { type: 'SET_SELECTED_TASK'; taskId: string | number | null }
  | { type: 'SET_STARTING_TASK'; taskId: string | number | null }

export interface AppState {
  players: Player[]
  tasks: TaskWithAssignees[]
  lines: Line[]
  isDrawingMode: boolean
  startingTaskForLine: string | number | null
  selectedTaskForDetail: string | number | null
  isDatabaseConnected: boolean
}
