"use client"

import { useState, useCallback, useMemo, useEffect, useRef } from "react"
import type { TaskWithAssignees, Player, Line } from "./types"
import QuadrantMatrixMap from "@/components/QuadrantMatrixMap"
import { logger, debug } from "@/lib/debug"
import { createTask, deleteTask, updateTask as updateTaskAction, deletePlayer, updatePlayer, addComment, deleteComment as deleteCommentAction, updateUserActivity, getActiveUserCount, getArchivedTasks, restoreTask } from "@/app/db/actions"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Map as MapIcon, List, Trash2, Filter, X, Users, Plus, Settings, ChevronDown, Check, Edit, Wand2, Sparkles, LogOut, HelpCircle, Share2, Archive } from "lucide-react"
import TaskDetailDialog from "@/components/TaskDetailDialog"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { BulkTaskInput } from "@/components/BulkTaskInput"
import { toast } from "sonner"

interface QuadrantTodoClientProps {
  initialTasks: TaskWithAssignees[]
  initialPlayers: Player[]
  initialLines: Line[]
  isOfflineMode: boolean
  projectId: string
  projectType: "personal" | "team"
  userName?: string
  projectName?: string
  userRole?: "owner" | "admin" | "member"
  userId?: string
  onFullscreenChange?: (isFullscreen: boolean) => void
}

