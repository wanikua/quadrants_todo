"use client"

import { useState, useCallback, useMemo, useEffect } from "react"
import type { TaskWithAssignees, Player, Line, Project } from "./types"
import QuadrantMatrixMap from "@/components/QuadrantMatrixMap"
import { createTask, deleteTask, updateTask as updateTaskAction, deletePlayer, updatePlayer, addComment, deleteComment as deleteCommentAction, updateUserActivity, getActiveUserCount, getArchivedTasks } from "@/app/db/actions"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Map as MapIcon, List, Trash2, Filter, X, Users, Plus, Link as LinkIcon, Settings, ChevronDown, Check, Edit, Sparkles, LogOut } from "lucide-react"
import TaskDetailDialog from "@/components/TaskDetailDialog"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
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
import TaskSegment from "@/components/TaskSegment"
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
}: QuadrantTodoClientProps) {
  const router = useRouter()

  // Local state for optimistic updates
  const [tasks, setTasks] = useState<TaskWithAssignees[]>(initialTasks)
  const [players, setPlayers] = useState<Player[]>(initialPlayers)
  const [lines, setLines] = useState<Line[]>(initialLines)

  const [isDrawingLine, setIsDrawingLine] = useState(false)
  const [selectedTask, setSelectedTask] = useState<TaskWithAssignees | null>(null)
  const [isTaskDetailOpen, setIsTaskDetailOpen] = useState(false)
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false)
  const [isBulkAddOpen, setIsBulkAddOpen] = useState(false)
  const [selectedPlayerFilter, setSelectedPlayerFilter] = useState<string>("all")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [taskToDelete, setTaskToDelete] = useState<TaskWithAssignees | null>(null)
  const [deleteTaskDialogOpen, setDeleteTaskDialogOpen] = useState(false)
  const [isManagePlayersOpen, setIsManagePlayersOpen] = useState(false)
  const [editingPlayerId, setEditingPlayerId] = useState<number | null>(null)
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date())
  const [activeUserCount, setActiveUserCount] = useState<number>(0)

  // Project editing state
  const [isEditingProject, setIsEditingProject] = useState(false)
  const [editedProjectName, setEditedProjectName] = useState(projectName || "")
  const [editedProjectDescription, setEditedProjectDescription] = useState("")
  const [isArchiving, setIsArchiving] = useState(false)
  const [showArchiveDialog, setShowArchiveDialog] = useState(false)

  // One-click organize state
  const [isOrganizing, setIsOrganizing] = useState(false)
  const [originalTaskPositions, setOriginalTaskPositions] = useState<Map<number, { urgency: number; importance: number }>>(new Map())

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
  }, [tasks])

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
    try {
      console.log('🔄 [Sync] Fetching data from server...')
      const response = await fetch(`/api/projects/${projectId}/sync`)
      if (response.ok) {
        const result = await response.json()
        console.log('✅ [Sync] Data received:', {
          tasks: result.data?.tasks?.length || 0,
          players: result.data?.players?.length || 0,
          lines: result.data?.lines?.length || 0
        })
        if (result.success && result.data) {
          // Update local state with server data
          setTasks(result.data.tasks || [])
          setPlayers(result.data.players || [])
          setLines(result.data.lines || [])
          setLastSyncTime(new Date())
        }
      } else {
        console.error('❌ [Sync] Failed:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('❌ [Sync] Error:', error)
    }
  }, [projectId])

  // Check for active users - only enables sync if multiple users detected
  useEffect(() => {
    if (projectType === 'team' && !isOfflineMode) {
      let checkInterval: NodeJS.Timeout | null = null

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
    console.log('🔍 [Sync] Effect triggered - projectType:', projectType, 'isOfflineMode:', isOfflineMode, 'activeUserCount:', activeUserCount)

    if (projectType === 'team' && !isOfflineMode) {
      console.log('🚀 [Sync] Starting real-time sync, activeUserCount:', activeUserCount)
      let interval: NodeJS.Timeout | null = null
      let isPageVisible = true

      // Determine sync interval based on user count
      // Multiple users: 1 second (real-time)
      // Single user: 3 seconds (still responsive but less resource intensive)
      const syncInterval = activeUserCount > 1 ? 1000 : 3000
      console.log(`📊 [Sync] Using interval: ${syncInterval}ms (${activeUserCount > 1 ? 'multi-user' : 'single-user'} mode)`)

      // Check if page is visible
      const handleVisibilityChange = () => {
        isPageVisible = !document.hidden

        if (isPageVisible) {
          console.log('👁️ [Sync] Page visible, resuming sync')
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
          console.log('👁️ [Sync] Page hidden, pausing sync')
          // Pause polling when page is hidden to save resources
          if (interval) clearInterval(interval)
        }
      }

      // Listen for visibility changes
      document.addEventListener('visibilitychange', handleVisibilityChange)

      // Start initial polling
      console.log(`⏰ [Sync] Starting polling every ${syncInterval}ms`)
      interval = setInterval(() => {
        if (isPageVisible) {
          syncData()
        }
      }, syncInterval)

      // Initial sync
      syncData()

      return () => {
        console.log('🛑 [Sync] Stopping sync')
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

    return [...filtered].sort((a, b) => {
      if (a.importance !== b.importance) {
        return b.importance - a.importance
      }
      return b.urgency - a.urgency
    })
  }, [tasks, selectedPlayerFilter])

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
        }).catch(err => console.error('Failed to record learning:', err))
      }

      // Refresh to get latest data from server
      router.refresh()
    } else {
      // Refresh to rollback on error
      router.refresh()
      toast.error(result.error || "Failed to update task")
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
    if (!newTaskData.description.trim()) return
    await handleTaskCreate(
      newTaskData.description,
      newTaskData.urgency,
      newTaskData.importance,
      newTaskData.assigneeIds
    )
    // Reset to default with current user pre-selected for team projects
    setNewTaskData({
      description: "",
      urgency: 50,
      importance: 50,
      assigneeIds: (projectType === "team" && currentUserPlayer) ? [currentUserPlayer.id] : [],
    })
    setIsAddTaskOpen(false)
  }

  const handleDrawingToggle = () => {
    setIsDrawingLine(!isDrawingLine)
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
      console.error(error)
    } finally {
      setIsDeleting(false)
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
      console.error(error)
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
      console.error(error)
    } finally {
      setIsArchiving(false)
    }
  }

  // One-click organize: intelligently redistribute tasks using AI
  const handleOrganizeTasks = async () => {
    console.log('🔵 handleOrganizeTasks called, tasks.length:', tasks.length, 'isOrganizing:', isOrganizing)

    // Prevent organizing if already in organize mode
    if (isOrganizing) {
      console.log('⚠️ Already in organize mode, ignoring request')
      toast.warning("Please accept or revert current changes first")
      return
    }

    if (tasks.length === 0) {
      toast.warning("No tasks to organize")
      return
    }

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
        return
      }
    } catch (error) {
      console.error('Lock acquire error:', error)
      toast.error('Failed to start organize operation')
      return
    }

    // Save original positions
    const originalPositions = new Map<number, { urgency: number; importance: number }>()
    tasks.forEach(task => {
      originalPositions.set(task.id, { urgency: task.urgency, importance: task.importance })
    })
    setOriginalTaskPositions(originalPositions)
    console.log('🔵 Original positions saved:', originalPositions.size, 'tasks')

    toast.info("Organizing tasks...")

    try {
      const requestBody = {
        tasks: tasks.map(t => ({
          id: t.id,
          description: t.description,
          urgency: t.urgency,
          importance: t.importance
        }))
      }
      console.log('🔵 Calling API with', requestBody.tasks.length, 'tasks')
      console.log('🔵 Task positions before:', requestBody.tasks.map(t => `Task ${t.id}: (${t.urgency}, ${t.importance})`).join(', '))

      // Call AI API to organize tasks
      const response = await fetch('/api/ai/organize-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      })

      console.log('🔵 API response status:', response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('🔴 API error:', response.status, errorText)
        throw new Error(`Failed to organize tasks: ${response.status}`)
      }

      const responseData = await response.json()
      console.log('🔵 API response data:', responseData)
      const { organizedTasks } = responseData

      console.log('🔵 Organized tasks received:', organizedTasks.length)
      console.log('🔵 Task positions after:', organizedTasks.map((t: any) => `Task ${t.id}: (${t.urgency}, ${t.importance})`).join(', '))

      // Apply organized positions to tasks
      const updatedTasks = tasks.map(task => {
        const organized = organizedTasks.find((o: any) => o.id === task.id)
        if (organized) {
          return {
            ...task,
            urgency: Math.round(organized.urgency),
            importance: Math.round(organized.importance)
          }
        }
        return task
      })

      console.log('🔵 Setting', updatedTasks.length, 'updated tasks')
      setTasks(updatedTasks)
      setIsOrganizing(true)
      toast.success("Tasks organized! Review changes and Accept or Revert.")
    } catch (error) {
      console.error('🔴 Organization error:', error)
      toast.error('Failed to organize tasks. Please try again.')
      setOriginalTaskPositions(new Map())

      // Release lock on error
      await fetch(`/api/projects/${projectId}/organize-lock`, {
        method: 'DELETE'
      })
    }
  }

  const handleAcceptOrganize = async () => {
    console.log('🟢 Accepting organize changes...')

    // Only update tasks that actually moved
    const tasksToUpdate = tasks.filter(task => {
      const original = originalTaskPositions.get(task.id)
      if (!original) return false
      return original.urgency !== task.urgency || original.importance !== task.importance
    })

    console.log(`📊 Updating ${tasksToUpdate.length} out of ${tasks.length} tasks`)

    if (tasksToUpdate.length === 0) {
      console.log('⚠️ No tasks to update')
      setOriginalTaskPositions(new Map())
      setIsOrganizing(false)
      toast.info("No changes to save")

      // Release lock
      await fetch(`/api/projects/${projectId}/organize-lock`, { method: 'DELETE' })
      return
    }

    // Immediately update UI for instant feedback
    const updatedTasks = tasks.map(task => {
      const wasMoved = tasksToUpdate.some(t => t.id === task.id)
      if (wasMoved) {
        return { ...task, updated_at: new Date() }
      }
      return task
    })

    setTasks(updatedTasks)
    setOriginalTaskPositions(new Map())
    setIsOrganizing(false)
    setLastSyncTime(new Date())
    toast.success(`Saving ${tasksToUpdate.length} task${tasksToUpdate.length > 1 ? 's' : ''}...`)

    // Save to database in background
    const updatePromises = tasksToUpdate.map(task =>
      updateTaskAction(task.id, task.urgency, task.importance, task.description)
    )

    try {
      await Promise.all(updatePromises)
      console.log('🟢 Organization changes saved successfully')
    } catch (error) {
      console.error("🔴 Failed to save organization:", error)
      toast.error("Failed to save changes to database")
    } finally {
      // Release lock after saving
      await fetch(`/api/projects/${projectId}/organize-lock`, { method: 'DELETE' })
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
    toast.info("Changes reverted")

    // Release lock
    await fetch(`/api/projects/${projectId}/organize-lock`, { method: 'DELETE' })
  }

  // Algorithm to organize tasks and spread out overlaps
  function organizeTasks(tasks: TaskWithAssignees[]): TaskWithAssignees[] {
    const organized = [...tasks]
    const positionMap = new Map<string, TaskWithAssignees[]>()

    // Group tasks by similar positions (within 5% tolerance)
    organized.forEach(task => {
      const key = `${Math.round(task.urgency / 5)}_${Math.round(task.importance / 5)}`
      if (!positionMap.has(key)) {
        positionMap.set(key, [])
      }
      positionMap.get(key)!.push(task)
    })

    // Spread out overlapping tasks
    positionMap.forEach((groupTasks, key) => {
      if (groupTasks.length > 1) {
        // Calculate spread based on number of tasks
        const spreadRadius = Math.min(15, 5 + groupTasks.length * 2)
        const angleStep = (2 * Math.PI) / groupTasks.length

        groupTasks.forEach((task, index) => {
          const angle = angleStep * index
          const offsetX = Math.cos(angle) * spreadRadius
          const offsetY = Math.sin(angle) * spreadRadius

          task.urgency = Math.max(0, Math.min(100, task.urgency + offsetX))
          task.importance = Math.max(0, Math.min(100, task.importance + offsetY))
        })
      }
    })

    return organized
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
    <div className="min-h-screen bg-background p-2 sm:p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-4">
          <div className="flex items-center gap-2 sm:gap-4">
            {isOfflineMode && (
              <Badge variant="outline" className="bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20">
                Offline Mode
              </Badge>
            )}
            {projectType === 'team' && !isOfflineMode && (
              <Badge
                variant="outline"
                className={`${
                  activeUserCount > 1
                    ? 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20 animate-pulse'
                    : 'bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20'
                }`}
              >
                <div className="flex items-center gap-2">
                  {activeUserCount > 1 ? (
                    <>
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span>Live • {activeUserCount} users • Synced {getTimeAgo(lastSyncTime)}</span>
                    </>
                  ) : (
                    <>
                      <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                      <span>You • {activeUserCount} user online</span>
                    </>
                  )}
                </div>
              </Badge>
            )}
          </div>
        </div>


        {/* Project Header with Settings */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 group cursor-pointer" onClick={() => setIsEditingProject(true)}>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground group-hover:text-primary transition-colors">{projectName}</h1>
            <Edit className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsBulkAddOpen(true)}>
              <Sparkles className="w-4 h-4 mr-2 text-purple-600" />
              Bulk Add
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                  <ChevronDown className="w-4 h-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel>Settings</DropdownMenuLabel>
              <div className="px-2 py-1 text-xs text-muted-foreground">Manage your team and tasks</div>

              <DropdownMenuSeparator />

              <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">Quick Actions</DropdownMenuLabel>
              <DropdownMenuItem className="cursor-pointer" onClick={() => {
                // Reset task data with default assignee before opening dialog
                setNewTaskData({
                  description: "",
                  urgency: 50,
                  importance: 50,
                  assigneeIds: (projectType === "team" && currentUserPlayer) ? [currentUserPlayer.id] : [],
                })
                setIsAddTaskOpen(true)
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Add Task
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer" onClick={handleDrawingToggle}>
                <LinkIcon className="h-4 w-4 mr-2" />
                {isDrawingLine ? "Cancel Connection" : "Connect Tasks"}
              </DropdownMenuItem>

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

                  <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">Manage Players</DropdownMenuLabel>
                  <DropdownMenuItem className="cursor-pointer" onClick={() => setIsManagePlayersOpen(true)}>
                    <Users className="h-4 w-4 mr-2" />
                    {userRole === "owner" ? "View & Manage Players" : "View Players"}
                  </DropdownMenuItem>
                </>
              )}

              <DropdownMenuSeparator />

              <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">Project Actions</DropdownMenuLabel>

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
                  onClick={() => {
                    if (confirm("Are you sure you want to leave this project?")) {
                      // TODO: Implement leave project functionality
                      toast.info("Leave project functionality coming soon")
                    }
                  }}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Leave Project
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          </div>
        </div>

        {/* Tabs for Map/List View */}
        <Tabs defaultValue="map" className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-12 sm:h-10">
            <TabsTrigger value="map" className="flex items-center justify-center">
              <MapIcon className="w-5 h-5" />
            </TabsTrigger>
            <TabsTrigger value="list" className="flex items-center justify-center">
              <List className="w-5 h-5" />
            </TabsTrigger>
          </TabsList>

          {/* Map View Tab */}
          <TabsContent value="map" className="mt-4 sm:mt-6">
            {selectedPlayerFilter !== "all" && (
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
              isDrawingLine={isDrawingLine}
              onTaskDetailClick={handleTaskDetailClick}
              onToggleDrawingMode={handleDrawingToggle}
              onLongPress={handleLongPress}
              userName={userName}
              projectType={projectType}
              highestPriorityTaskId={highestPriorityTaskId}
              setTasks={setTasks}
              onOrganizeTasks={handleOrganizeTasks}
              isOrganizing={isOrganizing}
              originalTaskPositions={originalTaskPositions}
              onAcceptOrganize={handleAcceptOrganize}
              onRevertOrganize={handleRevertOrganize}
            />
          </TabsContent>

          {/* List View Tab */}
          <TabsContent value="list" className="mt-4 sm:mt-6">
            <Card>
              <CardHeader className="px-4 sm:px-6">
                <CardTitle className="text-lg sm:text-xl">Tasks by Priority</CardTitle>
              </CardHeader>
              <CardContent className="px-4 sm:px-6">
                <div className="space-y-3">
                  {filteredAndSortedTasks.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      No tasks yet. Create your first task!
                    </p>
                  ) : (
                    filteredAndSortedTasks.map((task) => (
                      <div
                        key={task.id}
                        className={`flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 border rounded-lg hover:bg-accent cursor-pointer gap-3 sm:gap-4 transition-all ${
                          task.id === highestPriorityTaskId ? 'border-yellow-400 border-2 bg-yellow-50 shadow-lg' : ''
                        }`}
                        onClick={() => handleTaskDetailClick(task)}
                      >
                        <div className="flex items-center gap-3 sm:gap-4">
                          <TaskSegment
                            task={task}
                            size={isMobile ? 28 : 32}
                            userName={userName}
                            projectType={projectType}
                            isHighestPriority={task.id === highestPriorityTaskId}
                            hasMoved={
                              isOrganizing &&
                              originalTaskPositions.has(task.id) &&
                              (originalTaskPositions.get(task.id)!.urgency !== task.urgency ||
                                originalTaskPositions.get(task.id)!.importance !== task.importance)
                            }
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm sm:text-base truncate">{task.description}</p>
                            <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground mt-1">
                              <span>Urgency: {task.urgency}</span>
                              <span>Importance: {task.importance}</span>
                              <Badge variant="outline" className="text-xs">
                                {getQuadrantLabel(task.urgency, task.importance)}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between sm:justify-end gap-2">
                          <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                            {!task.assignees || task.assignees.length === 0 ? (
                              <span className="text-xs text-muted-foreground italic">Unassigned</span>
                            ) : (
                              task.assignees.map((player) => (
                                <div key={player.id} className="flex items-center gap-1">
                                  <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full" style={{ backgroundColor: player.color }} />
                                  <span className="text-xs text-muted-foreground">{player.name}</span>
                                </div>
                              ))
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleTaskDelete(task.id)
                            }}
                            className="text-destructive hover:text-destructive h-8 w-8 sm:h-auto sm:w-auto"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

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
                <Button variant="outline" onClick={() => setIsAddTaskOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSubmitTask} disabled={!newTaskData.description.trim()}>
                  Create Task
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
      </div>
    </div>
  )
}
