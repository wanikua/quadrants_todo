export interface Player {
  id: string
  name: string
  color: string
  created_at?: string
}

export interface Comment {
  id: string
  task_id: string
  content: string
  author_name: string
  created_at?: string
}

export interface Task {
  id: string
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
  id: string
  from_task_id: string
  to_task_id: string
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
  | { type: 'DELETE_PLAYER'; playerId: string }
  | { type: 'SET_TASKS'; tasks: Task[] }
  | { type: 'ADD_TASK'; task: Task }
  | { type: 'UPDATE_TASK'; task: Task }
  | { type: 'DELETE_TASK'; taskId: string }
  | { type: 'SET_LINES'; lines: Line[] }
  | { type: 'ADD_LINE'; line: Line }
  | { type: 'DELETE_LINE'; lineId: string }
  | { type: 'TOGGLE_LINE'; from: string; to: string }
  | { type: 'ADD_COMMENT'; taskId: string; comment: Comment }
  | { type: 'DELETE_COMMENT'; taskId: string; commentId: string }
  | { type: 'SET_DATABASE_STATUS'; status: boolean }
  | { type: 'SET_DRAWING_MODE'; enabled: boolean }
  | { type: 'SET_SELECTED_TASK'; taskId: string | null }
  | { type: 'SET_STARTING_TASK'; taskId: string | null }

export interface AppState {
  players: Player[]
  tasks: TaskWithAssignees[]
  lines: Line[]
  isDrawingMode: boolean
  startingTaskForLine: string | null
  selectedTaskForDetail: string | null
  isDatabaseConnected: boolean
}