export default function QuadrantTodoClient({
  initialTasks,
  initialPlayers,
  initialLines,
  isOfflineMode,
  projectId,
  projectType,
  userName,
  projectName,
  userRole,
  userId,
  onFullscreenChange,
}: QuadrantTodoClientProps) {
  const router = useRouter()

  // Local state for optimistic updates
  const [tasks, setTasks] = useState<TaskWithAssignees[]>(initialTasks)
  const [players, setPlayers] = useState<Player[]>(initialPlayers)
  const [lines, setLines] = useState<Line[]>(initialLines)


  const [selectedTask, setSelectedTask] = useState<TaskWithAssignees | null>(null)
  const [isTaskDetailOpen, setIsTaskDetailOpen] = useState(false)
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false)
  const [isBulkAddOpen, setIsBulkAddOpen] = useState(false)
  const [isSubmittingTask, setIsSubmittingTask] = useState(false)
  const [showHelpDialog, setShowHelpDialog] = useState(false)
  const [isFocusMode, setIsFocusMode] = useState(false)
  const [focusIndex, setFocusIndex] = useState(0)
  const [selectedPlayerFilter, setSelectedPlayerFilter] = useState<string>("all")
  const [filterQuadrant, setFilterQuadrant] = useState<'all' | 'urgent-important' | 'urgent-not-important' | 'not-urgent-important' | 'not-urgent-not-important'>('all')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [taskToDelete, setTaskToDelete] = useState<TaskWithAssignees | null>(null)
  const [deleteTaskDialogOpen, setDeleteTaskDialogOpen] = useState(false)
  const [isManagePlayersOpen, setIsManagePlayersOpen] = useState(false)
  const [editingPlayerId, setEditingPlayerId] = useState<number | null>(null)
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date())
  const [activeUserCount, setActiveUserCount] = useState<number>(0)
  const [pendingUpdateTaskIds, setPendingUpdateTaskIds] = useState<Set<number>>(new Set())
  const [completedTaskIds, setCompletedTaskIds] = useState<Set<number>>(new Set())

  // Project editing state
  const [isEditingProject, setIsEditingProject] = useState(false)
  const [editedProjectName, setEditedProjectName] = useState(projectName || "")
  const [editedProjectDescription, setEditedProjectDescription] = useState("")
  const [isArchiving, setIsArchiving] = useState(false)
  const [showArchiveDialog, setShowArchiveDialog] = useState(false)
  const [currentView, setCurrentView] = useState<'map' | 'list'>('map')

  // Archived tasks state
  const [archivedTasksDialogOpen, setArchivedTasksDialogOpen] = useState(false)
  const [archivedTasks, setArchivedTasks] = useState<any[]>([])
  const [isLoadingArchived, setIsLoadingArchived] = useState(false)

  // Calculate top 3 priority tasks for Focus mode
  const topPriorityTasks = useMemo(() => {
    return [...tasks]
      .sort((a, b) => {
        // Balanced priority algorithm: importance (60%) + urgency (40%)
        const priorityA = a.importance * 0.6 + a.urgency * 0.4
        const priorityB = b.importance * 0.6 + b.urgency * 0.4
        return priorityB - priorityA
      })
      .slice(0, 3)
  }, [tasks])

  // Current focused task for Focus mode
  const focusedTask = isFocusMode && topPriorityTasks[focusIndex] ? topPriorityTasks[focusIndex] : null

  // One-click organize state
  const [isOrganizing, setIsOrganizing] = useState(false)
  const [isOrganizingInProgress, setIsOrganizingInProgress] = useState(false) // Prevent rapid double-clicks
  const [isOrganizingLoading, setIsOrganizingLoading] = useState(false) // Full-screen loading overlay
  const [originalTaskPositions, setOriginalTaskPositions] = useState<Map<number, { urgency: number; importance: number }>>(new Map())

  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Toolbar drag state
  const [toolbarX, setToolbarX] = useState(0) // Offset from center
  const [isDraggingToolbar, setIsDraggingToolbar] = useState(false)
  const toolbarDragStartX = useRef(0)
  const toolbarStartOffset = useRef(0)

  // Focus mode: Listen for ESC key globally
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFocusMode) {
        setIsFocusMode(false)
        setFocusIndex(0)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isFocusMode])

  // User activity detection for pausing sync during interactions
  const [lastUserActivity, setLastUserActivity] = useState<number>(Date.now())
  const [isUserActive, setIsUserActive] = useState(false)

  // Handle fullscreen change - notify parent component
  const handleFullscreenChange = useCallback((value: boolean) => {
    setIsFullscreen(value)
    onFullscreenChange?.(value)
  }, [onFullscreenChange])

  // Toolbar drag handlers
  const handleToolbarDragStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    setIsDraggingToolbar(true)
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    toolbarDragStartX.current = clientX
    toolbarStartOffset.current = toolbarX
  }, [toolbarX])

  const handleToolbarDrag = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isDraggingToolbar) return
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const deltaX = clientX - toolbarDragStartX.current
    const maxOffset = window.innerWidth / 2 - 150 // Keep toolbar visible
    const newX = Math.max(-maxOffset, Math.min(maxOffset, toolbarStartOffset.current + deltaX))
    setToolbarX(newX)
  }, [isDraggingToolbar])

  const handleToolbarDragEnd = useCallback(() => {
    setIsDraggingToolbar(false)
  }, [])

  // Toolbar drag event listeners
  useEffect(() => {
    if (isDraggingToolbar) {
      const onMove = (e: MouseEvent | TouchEvent) => handleToolbarDrag(e)
      const onEnd = () => handleToolbarDragEnd()

      window.addEventListener('mousemove', onMove)
      window.addEventListener('mouseup', onEnd)
      window.addEventListener('touchmove', onMove)
      window.addEventListener('touchend', onEnd)

      return () => {
        window.removeEventListener('mousemove', onMove)
        window.removeEventListener('mouseup', onEnd)
        window.removeEventListener('touchmove', onMove)
        window.removeEventListener('touchend', onEnd)
      }
    }
  }, [isDraggingToolbar, handleToolbarDrag, handleToolbarDragEnd])

  // Track user activity to pause sync during interactions
  const handleUserActivity = useCallback(() => {
    setLastUserActivity(Date.now())
    if (!isUserActive) {
      setIsUserActive(true)
    }
  }, [isUserActive])

  // Global user activity listener
  useEffect(() => {
    const events = ['mousedown', 'keydown', 'touchstart', 'scroll']
    const handler = () => handleUserActivity()

    events.forEach(event => {
      document.addEventListener(event, handler, { passive: true })
    })

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handler)
      })
    }
  }, [handleUserActivity])

  // Sync initial data when props change
  useEffect(() => {
    setTasks(initialTasks)
  }, [initialTasks])

  useEffect(() => {
    setPlayers(initialPlayers)
  }, [initialPlayers])

  useEffect(() => {
    setLines(initialLines)
  }, [initialLines])

  // Sync selectedTask when tasks change (e.g., after router.refresh())
  useEffect(() => {
    if (selectedTask) {
      const updatedTask = tasks.find(t => t.id === selectedTask.id)
      if (updatedTask) {
        setSelectedTask(updatedTask)
      }
    }
  }, [tasks, selectedTask])

  const isMobile = false // For responsive layout adjustments

  // Update user activity heartbeat - runs independently
  useEffect(() => {
    if (projectType === 'team' && !isOfflineMode) {
      // Initial update
      updateUserActivity(projectId)

      // Update activity every 2 seconds for faster detection
      const activityInterval = setInterval(() => {
        updateUserActivity(projectId)
      }, 2000)

      return () => clearInterval(activityInterval)
    }
  }, [projectType, projectId, isOfflineMode])

  // Sync function to fetch latest data from server
  const syncData = useCallback(async () => {
    // Skip sync if in organize mode to preserve preview
    if (isOrganizing) {
      logger.sync('Skipping during organize preview')
      return
    }

    // Skip sync if user is actively interacting (within 2 seconds of last activity)
    const timeSinceActivity = Date.now() - lastUserActivity
    if (isUserActive && timeSinceActivity < 2000) {
      logger.sync('Skipping during user activity')
      return
    }

    // Reset user active flag if inactive for 2+ seconds
    if (isUserActive && timeSinceActivity >= 2000) {
      setIsUserActive(false)
    }

    try {
      logger.sync('Fetching data from server...')
      const response = await fetch(`/api/projects/${projectId}/sync`)
      if (response.ok) {
        const result = await response.json()
        logger.sync('Data received:', {
          tasks: result.data?.tasks?.length || 0,
          players: result.data?.players?.length || 0,
          lines: result.data?.lines?.length || 0,
          pendingUpdates: pendingUpdateTaskIds.size
        })
        if (result.success && result.data) {
          // Smart merge with updated_at comparison
          setTasks(prevTasks => {
            const serverTasks = result.data.tasks || []

            // If no pending updates, use server data directly
            if (pendingUpdateTaskIds.size === 0) {
              return serverTasks
            }

            // Merge strategy: use whichever version is newer based on updated_at
            const mergedTasks = [...prevTasks]
            const localTaskMap = new Map(prevTasks.map(t => [t.id, t]))

            serverTasks.forEach((serverTask: TaskWithAssignees) => {
              // Skip tasks that have pending updates
              if (pendingUpdateTaskIds.has(serverTask.id)) {
                logger.sync('Skipping task with pending update:', serverTask.id)
                return
              }

              const localTask = localTaskMap.get(serverTask.id)
              const localIndex = mergedTasks.findIndex(t => t.id === serverTask.id)

              if (localIndex >= 0) {
                // Compare timestamps - only use server data if it's newer
                const serverTime = serverTask.updated_at ? new Date(serverTask.updated_at).getTime() : 0
                const localTime = localTask?.updated_at ? new Date(localTask.updated_at).getTime() : 0

                if (serverTime >= localTime) {
                  mergedTasks[localIndex] = serverTask
                  logger.sync(`Updated task ${serverTask.id} (server newer)`)
                } else {
                  logger.sync(`Keeping local task ${serverTask.id} (local newer)`)
                }
              } else {
                // Add new task from server
                mergedTasks.push(serverTask)
                logger.sync(`Added new task ${serverTask.id}`)
              }
            })

            // Remove tasks that don't exist on server (unless they have pending updates)
            const serverTaskIds = new Set(serverTasks.map((t: TaskWithAssignees) => t.id))
            const filteredTasks = mergedTasks.filter((task: TaskWithAssignees) =>
              serverTaskIds.has(task.id) || pendingUpdateTaskIds.has(task.id)
            )

            return filteredTasks
          })

          setPlayers(result.data.players || [])
          setLines(result.data.lines || [])
          setLastSyncTime(new Date())
        }
      } else {
        logger.sync('Failed:', response.status, response.statusText)
      }
    } catch (error) {
      logger.sync('Error:', error)
    }
  }, [projectId, isOrganizing, pendingUpdateTaskIds, lastUserActivity, isUserActive])

  // Check for active users - only enables sync if multiple users detected
  useEffect(() => {
    if (projectType === 'team' && !isOfflineMode) {
      let checkInterval: ReturnType<typeof setInterval> | null = null

      const checkActiveUsers = async () => {
        const result = await getActiveUserCount(projectId)
        setActiveUserCount(result.count)
      }

      // Initial check
      checkActiveUsers()

      // Check every 2 seconds for faster user detection
      checkInterval = setInterval(checkActiveUsers, 2000)

      return () => {
        if (checkInterval) clearInterval(checkInterval)
      }
    }
  }, [projectType, projectId, isOfflineMode])

  // Real-time sync - always enabled for team projects
  useEffect(() => {
    logger.sync('Effect triggered - projectType:', projectType, 'isOfflineMode:', isOfflineMode, 'activeUserCount:', activeUserCount)

    if (projectType === 'team' && !isOfflineMode) {
      logger.sync('Starting real-time sync, activeUserCount:', activeUserCount)
      let interval: ReturnType<typeof setInterval> | null = null
      let isPageVisible = true

      // Determine sync interval based on user count
      // Multiple users: 1500ms (balanced, prevents conflicts)
      // Single user: 3000ms (conserves resources)
      const syncInterval = activeUserCount > 1 ? 1500 : 3000
      logger.sync(`Using interval: ${syncInterval}ms (${activeUserCount > 1 ? 'multi-user' : 'single-user'} mode)`)

      // Check if page is visible
      const handleVisibilityChange = () => {
        isPageVisible = !document.hidden

        if (isPageVisible) {
          logger.sync('Page visible, resuming sync')
          // Immediately sync when page becomes visible
          syncData()

          // Resume polling
          if (interval) clearInterval(interval)
          interval = setInterval(() => {
            if (isPageVisible) {
              syncData()
            }
          }, syncInterval)
        } else {
          logger.sync('Page hidden, pausing sync')
          // Pause polling when page is hidden to save resources
          if (interval) clearInterval(interval)
        }
      }

      // Listen for visibility changes
      document.addEventListener('visibilitychange', handleVisibilityChange)

      // Start initial polling
      logger.sync(`Starting polling every ${syncInterval}ms`)
      interval = setInterval(() => {
        if (isPageVisible) {
          syncData()
        }
      }, syncInterval)

      // Initial sync
      syncData()

      return () => {
        logger.sync('Stopping sync')
        if (interval) clearInterval(interval)
        document.removeEventListener('visibilitychange', handleVisibilityChange)
      }
    }
  }, [projectType, isOfflineMode, activeUserCount, syncData])

  // Format time ago
  const getTimeAgo = useCallback((date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000)
    if (seconds < 5) return 'just now'
    if (seconds < 60) return `${seconds}s ago`
    return `${Math.floor(seconds / 60)}m ago`
  }, [])

  // Update time display every second
  const [, setTick] = useState(0)
  useEffect(() => {
    if (projectType === 'team') {
      const timer = setInterval(() => setTick(t => t + 1), 1000)
      return () => clearInterval(timer)
    }
  }, [projectType])

  // Find current user's player for default task assignment
  const currentUserPlayer = useMemo(() => {
    if (!userName) return null
    return players.find(p => p.name === userName)
  }, [userName, players])

  // Initialize task data with current user as default assignee
  const [newTaskData, setNewTaskData] = useState({
    description: "",
    urgency: 50,
    importance: 50,
    assigneeIds: (projectType === "team" && currentUserPlayer) ? [currentUserPlayer.id] : [] as number[],
  })

  // Filter and sort tasks
  const filteredAndSortedTasks = useMemo(() => {
    let filtered = tasks

    if (selectedPlayerFilter !== "all") {
      if (selectedPlayerFilter === "unassigned") {
        filtered = tasks.filter(task => !task.assignees || task.assignees.length === 0)
      } else {
        const playerId = parseInt(selectedPlayerFilter)
        filtered = tasks.filter(task =>
          task.assignees && task.assignees.some(p => p.id === playerId)
        )
      }
    }

    // Apply quadrant filter
    if (filterQuadrant !== 'all') {
      filtered = filtered.filter(task => {
        const isUrgent = task.urgency >= 50
        const isImportant = task.importance >= 50

        switch (filterQuadrant) {
          case 'urgent-important':
            return isUrgent && isImportant
          case 'urgent-not-important':
            return isUrgent && !isImportant
          case 'not-urgent-important':
            return !isUrgent && isImportant
          case 'not-urgent-not-important':
            return !isUrgent && !isImportant
          default:
            return true
        }
      })
    }

    return [...filtered].sort((a, b) => {
      // Balanced priority algorithm: importance (60%) + urgency (40%)
      const priorityA = a.importance * 0.6 + a.urgency * 0.4
      const priorityB = b.importance * 0.6 + b.urgency * 0.4
      return priorityB - priorityA
    })
  }, [tasks, selectedPlayerFilter, filterQuadrant])

  // Get highest priority task ID
  const highestPriorityTaskId = useMemo(() => {
    if (tasks.length === 0) return null
    const sorted = [...tasks].sort((a, b) => {
      if (a.importance !== b.importance) {
        return b.importance - a.importance
      }
      return b.urgency - a.urgency
    })
    return sorted[0]?.id || null
  }, [tasks])

  const getQuadrantLabel = useCallback((urgency: number, importance: number): string => {
    if (urgency >= 50 && importance >= 50) return "Important & Urgent"
    if (urgency < 50 && importance >= 50) return "Important & Not Urgent"
    if (urgency >= 50 && importance < 50) return "Not Important & Urgent"
    return "Not Important & Not Urgent"
  }, [])

  const handleTaskCreate = async (description: string, urgency: number, importance: number, assigneeIds: number[]) => {
    // Optimistic update: Create temporary task immediately
    const tempId = Date.now() // Temporary ID
    const tempTask: TaskWithAssignees = {
      id: tempId,
      description,
      urgency,
      importance,
      created_at: new Date().toISOString(),
      project_id: projectId,
      assignees: players.filter(p => assigneeIds.includes(p.id)),
      comments: []
    }

    setTasks(prev => [...prev, tempTask])

    // Sync to database in background
    const result = await createTask(projectId, description, urgency, importance, assigneeIds)
    if (result.success) {
      // Replace temp task with real task from server
      router.refresh()
      setLastSyncTime(new Date())
    } else {
      // Rollback on error
      setTasks(prev => prev.filter(t => t.id !== tempId))
      toast.error(result.error || "Failed to create task")
    }
  }

  const handleLongPress = async (urgency: number, importance: number) => {
    setNewTaskData({
      ...newTaskData,
      urgency,
      importance,
      assigneeIds: (projectType === "team" && currentUserPlayer) ? [currentUserPlayer.id] : [],
    })
    setIsAddTaskOpen(true)
  }

  const handleTaskDetailClick = (task: TaskWithAssignees) => {
    setSelectedTask(task)
    setIsTaskDetailOpen(true)
  }

  const handleToggleTaskComplete = async (taskId: number) => {
    // Toggle completion state
    setCompletedTaskIds(prev => {
      const next = new Set(prev)
      if (next.has(taskId)) {
        next.delete(taskId)
      } else {
        next.add(taskId)
      }
      return next
    })

    // Optionally archive the task in database when marked as complete
    // Only archive if marking as complete (not un-completing)
    if (!completedTaskIds.has(taskId)) {
      try {
        const response = await fetch(`/api/tasks/${taskId}/complete`, {
          method: 'POST',
        })

        if (response.ok) {
          // Remove from local tasks list after a short delay to show the strikethrough animation
          setTimeout(() => {
            setTasks(prev => prev.filter(t => t.id !== taskId))
            setCompletedTaskIds(prev => {
              const next = new Set(prev)
              next.delete(taskId)
              return next
            })
          }, 1000)
          setLastSyncTime(new Date())
          toast.success("Task completed!")
        } else {
          // If API call fails, revert the completion state
          setCompletedTaskIds(prev => {
            const next = new Set(prev)
            next.delete(taskId)
            return next
          })
          toast.error("Failed to complete task")
        }
      } catch {
        // If API call fails, revert the completion state
        setCompletedTaskIds(prev => {
          const next = new Set(prev)
          next.delete(taskId)
          return next
        })
        toast.error("Failed to complete task")
      }
    }
  }

  const handleTaskUpdate = async (taskId: number, description: string, urgency: number, importance: number, assigneeIds: number[]) => {
    // Optimistic update: Update task immediately in UI
    const originalTask = tasks.find(t => t.id === taskId)!
    const updatedTask = {
      ...originalTask,
      description,
      urgency,
      importance,
      assignees: players.filter(p => assigneeIds.includes(p.id))
    }

    setTasks(prev => prev.map(task =>
      task.id === taskId ? updatedTask : task
    ))

    // Update selectedTask so the dialog shows updated data
    if (selectedTask && selectedTask.id === taskId) {
      setSelectedTask(updatedTask)
    }

    // Sync to database in background
    const result = await updateTaskAction(taskId, urgency, importance, description, assigneeIds)
    if (result.success) {
      setLastSyncTime(new Date())
      toast.success("Task updated successfully")

      // Record learning data if urgency or importance changed significantly
      if (Math.abs(urgency - originalTask.urgency) >= 5 || Math.abs(importance - originalTask.importance) >= 5) {
        // Call learning API in background (don't wait)
        fetch('/api/ai/learn-from-adjustment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            taskId,
            newUrgency: urgency,
            newImportance: importance
          })
        }).catch(err => debug.error('Failed to record learning:', err))
      }

      // Refresh to get latest data from server
      router.refresh()
    } else {
      // Rollback optimistic update
      setTasks(prev => prev.map(task =>
        task.id === taskId ? originalTask : task
      ))
      if (selectedTask && selectedTask.id === taskId) {
        setSelectedTask(originalTask)
      }
      toast.error(result.error || "Failed to update task")
      // Throw error so TaskDetailDialog knows update failed
      throw new Error(result.error || "Failed to update task")
    }
  }

  const handleTaskDelete = (taskId: number) => {
    // Find the task to delete
    const task = tasks.find(t => t.id === taskId)
    if (!task) return

    // Show confirmation dialog
    setTaskToDelete(task)
    setDeleteTaskDialogOpen(true)
  }

  const confirmDeleteTask = async () => {
    if (!taskToDelete) return

    // Optimistic update: Remove task immediately from UI
    setTasks(prev => prev.filter(task => task.id !== taskToDelete.id))
    setIsTaskDetailOpen(false)
    setDeleteTaskDialogOpen(false)

    // Sync to database in background
    const result = await deleteTask(taskToDelete.id)
    if (result.success) {
      setLastSyncTime(new Date())
      toast.success("Task deleted successfully")
    } else {
      // Refresh to rollback on error
      router.refresh()
      toast.error(result.error || "Failed to delete task")
    }

    setTaskToDelete(null)
  }

  const handleSubmitTask = async () => {
    if (!newTaskData.description.trim() || isSubmittingTask) return

    // 防止重复提交
    setIsSubmittingTask(true)

    try {
      // 保存任务数据
      const taskData = { ...newTaskData }

      // 后台创建任务
      await handleTaskCreate(
        taskData.description,
        taskData.urgency,
        taskData.importance,
        taskData.assigneeIds
      )

      // 任务创建成功后才关闭对话框和重置表单
      setIsAddTaskOpen(false)
      setNewTaskData({
        description: "",
        urgency: 50,
        importance: 50,
        assigneeIds: (projectType === "team" && currentUserPlayer) ? [currentUserPlayer.id] : [],
      })
    } finally {
      setIsSubmittingTask(false)
    }
  }



  const handleDeleteProject = async () => {
    setIsDeleting(true)

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const data = await response.json()
        toast.error(data.error || "Failed to delete project")
        return
      }

      toast.success("Project deleted successfully")
      setDeleteDialogOpen(false)
      router.push("/projects")
      router.refresh()
    } catch (error) {
      toast.error("Failed to delete project")
      debug.error(error)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleLeaveProject = async () => {
    if (!confirm(`Are you sure you want to leave "${projectName}"? All your task assignments will be removed.`)) {
      return
    }

    try {
      const response = await fetch(`/api/projects/${projectId}/leave`, {
        method: "POST",
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || "Failed to leave project")
        return
      }

      toast.success("Successfully left the project")
      router.push("/projects")
      router.refresh()
    } catch (error) {
      toast.error("Failed to leave project")
      debug.error(error)
    }
  }

  const handleSaveProjectEdit = async () => {
    if (!editedProjectName.trim()) {
      toast.error("Project name cannot be empty")
      return
    }

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editedProjectName.trim(),
          description: editedProjectDescription.trim() || null,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        toast.error(data.error || "Failed to update project")
        return
      }

      toast.success("Project updated successfully")
      setIsEditingProject(false)
      router.refresh()
    } catch (error) {
      toast.error("Failed to update project")
      debug.error(error)
    }
  }

  const handleArchiveProject = async () => {
    setIsArchiving(true)

    try {
      // Get archived tasks count before archiving the project
      const archivedResult = await getArchivedTasks(projectId)
      const archivedTasksCount = archivedResult.success && archivedResult.tasks ? archivedResult.tasks.length : 0

      const response = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ archived: true }),
      })

      if (!response.ok) {
        const data = await response.json()
        toast.error(data.error || "Failed to archive project")
        return
      }

      // Show congratulatory message using archived tasks count
      const taskWord = archivedTasksCount === 1 ? "task" : "tasks"
      const congratsMessage = projectType === "team"
        ? `Congratulations! You all handled ${archivedTasksCount} ${taskWord}!`
        : `Congratulations! You handled ${archivedTasksCount} ${taskWord}!`

      toast.success(congratsMessage, { duration: 5000 })
      setShowArchiveDialog(false)
      router.push("/projects")
      router.refresh()
    } catch (error) {
      toast.error("Failed to archive project")
      debug.error(error)
    } finally {
      setIsArchiving(false)
    }
  }

  // Archived tasks handlers
  const handleOpenArchives = async () => {
    setArchivedTasksDialogOpen(true)
    setIsLoadingArchived(true)
    try {
      const result = await getArchivedTasks(projectId)
      if (result.success && result.tasks) {
        setArchivedTasks(result.tasks)
      } else {
        toast.error(result.error || "Failed to load archived tasks")
      }
    } catch (error) {
      toast.error("Failed to load archived tasks")
    } finally {
      setIsLoadingArchived(false)
    }
  }

  const handleRestoreTask = async (taskId: number) => {
    try {
      const result = await restoreTask(taskId)
      if (result.success) {
        setArchivedTasks(prev => prev.filter(t => t.id !== taskId))
        toast.success("Task restored")
        router.refresh()
      } else {
        toast.error(result.error || "Failed to restore task")
      }
    } catch (error) {
      toast.error("Failed to restore task")
    }
  }

  // One-click organize: intelligently redistribute tasks using AI
  const handleOrganizeTasks = async () => {
    logger.component('QuadrantTodo', 'handleOrganizeTasks called, tasks:', tasks.length, 'isOrganizing:', isOrganizing, 'isOrganizingInProgress:', isOrganizingInProgress)

    // Prevent organizing if already in organize mode or in progress
    if (isOrganizing || isOrganizingInProgress) {
      logger.component('QuadrantTodo', 'Already in organize mode, ignoring')
      toast.warning("Please accept or revert current changes first")
      return
    }

    if (tasks.length === 0) {
      toast.warning("No tasks to organize")
      return
    }

    // Immediately set in-progress flag to prevent double-clicks
    setIsOrganizingInProgress(true)
    setIsOrganizingLoading(true) // Show full-screen loading overlay

    // Try to acquire distributed lock
    try {
      const lockResponse = await fetch(`/api/projects/${projectId}/organize-lock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userId || 'anonymous',
          userName: userName || 'User'
        })
      })

      const lockResult = await lockResponse.json()

      if (!lockResult.success) {
        if (lockResult.locked) {
          toast.warning(`${lockResult.lockedBy} is currently organizing tasks. Please wait.`)
        } else {
          toast.error('Failed to start organize operation')
        }
        setIsOrganizingInProgress(false) // Reset on lock failure
        setIsOrganizingLoading(false) // Hide loading overlay
        return
      }
    } catch (error) {
      debug.error('Lock acquire error:', error)
      toast.error('Failed to start organize operation')
      setIsOrganizingInProgress(false) // Reset on error
      setIsOrganizingLoading(false) // Hide loading overlay
      return
    }

    // Save original positions
    const originalPositions = new Map<number, { urgency: number; importance: number }>()
    tasks.forEach(task => {
      originalPositions.set(task.id, { urgency: task.urgency, importance: task.importance })
    })
    setOriginalTaskPositions(originalPositions)
    debug.log('Original positions saved:', originalPositions.size, 'tasks')

    try {
      const requestBody = {
        tasks: tasks.map(t => ({
          id: t.id,
          description: t.description,
          urgency: t.urgency,
          importance: t.importance
        }))
      }
      debug.log('Calling API with', requestBody.tasks.length, 'tasks')
      debug.log('Task positions before:', requestBody.tasks.map(t => `Task ${t.id}: (${t.urgency}, ${t.importance})`).join(', '))

      // Call AI API to organize tasks
      const response = await fetch('/api/ai/organize-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      })

      debug.log('API response status:', response.status)

      if (!response.ok) {
        const errorText = await response.text()
        debug.error('API error:', response.status, errorText)
        throw new Error(`Failed to organize tasks: ${response.status}`)
      }

      const responseData = await response.json()
      debug.log('API response data:', responseData)
      const { organizedTasks } = responseData

      debug.log('Organized tasks received:', organizedTasks.length)
      debug.log('Task positions after:', organizedTasks.map((t: TaskWithAssignees) => `Task ${t.id}: (${t.urgency}, ${t.importance})`).join(', '))

      // Apply organized positions to tasks
      const updatedTasks = tasks.map(task => {
        const organized = organizedTasks.find((o: TaskWithAssignees) => o.id === task.id)
        if (organized) {
          return {
            ...task,
            urgency: Math.round(organized.urgency),
            importance: Math.round(organized.importance)
          }
        }
        return task
      })

      debug.log('Setting', updatedTasks.length, 'updated tasks')
      setTasks(updatedTasks)
      setIsOrganizing(true)
      setIsOrganizingLoading(false) // Hide loading overlay after success
      // Keep isOrganizingInProgress true until user accepts/reverts
      toast.success("Tasks organized! Review changes and Accept or Revert.")
    } catch (error) {
      debug.error('Organization error:', error)
      toast.error('Failed to organize tasks. Please try again.')
      setOriginalTaskPositions(new Map())
      setIsOrganizing(false)
      setIsOrganizingInProgress(false) // Reset on error
      setIsOrganizingLoading(false) // Hide loading overlay on error

      // Release lock on error with error handling
      try {
        await fetch(`/api/projects/${projectId}/organize-lock`, {
          method: 'DELETE'
        })
      } catch (lockError) {
        debug.error('Failed to release lock on error:', lockError)
      }
    }
  }

  const handleAcceptOrganize = async () => {
    debug.log('Accepting organize changes...')

    // Only update tasks that actually moved
    const tasksToUpdate = tasks.filter(task => {
      const original = originalTaskPositions.get(task.id)
      if (!original) return false
      return original.urgency !== task.urgency || original.importance !== task.importance
    })

    debug.log(`Updating ${tasksToUpdate.length} out of ${tasks.length} tasks`)

    if (tasksToUpdate.length === 0) {
      debug.log('No tasks to update')
      setOriginalTaskPositions(new Map())
      setIsOrganizing(false)
      setIsOrganizingInProgress(false) // Reset on completion
      toast.info("No changes to save")

      // Release lock
      try {
        await fetch(`/api/projects/${projectId}/organize-lock`, { method: 'DELETE' })
      } catch (error) {
        debug.error('Failed to release lock:', error)
      }
      return
    }

    // Mark all tasks being updated as pending to prevent sync conflicts
    const updatingTaskIds = new Set(tasksToUpdate.map(t => t.id))
    setPendingUpdateTaskIds(prev => new Set([...prev, ...updatingTaskIds]))

    // Immediately update UI for instant feedback
    const updatedTasks = tasks.map(task => {
      const wasMoved = updatingTaskIds.has(task.id)
      if (wasMoved) {
        return { ...task, updated_at: new Date() }
      }
      return task
    })

    setTasks(updatedTasks)
    setLastSyncTime(new Date())

    // Exit organize mode to allow sync to resume
    setOriginalTaskPositions(new Map())
    setIsOrganizing(false)
    setIsOrganizingInProgress(false) // Reset on completion

    // Mark user as active
    handleUserActivity()

    // Save to database and wait for completion
    const updatePromises = tasksToUpdate.map(task =>
      updateTaskAction(task.id, task.urgency, task.importance, task.description)
    )

    try {
      await Promise.all(updatePromises)
      debug.log('Organization changes saved to database successfully')
      toast.success(`✓ ${tasksToUpdate.length} task${tasksToUpdate.length > 1 ? 's' : ''} organized!`)
    } catch (error) {
      debug.error("Failed to save organization:", error)
      toast.error("Failed to save changes to database")
    } finally {
      // Clear pending state after save completes (with delay)
      setTimeout(() => {
        setPendingUpdateTaskIds(prev => {
          const next = new Set(prev)
          updatingTaskIds.forEach(id => next.delete(id))
          return next
        })
      }, 1000)

      // Release lock after saving
      try {
        await fetch(`/api/projects/${projectId}/organize-lock`, { method: 'DELETE' })
      } catch (error) {
        debug.error('Failed to release lock:', error)
      }
    }
  }

  const handleRevertOrganize = async () => {
    // Restore original positions
    const revertedTasks = tasks.map(task => {
      const original = originalTaskPositions.get(task.id)
      if (original) {
        return { ...task, urgency: original.urgency, importance: original.importance }
      }
      return task
    })

    setTasks(revertedTasks)
    setOriginalTaskPositions(new Map())
    setIsOrganizing(false)
    setIsOrganizingInProgress(false) // Reset on revert
    toast.info("Changes reverted")

    // Release lock with error handling
    try {
      await fetch(`/api/projects/${projectId}/organize-lock`, { method: 'DELETE' })
    } catch (error) {
      debug.error('Failed to release lock:', error)
    }
  }

  const handleDeletePlayer = async (playerId: number, playerName: string) => {
    if (!confirm(`Are you sure you want to delete ${playerName}? This will unassign them from all tasks.`)) {
      return
    }

    // Optimistic update: Remove player immediately
    setPlayers(prev => prev.filter(p => p.id !== playerId))
    // Also remove from tasks
    setTasks(prev => prev.map(task => ({
      ...task,
      assignees: task.assignees?.filter(a => a.id !== playerId) || []
    })))

    const result = await deletePlayer(playerId)
    if (result.success) {
      toast.success("Player deleted successfully")
      setLastSyncTime(new Date())
    } else {
      // Refresh to rollback on error
      router.refresh()
      toast.error(result.error || "Failed to delete player")
    }
  }

  return (
    <div className={`min-h-screen bg-background ${isFullscreen ? '' : 'pb-20'}`}>
      {/* Top Bar */}
      <div className={`flex items-center justify-between px-3 py-2 ${isFullscreen ? 'absolute top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-sm' : ''}`}>
        {!isFullscreen ? (
          <>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 group cursor-pointer" onClick={() => setIsEditingProject(true)}>
                <h1 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">{projectName}</h1>
                <Edit className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              {isOfflineMode && (
                <Badge variant="outline" className="bg-yellow-500/10 text-yellow-700 border-yellow-500/20 text-xs">
                  Offline
                </Badge>
              )}
              {projectType === 'team' && !isOfflineMode && activeUserCount > 1 && (
                <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-500/20 text-xs animate-pulse">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1"></div>
                  {activeUserCount}
                </Badge>
              )}
            </div>
          </>
        ) : (
          <div />
        )}
      </div>

      {/* Map View */}
      {currentView === 'map' && (
        <>
          {selectedPlayerFilter !== "all" && !isFullscreen && (
            <div className="mb-4 p-3 bg-primary/5 border border-primary/20 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-primary" />
                  <span className="text-sm">
                    Filtered: {filteredAndSortedTasks.length} of {tasks.length} tasks shown
                    {selectedPlayerFilter === "unassigned"
                      ? " (unassigned)"
                      : ` (${players.find(p => p.id.toString() === selectedPlayerFilter)?.name})`}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedPlayerFilter("all")}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
          <QuadrantMatrixMap
            tasks={selectedPlayerFilter !== "all" ? filteredAndSortedTasks : tasks}
            players={players}
            lines={lines}
            projectId={projectId}
            isMobile={isMobile}

            onTaskDetailClick={handleTaskDetailClick}
            onLongPress={handleLongPress}
            userName={userName}
            projectType={projectType}
            highestPriorityTaskId={highestPriorityTaskId}
            setTasks={setTasks}
            onOrganizeTasks={handleOrganizeTasks}
            isOrganizing={isOrganizing || isOrganizingInProgress}
            originalTaskPositions={originalTaskPositions}
            onAcceptOrganize={handleAcceptOrganize}
            onRevertOrganize={handleRevertOrganize}
            isFullscreen={isFullscreen}
            onFullscreenChange={handleFullscreenChange}
            isFocusMode={isFocusMode}
            focusedTaskId={focusedTask?.id}
            focusedTaskDescription={focusedTask?.description}
            focusIndex={focusIndex}
            totalFocusTasks={topPriorityTasks.length}
            onFocusClick={() => {
              if (focusIndex < topPriorityTasks.length - 1) {
                setFocusIndex(focusIndex + 1)
              } else {
                setIsFocusMode(false)
                setFocusIndex(0)
              }
            }}
            onDragStart={(taskId) => {
              debug.log('[Drag] Starting drag for task:', taskId)
              handleUserActivity() // Mark user as active
              setPendingUpdateTaskIds(prev => new Set([...prev, taskId]))
            }}
            onDragEnd={(taskId) => {
              debug.log('[Drag] Ending drag for task:', taskId)
              handleUserActivity() // Mark user as active
              // Remove from pending after longer delay (1500ms to ensure DB completes)
              setTimeout(() => {
                setPendingUpdateTaskIds(prev => {
                  const next = new Set(prev)
                  next.delete(taskId)
                  debug.log('[Drag] Cleared pending for task:', taskId, 'Remaining:', next.size)
                  return next
                })
              }, 1500)
            }}
          />
        </>
      )}

      {/* List View */}
      {currentView === 'list' && (
        <div className="p-2 sm:p-4">
          <Card>
            <CardHeader className="px-4 sm:px-6 flex flex-row items-center justify-between">
              <CardTitle className="text-2xl sm:text-3xl font-bold">My Tasks</CardTitle>
              <Button
                variant="outline"
                size="sm"
                className={`rounded-full px-4 py-2 font-semibold ${filterQuadrant === 'urgent-important' || filterQuadrant === 'urgent-not-important' ? 'bg-yellow-200 border-yellow-400 hover:bg-yellow-300' : ''
                  }`}
                onClick={() => {
                  if (filterQuadrant === 'urgent-important' || filterQuadrant === 'urgent-not-important') {
                    setFilterQuadrant('all')
                  } else {
                    setFilterQuadrant('urgent-important')
                  }
                }}
              >
                Urgent
              </Button>
            </CardHeader>
            <CardContent className="px-4 sm:px-6">
              <div className="space-y-3">
                {filteredAndSortedTasks.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No tasks yet. Create your first task!
                  </p>
                ) : (
                  filteredAndSortedTasks.map((task) => {
                    const isCompleted = completedTaskIds.has(task.id)
                    return (
                      <div
                        key={task.id}
                        className={`flex items-center gap-3 sm:gap-4 p-3 sm:p-4 border-2 border-black rounded-2xl transition-all ${isCompleted
                          ? 'bg-gray-100 opacity-70'
                          : 'bg-white hover:shadow-md cursor-pointer'
                          }`}
                      >
                        {/* Checkbox Circle */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleToggleTaskComplete(task.id)
                          }}
                          className={`flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 border-black flex items-center justify-center transition-all ${isCompleted
                            ? 'bg-black'
                            : 'bg-white hover:bg-gray-100'
                            }`}
                        >
                          {isCompleted && (
                            <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-black" />
                          )}
                        </button>

                        {/* Task Content */}
                        <div
                          className="flex-1 min-w-0"
                          onClick={() => !isCompleted && handleTaskDetailClick(task)}
                        >
                          <p
                            className={`font-medium text-base sm:text-lg ${isCompleted ? 'line-through text-gray-400' : 'text-black'
                              }`}
                          >
                            {task.description}
                          </p>
                          {!isCompleted && (
                            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm text-muted-foreground mt-1">
                              <Badge
                                variant="outline"
                                className={`text-xs ${getQuadrantLabel(task.urgency, task.importance).includes('Urgent')
                                  ? 'bg-yellow-200 border-yellow-400'
                                  : ''
                                  }`}
                              >
                                {getQuadrantLabel(task.urgency, task.importance)}
                              </Badge>
                              {task.assignees && task.assignees.length > 0 && (
                                <div className="flex items-center gap-1">
                                  {task.assignees.map((player) => (
                                    <div
                                      key={player.id}
                                      className="w-2 h-2 sm:w-3 sm:h-3 rounded-full"
                                      style={{ backgroundColor: player.color }}
                                      title={player.name}
                                    />
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Add Task Dialog */}
      <Dialog open={isAddTaskOpen} onOpenChange={setIsAddTaskOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newTaskData.description}
                onChange={(e) => setNewTaskData({ ...newTaskData, description: e.target.value })}
                placeholder="Enter task description..."
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="urgency">Urgency: {newTaskData.urgency}%</Label>
                <Input
                  id="urgency"
                  type="range"
                  min="0"
                  max="100"
                  value={newTaskData.urgency}
                  onChange={(e) => setNewTaskData({ ...newTaskData, urgency: parseInt(e.target.value) })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="importance">Importance: {newTaskData.importance}%</Label>
                <Input
                  id="importance"
                  type="range"
                  min="0"
                  max="100"
                  value={newTaskData.importance}
                  onChange={(e) => setNewTaskData({ ...newTaskData, importance: parseInt(e.target.value) })}
                  className="mt-1"
                />
              </div>
            </div>

            {projectType === "team" && players.length > 0 && (
              <div>
                <Label>Assign to Players</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {players.map((player) => (
                    <Badge
                      key={player.id}
                      variant={newTaskData.assigneeIds.includes(player.id) ? "default" : "outline"}
                      className="cursor-pointer"
                      style={newTaskData.assigneeIds.includes(player.id) ? { backgroundColor: player.color } : {}}
                      onClick={() => {
                        const isSelected = newTaskData.assigneeIds.includes(player.id)
                        setNewTaskData({
                          ...newTaskData,
                          assigneeIds: isSelected
                            ? newTaskData.assigneeIds.filter(id => id !== player.id)
                            : [...newTaskData.assigneeIds, player.id]
                        })
                      }}
                    >
                      {player.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsAddTaskOpen(false)} disabled={isSubmittingTask}>
                Cancel
              </Button>
              <Button onClick={handleSubmitTask} disabled={!newTaskData.description.trim() || isSubmittingTask}>
                {isSubmittingTask ? "Creating..." : "Create Task"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Task Detail Dialog */}
      {selectedTask && (
        <TaskDetailDialog
          task={selectedTask}
          players={players}
          projectType={projectType}
          userName={userName}
          isOpen={isTaskDetailOpen}
          onOpenChange={setIsTaskDetailOpen}
          isMobile={isMobile}
          onDeleteTask={handleTaskDelete}
          onUpdateTask={handleTaskUpdate}
          onAddComment={async (taskId: number, content: string, authorName: string) => {
            const result = await addComment(taskId, content, authorName)
            if (result.success) {
              // Update selectedTask with the new comment for immediate UI feedback
              if (selectedTask && selectedTask.id === taskId && result.comment) {
                setSelectedTask({
                  ...selectedTask,
                  comments: [...(selectedTask.comments || []), result.comment]
                })
              }
              setLastSyncTime(new Date())
              toast.success("Comment added")
              router.refresh()
            } else {
              toast.error(result.error || "Failed to add comment")
              // Throw error so TaskDetailDialog knows operation failed
              throw new Error(result.error || "Failed to add comment")
            }
          }}
          onDeleteComment={async (commentId: number, taskId: number) => {
            const result = await deleteCommentAction(commentId)
            if (result.success) {
              // Update selectedTask by removing the deleted comment
              if (selectedTask && selectedTask.id === taskId) {
                setSelectedTask({
                  ...selectedTask,
                  comments: selectedTask.comments?.filter(c => c.id !== commentId) || []
                })
              }
              setLastSyncTime(new Date())
              toast.success("Comment deleted")
              router.refresh()
            } else {
              toast.error(result.error || "Failed to delete comment")
            }
          }}
        />
      )}

      {/* Manage Players Dialog */}
      <Dialog open={isManagePlayersOpen} onOpenChange={setIsManagePlayersOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Project Members</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Players List */}
            <div>
              <p className="text-sm text-muted-foreground mb-3">
                {userRole === "owner"
                  ? "Members are automatically created when they join the project. Click the color dot to change a member's color."
                  : "Project members list"}
              </p>
              <div className="mt-2 space-y-3 max-h-[400px] overflow-y-auto">
                {players.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No members yet</p>
                ) : (
                  players.map((player) => (
                    <div key={player.id} className="p-3 border rounded-lg">
                      <div className="flex items-center gap-3 mb-2">
                        {userRole === "owner" ? (
                          <button
                            onClick={() => setEditingPlayerId(editingPlayerId === player.id ? null : player.id)}
                            className="w-6 h-6 rounded-full border-2 border-white shadow-md hover:scale-110 transition-transform cursor-pointer"
                            style={{ backgroundColor: player.color }}
                            title="Click to change color"
                          />
                        ) : (
                          <div
                            className="w-6 h-6 rounded-full border-2 border-white shadow-md"
                            style={{ backgroundColor: player.color }}
                          />
                        )}
                        <span className="text-sm font-medium flex-1">{player.name}</span>
                        {userRole === "owner" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeletePlayer(player.id, player.name)}
                            className="h-8 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                            title="Delete member"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>

                      {/* Color Picker - shown when editing (owner only) */}
                      {userRole === "owner" && editingPlayerId === player.id && (
                        <div className="mt-3 p-3 bg-muted/50 rounded-md">
                          <p className="text-xs text-muted-foreground mb-2">Choose new color:</p>
                          <div className="grid grid-cols-8 gap-2">
                            {['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'].map((color) => (
                              <button
                                key={color}
                                onClick={async () => {
                                  setPlayers(prev => prev.map(p =>
                                    p.id === player.id ? { ...p, color } : p
                                  ))
                                  await updatePlayer(player.id, player.name, color)
                                  setEditingPlayerId(null)
                                }}
                                className="w-8 h-8 rounded-full border-2 border-white shadow-md hover:scale-110 transition-transform"
                                style={{ backgroundColor: color }}
                                title={color}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Project Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this project?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the project{" "}
              <span className="font-bold text-black">&quot;{projectName}&quot;</span> and all of its tasks, comments, and data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProject}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {isDeleting ? "Deleting..." : "Delete Project"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Task Confirmation Dialog */}
      <AlertDialog open={deleteTaskDialogOpen} onOpenChange={setDeleteTaskDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Task Deletion?</AlertDialogTitle>
            <AlertDialogDescription>
              {taskToDelete && (
                <>
                  Are you sure you want to permanently delete the task <strong>&quot;{taskToDelete.description}&quot;</strong>? This action cannot be undone.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setTaskToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteTask} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Project Dialog */}
      <Dialog open={isEditingProject} onOpenChange={setIsEditingProject}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Project Name</Label>
              <Input
                id="edit-name"
                value={editedProjectName}
                onChange={(e) => setEditedProjectName(e.target.value)}
                placeholder="Project name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description (optional)</Label>
              <Textarea
                id="edit-description"
                value={editedProjectDescription}
                onChange={(e) => setEditedProjectDescription(e.target.value)}
                placeholder="Project description"
                rows={3}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setIsEditingProject(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveProjectEdit}>
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Archive Project Confirmation */}
      <AlertDialog open={showArchiveDialog} onOpenChange={setShowArchiveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive this project?</AlertDialogTitle>
            <AlertDialogDescription>
              This will archive the project <span className="font-bold text-black">&quot;{projectName}&quot;</span>.
              You can restore it later from the archived projects list.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isArchiving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleArchiveProject}
              disabled={isArchiving}
              className="bg-green-600 hover:bg-green-700 focus:ring-green-600"
            >
              {isArchiving ? "Archiving..." : "Archive Project"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Task Creation with AI */}
      <BulkTaskInput
        projectId={projectId}
        players={players}
        onTasksCreated={() => router.refresh()}
        open={isBulkAddOpen}
        onOpenChange={setIsBulkAddOpen}
        projectType={projectType}
        userName={userName}
      />

      {/* Help Dialog */}
      <Dialog open={showHelpDialog} onOpenChange={setShowHelpDialog}>
        <DialogContent className="max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-medium">Usage Instructions</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <div>
              <h4 className="font-medium mb-1">Create Task</h4>
              <p className="text-muted-foreground">Long press on empty space or use &quot;Add Task&quot;</p>
            </div>
            <div>
              <h4 className="font-medium mb-1">Move Task</h4>
              <p className="text-muted-foreground">Drag to change urgency/importance</p>
            </div>
            <div>
              <h4 className="font-medium mb-1">Edit Task</h4>
              <p className="text-muted-foreground">Click on task to view details</p>
            </div>
            <div>
              <h4 className="font-medium mb-1">Complete/Delete</h4>
              <p className="text-muted-foreground">Drag to green checkmark or red trash</p>
            </div>

            <div>
              <h4 className="font-medium mb-1">Priority Highlight</h4>
              <p className="text-muted-foreground">Highest priority task is auto-highlighted</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Floating Top Toolbar - Draggable */}
      <div
        className={`fixed top-16 z-40 flex items-center gap-1.5 bg-white/95 backdrop-blur-md rounded-full px-2 py-1.5 shadow-lg border border-gray-200 ${isDraggingToolbar ? 'cursor-grabbing' : ''}`}
        style={{
          left: `calc(50% + ${toolbarX}px)`,
          transform: 'translateX(-50%)',
        }}
      >
        {/* Drag Handle */}
        <div
          className="w-6 h-6 rounded-full flex items-center justify-center cursor-grab hover:bg-gray-100 transition-colors"
          onMouseDown={handleToolbarDragStart}
          onTouchStart={handleToolbarDragStart}
          title="Drag to move"
        >
          <svg className="w-3 h-3 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="8" cy="8" r="2" />
            <circle cx="16" cy="8" r="2" />
            <circle cx="8" cy="16" r="2" />
            <circle cx="16" cy="16" r="2" />
          </svg>
        </div>

        <div className="w-px h-6 bg-gray-200" />
        {/* Map/List Toggle */}
        <div className="flex items-center bg-gray-100 rounded-full p-0.5">
          <button
            onClick={() => setCurrentView('map')}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${currentView === 'map' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`}
            title="Map View"
          >
            <MapIcon className={`w-4 h-4 ${currentView === 'map' ? 'text-black' : 'text-gray-500'}`} />
          </button>
          <button
            onClick={() => setCurrentView('list')}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${currentView === 'list' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`}
            title="List View"
          >
            <List className={`w-4 h-4 ${currentView === 'list' ? 'text-black' : 'text-gray-500'}`} />
          </button>
        </div>

        <div className="w-px h-6 bg-gray-200" />

        {/* Focus Button - Primary action */}
        <button
          onClick={() => {
            setIsFocusMode(true)
            setFocusIndex(0)
          }}
          className="w-10 h-10 rounded-full bg-yellow-400 hover:bg-yellow-500 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center justify-center"
          title="Focus Mode"
        >
          <svg className="w-4 h-4 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        </button>

        {/* Bulk Add Button */}
        <button
          onClick={() => setIsBulkAddOpen(true)}
          className="w-10 h-10 rounded-full bg-purple-100 hover:bg-purple-200 border border-purple-300 transition-all flex items-center justify-center"
          title="Bulk Add Tasks"
        >
          <Sparkles className="w-4 h-4 text-purple-600" />
        </button>

        {/* Add Task Button */}
        <button
          onClick={() => {
            setNewTaskData({
              description: "",
              urgency: 50,
              importance: 50,
              assigneeIds: (projectType === "team" && currentUserPlayer) ? [currentUserPlayer.id] : [],
            })
            setIsAddTaskOpen(true)
          }}
          className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 border border-gray-300 transition-all flex items-center justify-center"
          title="Add Task"
        >
          <Plus className="w-4 h-4 text-gray-700" />
        </button>

        <div className="w-px h-6 bg-gray-200" />

        {/* Organize Button */}
        <button
          onClick={handleOrganizeTasks}
          disabled={isOrganizing || isOrganizingInProgress || tasks.length === 0}
          className="w-10 h-10 rounded-full bg-purple-600 hover:bg-purple-700 transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          title="AI Organize"
        >
          <Wand2 className="w-4 h-4 text-white" />
        </button>

        {/* Archive Button */}
        <button
          onClick={handleOpenArchives}
          className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 border border-gray-300 transition-all flex items-center justify-center"
          title="Archived Tasks"
        >
          <Archive className="w-4 h-4 text-gray-700" />
        </button>

        {/* Fullscreen Toggle Button */}
        <button
          onClick={() => handleFullscreenChange(!isFullscreen)}
          className="w-10 h-10 rounded-full bg-gray-800 hover:bg-gray-900 transition-all flex items-center justify-center"
          title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
        >
          {isFullscreen ? (
            <X className="w-4 h-4 text-white" />
          ) : (
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          )}
        </button>

        <div className="w-px h-6 bg-gray-200" />

        {/* Settings Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 border border-gray-300 transition-all flex items-center justify-center"
              title="Settings"
            >
              <Settings className="w-4 h-4 text-gray-700" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center" side="top" className="w-64 mb-2">
            <DropdownMenuLabel>Settings</DropdownMenuLabel>

            {projectType === "team" && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">Filter by Player</DropdownMenuLabel>
                <div className="px-2 py-2">
                  <Select value={selectedPlayerFilter} onValueChange={setSelectedPlayerFilter}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="All Tasks" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Tasks</SelectItem>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {players.map((player) => (
                        <SelectItem key={player.id} value={player.id.toString()}>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: player.color }} />
                            {player.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer" onClick={() => setIsManagePlayersOpen(true)}>
                  <Users className="h-4 w-4 mr-2" />
                  {userRole === "owner" ? "Manage Players" : "View Players"}
                </DropdownMenuItem>
              </>
            )}

            <DropdownMenuSeparator />

            <DropdownMenuItem className="cursor-pointer" onClick={() => setShowHelpDialog(true)}>
              <HelpCircle className="h-4 w-4 mr-2" />
              Help
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            {userRole === "owner" ? (
              <>
                <DropdownMenuItem className="cursor-pointer" onClick={() => setShowArchiveDialog(true)}>
                  <Check className="h-4 w-4 mr-2" />
                  Archive Project
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Project
                </DropdownMenuItem>
              </>
            ) : (
              <DropdownMenuItem
                className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
                onClick={handleLeaveProject}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Leave Project
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Share Button - Team projects only */}
        {projectType === "team" && (
          <button
            onClick={() => {
              const inviteCode = projectId.substring(0, 8).toUpperCase()
              navigator.clipboard.writeText(inviteCode)
              toast.success("Invite code copied!")
            }}
            className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 border border-gray-300 transition-all flex items-center justify-center"
            title="Copy Invite Code"
          >
            <Share2 className="w-4 h-4 text-gray-700" />
          </button>
        )}

      </div>

      {/* Archived Tasks Dialog */}
      <Dialog open={archivedTasksDialogOpen} onOpenChange={setArchivedTasksDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <Archive className="w-6 h-6" />
              Archived Tasks
            </DialogTitle>
            <DialogDescription>
              Tasks that have been completed. You can restore them anytime.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4">
            {isLoadingArchived ? (
              <div className="flex items-center justify-center py-16">
                <div className="text-gray-500">Loading archived tasks...</div>
              </div>
            ) : archivedTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <Archive className="h-16 w-16 text-gray-300 mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No archived tasks</h3>
                <p className="text-gray-500">Completed tasks will appear here</p>
              </div>
            ) : (
              <div className="grid gap-4 max-h-[50vh] overflow-y-auto">
                {archivedTasks.map((task) => (
                  <Card key={task.id} className="border-2 border-gray-200">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-gray-900 mb-1">{task.description}</h3>
                          <div className="flex gap-4 text-sm text-gray-600">
                            <span>Urgency: {task.urgency}</span>
                            <span>Importance: {task.importance}</span>
                          </div>
                          {task.assignees && task.assignees.length > 0 && (
                            <div className="flex gap-2 flex-wrap mt-2">
                              {task.assignees.map((assignee: any) => (
                                <Badge
                                  key={assignee.id}
                                  className="text-white text-xs"
                                  style={{ backgroundColor: assignee.color }}
                                >
                                  {assignee.name}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        <Button
                          onClick={() => handleRestoreTask(task.id)}
                          variant="outline"
                          size="sm"
                          className="shrink-0"
                        >
                          Restore
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Full-screen organizing overlay */}
      {isOrganizingLoading && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-md">
          <div className="flex flex-col items-center gap-6">
            <div className="relative">
              {/* Animated spinner */}
              <div className="w-20 h-20 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
              {/* Inner pulse */}
              <div className="absolute inset-0 w-20 h-20 border-4 border-white/40 rounded-full animate-ping"></div>
            </div>
            <div className="text-center">
              <h3 className="text-2xl font-bold text-white mb-2">Organizing...</h3>
              <p className="text-white/80 text-lg">AI is reorganizing your tasks</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
