// Shared utility functions for Quadrants project
// Used across web and mobile applications

import type { Task } from '../types'

/**
 * Calculate priority score from urgency and importance
 * @param urgency - Urgency value (0-100)
 * @param importance - Importance value (0-100)
 * @returns Priority score (0-100)
 */
export function calculatePriorityScore(
  urgency: number,
  importance: number
): number {
  return urgency * 0.5 + importance * 0.5
}

/**
 * Get quadrant label based on urgency and importance
 * @param urgency - Urgency value (0-100)
 * @param importance - Importance value (0-100)
 * @returns Quadrant label
 */
export function getQuadrantLabel(
  urgency: number,
  importance: number
): string {
  if (urgency >= 50 && importance >= 50) return "Important & Urgent"
  if (urgency < 50 && importance >= 50) return "Important & Not Urgent"
  if (urgency >= 50 && importance < 50) return "Urgent & Not Important"
  return "Neither Important nor Urgent"
}

/**
 * Get quadrant color based on urgency and importance
 * @param urgency - Urgency value (0-100)
 * @param importance - Importance value (0-100)
 * @returns Color hex code
 */
export function getQuadrantColor(
  urgency: number,
  importance: number
): string {
  if (urgency >= 50 && importance >= 50) return "#ef4444" // Red
  if (urgency < 50 && importance >= 50) return "#3b82f6" // Blue
  if (urgency >= 50 && importance < 50) return "#f59e0b" // Orange
  return "#6b7280" // Gray
}

/**
 * Sort tasks by priority score (descending)
 * @param tasks - Array of tasks
 * @returns Sorted tasks
 */
export function sortTasksByPriority(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    const scoreA = calculatePriorityScore(a.urgency, a.importance)
    const scoreB = calculatePriorityScore(b.urgency, b.importance)
    return scoreB - scoreA
  })
}

/**
 * Check if a task overlaps with another task in the matrix
 * @param task1 - First task
 * @param task2 - Second task
 * @param threshold - Distance threshold for overlap detection (default: 18)
 * @returns True if tasks overlap
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

/**
 * Normalize task positions to center around (50, 50)
 * @param tasks - Array of tasks with urgency and importance
 * @returns Tasks with normalized positions
 */
export function normalizeTasks<T extends { urgency: number; importance: number }>(
  tasks: T[]
): T[] {
  if (tasks.length === 0) return tasks

  const avgUrgency = tasks.reduce((sum, t) => sum + t.urgency, 0) / tasks.length
  const avgImportance = tasks.reduce((sum, t) => sum + t.importance, 0) / tasks.length

  const offsetX = 50 - avgUrgency
  const offsetY = 50 - avgImportance

  return tasks.map(task => ({
    ...task,
    urgency: Math.max(0, Math.min(100, task.urgency + offsetX)),
    importance: Math.max(0, Math.min(100, task.importance + offsetY))
  }))
}

/**
 * Format date for display
 * @param date - Date string or Date object
 * @returns Formatted date string
 */
export function formatDate(date: string | Date | undefined): string {
  if (!date) return ''
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

/**
 * Format date with time for display
 * @param date - Date string or Date object
 * @returns Formatted date and time string
 */
export function formatDateTime(date: string | Date | undefined): string {
  if (!date) return ''
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

/**
 * Generate a random color for players
 * @returns Color hex code
 */
export function generateRandomColor(): string {
  const colors = [
    '#ef4444', // red
    '#f59e0b', // orange
    '#eab308', // yellow
    '#22c55e', // green
    '#3b82f6', // blue
    '#6366f1', // indigo
    '#8b5cf6', // purple
    '#ec4899', // pink
  ]
  return colors[Math.floor(Math.random() * colors.length)]
}

/**
 * Clamp a number between min and max
 * @param value - Value to clamp
 * @param min - Minimum value
 * @param max - Maximum value
 * @returns Clamped value
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}
