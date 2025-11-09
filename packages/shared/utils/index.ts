import { Task, TaskWithAssignees } from '../types'

/**
 * Calculate priority score (0-100)
 * Formula: (urgency + importance) / 2
 */
export function calculatePriorityScore(urgency: number, importance: number): number {
  return (urgency + importance) / 2
}

/**
 * Get quadrant label based on urgency and importance
 */
export function getQuadrantLabel(urgency: number, importance: number): string {
  if (urgency >= 50 && importance >= 50) return '重要且紧急'
  if (urgency < 50 && importance >= 50) return '重要不紧急'
  if (urgency >= 50 && importance < 50) return '紧急不重要'
  return '不紧急不重要'
}

/**
 * Get quadrant color
 */
export function getQuadrantColor(urgency: number, importance: number): string {
  if (urgency >= 50 && importance >= 50) return 'red'
  if (urgency < 50 && importance >= 50) return 'yellow'
  if (urgency >= 50 && importance < 50) return 'blue'
  return 'gray'
}

/**
 * Sort tasks by priority (highest first)
 */
export function sortTasksByPriority(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    const scoreA = calculatePriorityScore(a.urgency, a.importance)
    const scoreB = calculatePriorityScore(b.urgency, b.importance)
    return scoreB - scoreA
  })
}

/**
 * Find highest priority task
 */
export function findHighestPriorityTask(tasks: Task[]): Task | null {
  if (tasks.length === 0) return null
  return tasks.reduce((highest, task) => {
    const highestScore = calculatePriorityScore(highest.urgency, highest.importance)
    const taskScore = calculatePriorityScore(task.urgency, task.importance)
    return taskScore > highestScore ? task : highest
  })
}

/**
 * Clamp value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

/**
 * Format date to relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: string | Date): string {
  const now = new Date()
  const past = new Date(date)
  const diffMs = now.getTime() - past.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return '刚刚'
  if (diffMins < 60) return `${diffMins}分钟前`
  if (diffHours < 24) return `${diffHours}小时前`
  if (diffDays < 7) return `${diffDays}天前`
  return past.toLocaleDateString('zh-CN')
}

/**
 * Parse @mentions from text
 * Example: "@alice 完成报告" => { text: "完成报告", mentions: ["alice"] }
 */
export function parseMentions(text: string): { cleanText: string; mentions: string[] } {
  const mentionRegex = /@(\w+)/g
  const mentions: string[] = []
  let match

  while ((match = mentionRegex.exec(text)) !== null) {
    mentions.push(match[1])
  }

  const cleanText = text.replace(mentionRegex, '').trim()
  return { cleanText, mentions }
}

/**
 * Split text into tasks by common delimiters
 */
export function splitTaskText(text: string): string[] {
  return text
    .split(/[\n,;。；]+/)
    .map(t => t.trim())
    .filter(t => t.length > 0)
}

/**
 * Generate random color from predefined palette
 */
export const PLAYER_COLORS = [
  '#3b82f6', // blue
  '#ef4444', // red
  '#10b981', // green
  '#f59e0b', // yellow
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
]

export function getRandomColor(): string {
  return PLAYER_COLORS[Math.floor(Math.random() * PLAYER_COLORS.length)]
}

/**
 * Normalize tasks to center point (50, 50)
 */
export function normalizeTasks(tasks: { urgency: number; importance: number }[]): void {
  if (tasks.length === 0) return

  const avgUrgency = tasks.reduce((sum, t) => sum + t.urgency, 0) / tasks.length
  const avgImportance = tasks.reduce((sum, t) => sum + t.importance, 0) / tasks.length
  const offsetX = 50 - avgUrgency
  const offsetY = 50 - avgImportance

  tasks.forEach(task => {
    task.urgency = clamp(task.urgency + offsetX, 0, 100)
    task.importance = clamp(task.importance + offsetY, 0, 100)
  })
}

/**
 * Check if two tasks overlap (within threshold distance)
 */
export function tasksOverlap(
  task1: { urgency: number; importance: number },
  task2: { urgency: number; importance: number },
  threshold: number = 18
): boolean {
  const dx = task1.urgency - task2.urgency
  const dy = task1.importance - task2.importance
  const distance = Math.sqrt(dx * dx + dy * dy)
  return distance < threshold
}
