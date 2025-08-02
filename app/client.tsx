"use client"

import React, { useState, useTransition, useEffect, useCallback, useMemo, useRef, useReducer, useDeferredValue } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Map, List, Trash2, Loader2, LogOut, Settings, ChevronDown, ChevronUp, Filter, X, Users, Plus, Link } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useIsMobile } from "@/hooks/use-mobile"
import AccessCodeForm from "@/components/access-code-form"
import { MobileTaskDialog, DesktopTaskDialog, MobilePlayerDialog, DesktopPlayerDialog } from "@/components/TaskDialogs"
import QuadrantMatrix from "@/components/QuadrantMatrix"
import TaskDetailDialog from "@/components/TaskDetailDialog"
import TaskSegment from "@/components/TaskSegment"
import * as actions from "./actions"
import type { Player, TaskWithAssignees, TaskComment, Line } from "@/lib/database"

const PLAYER_COLORS = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#06b6d4",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#f59e0b",
  "#10b981",
  "#6366f1",
  "#d946ef",
]

interface Props {
  initialTasks: TaskWithAssignees[]
  initialPlayers: Player[]
  initialLines?: Line[]
  isOfflineMode?: boolean
}

export default function QuadrantTodoClient({ initialTasks, initialPlayers, initialLines = [], isOfflineMode = false }: Props) {
  console.log("🔄 QuadrantTodoClient initialized/re-rendered:", {
    initialTasksCount: initialTasks.length,
    initialPlayersCount: initialPlayers.length,
    isOfflineMode,
    timestamp: new Date().toISOString()
  })
  
  // 添加组件挂载监控
  useEffect(() => {
    console.log("🎯 QuadrantTodoClient mounted")
    return () => {
      console.log("💀 QuadrantTodoClient unmounted")
    }
  }, [])
  const [hasAccess, setHasAccess] = useState(false)
  const [isCheckingAccess, setIsCheckingAccess] = useState(true)
  const [tasks, setTasks] = useState<TaskWithAssignees[]>(initialTasks)
  const [players, setPlayers] = useState<Player[]>(initialPlayers)
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false)
  
  // 监控对话框状态变化
  useEffect(() => {
    console.log("📱 isTaskDialogOpen changed to:", isTaskDialogOpen)
  }, [isTaskDialogOpen])
  const [isPlayerDialogOpen, setIsPlayerDialogOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<TaskWithAssignees | null>(null)
  const [isTaskDetailOpen, setIsTaskDetailOpen] = useState(false)

  // 使用useReducer优化表单状态管理
  const [formState, setFormState] = useReducer(
    (state: any, action: any) => {
      switch (action.type) {
        case "SET_TASK_DESCRIPTION":
          return { ...state, taskDescription: action.payload }
        case "SET_TASK_URGENCY":
          return { ...state, taskUrgency: action.payload }
        case "SET_TASK_IMPORTANCE":
          return { ...state, taskImportance: action.payload }
        case "SET_TASK_ASSIGNEES":
          return { ...state, taskAssignees: action.payload }
        case "SET_NEW_PLAYER_NAME":
          return { ...state, newPlayerName: action.payload }
        case "RESET_TASK_FORM":
          console.log("Resetting task form")
          return { ...state, taskDescription: "", taskUrgency: [50], taskImportance: [50], taskAssignees: [] }
        case "RESET_PLAYER_FORM":
          console.log("Resetting player form")
          return { ...state, newPlayerName: "" }
        default:
          return state
      }
    },
    {
      taskDescription: "",
      taskUrgency: [50],
      taskImportance: [50],
      taskAssignees: [],
      newPlayerName: "",
    },
  )

  const { taskDescription, taskUrgency, taskImportance, taskAssignees, newPlayerName } = formState

  // 使用useDeferredValue延迟非关键更新
  const deferredTaskDescription = useDeferredValue(taskDescription)
  const deferredNewPlayerName = useDeferredValue(newPlayerName)

  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()
  const isMobile = useIsMobile()
  const [lines, setLines] = useState<Line[]>(initialLines)
  const [isDrawingLine, setIsDrawingLine] = useState(false)
  const [selectedTaskForLine, setSelectedTaskForLine] = useState<number | null>(null)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isSettingsPopoverOpen, setIsSettingsPopoverOpen] = useState(false)
  const [selectedPlayerFilter, setSelectedPlayerFilter] = useState<string>("all")

  // 使用 useRef 来存储 timeout IDs，防止内存泄漏
  const saveTimeoutRef = useRef<{
    tasks?: NodeJS.Timeout
    players?: NodeJS.Timeout
    lines?: NodeJS.Timeout
  }>({})

  // Memoize filtered and sorted tasks to prevent unnecessary re-renders
  const filteredAndSortedTasks = useMemo(() => {
    let filteredTasks = tasks
    
    // Filter by selected player
    if (selectedPlayerFilter !== "all") {
      if (selectedPlayerFilter === "unassigned") {
        filteredTasks = tasks.filter(task => task.assignees.length === 0)
      } else {
        const playerId = parseInt(selectedPlayerFilter)
        filteredTasks = tasks.filter(task => 
          task.assignees.some(player => player.id === playerId)
        )
      }
    }
    
    // Sort tasks
    return [...filteredTasks].sort((a, b) => {
      if (a.importance !== b.importance) {
        return b.importance - a.importance
      }
      return b.urgency - a.urgency
    })
  }, [tasks, selectedPlayerFilter])

  // Memoize quadrant label function
  const getQuadrantLabel = useCallback((urgency: number, importance: number): string => {
    if (urgency >= 50 && importance >= 50) {
      return "Important & Urgent"
    } else if (urgency < 50 && importance >= 50) {
      return "Important & Not Urgent"
    } else if (urgency >= 50 && importance < 50) {
      return "Not Important & Urgent"
    } else {
      return "Not Important & Not Urgent"
    }
  }, [])

  // Check access on component mount and initialize database
  useEffect(() => {
    const checkAccess = async () => {
      const access = localStorage.getItem("quadrant-access")
      setHasAccess(access === "granted")
      
      // Initialize database if not in offline mode
      if (!isOfflineMode && access === "granted") {
        try {
          await actions.initializeDatabaseAction()
          console.log("Database initialized")
        } catch (error) {
          console.error("Failed to initialize database:", error)
        }
      }
      
      setIsCheckingAccess(false)
    }

    checkAccess()
  }, [isOfflineMode])

  // Load from localStorage if in offline mode - only run once when access is granted
  useEffect(() => {
    if (isOfflineMode && hasAccess) {
      const savedTasks = localStorage.getItem("quadrant-tasks")
      const savedPlayers = localStorage.getItem("quadrant-players")
      const savedLines = localStorage.getItem("quadrant-lines")

      if (savedTasks) {
        try {
          const parsedTasks = JSON.parse(savedTasks)
          if (Array.isArray(parsedTasks) && parsedTasks.length > 0) {
            setTasks(parsedTasks)
          }
        } catch (e) {
          console.error("Failed to load tasks from localStorage:", e)
        }
      }

      if (savedPlayers) {
        try {
          const parsedPlayers = JSON.parse(savedPlayers)
          if (Array.isArray(parsedPlayers) && parsedPlayers.length > 0) {
            setPlayers(parsedPlayers)
          }
        } catch (e) {
          console.error("Failed to load players from localStorage:", e)
        }
      }

      if (savedLines) {
        try {
          const parsedLines = JSON.parse(savedLines)
          if (Array.isArray(parsedLines) && parsedLines.length > 0) {
            setLines(parsedLines)
          }
        } catch (e) {
          console.error("Failed to load lines from localStorage:", e)
        }
      }
    }
  }, [isOfflineMode, hasAccess])

  // Save to localStorage in offline mode - 改进的防抖逻辑
  useEffect(() => {
    if (isOfflineMode && hasAccess && tasks.length > 0) {
      // 清除之前的 timeout
      if (saveTimeoutRef.current.tasks) {
        clearTimeout(saveTimeoutRef.current.tasks)
      }

      saveTimeoutRef.current.tasks = setTimeout(() => {
        try {
          localStorage.setItem("quadrant-tasks", JSON.stringify(tasks))
        } catch (e) {
          console.error("Failed to save tasks to localStorage:", e)
        }
      }, 500)
    }

    // 清理函数
    return () => {
      if (saveTimeoutRef.current.tasks) {
        clearTimeout(saveTimeoutRef.current.tasks)
      }
    }
  }, [tasks, isOfflineMode, hasAccess])

  useEffect(() => {
    if (isOfflineMode && hasAccess && players.length > 0) {
      // 清除之前的 timeout
      if (saveTimeoutRef.current.players) {
        clearTimeout(saveTimeoutRef.current.players)
      }

      saveTimeoutRef.current.players = setTimeout(() => {
        try {
          localStorage.setItem("quadrant-players", JSON.stringify(players))
        } catch (e) {
          console.error("Failed to save players to localStorage:", e)
        }
      }, 500)
    }

    // 清理函数
    return () => {
      if (saveTimeoutRef.current.players) {
        clearTimeout(saveTimeoutRef.current.players)
      }
    }
  }, [players, isOfflineMode, hasAccess])

  useEffect(() => {
    if (isOfflineMode && hasAccess && lines.length >= 0) {
      // 清除之前的 timeout
      if (saveTimeoutRef.current.lines) {
        clearTimeout(saveTimeoutRef.current.lines)
      }

      saveTimeoutRef.current.lines = setTimeout(() => {
        try {
          localStorage.setItem("quadrant-lines", JSON.stringify(lines))
        } catch (e) {
          console.error("Failed to save lines to localStorage:", e)
        }
      }, 500)
    }

    // 清理函数
    return () => {
      if (saveTimeoutRef.current.lines) {
        clearTimeout(saveTimeoutRef.current.lines)
      }
    }
  }, [lines, isOfflineMode, hasAccess])

  // 组件卸载时清理所有 timeouts
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current.tasks) {
        clearTimeout(saveTimeoutRef.current.tasks)
      }
      if (saveTimeoutRef.current.players) {
        clearTimeout(saveTimeoutRef.current.players)
      }
      if (saveTimeoutRef.current.lines) {
        clearTimeout(saveTimeoutRef.current.lines)
      }
    }
  }, [])

  // Memoize callback functions to prevent unnecessary re-renders
  const handleAccessGranted = useCallback(() => {
    setHasAccess(true)
  }, [])

  const handleLogout = useCallback(() => {
    localStorage.removeItem("quadrant-access")
    setHasAccess(false)
  }, [])

  // 简化的输入处理器
  const handleTaskDescriptionChange = useCallback((value: string) => {
    setFormState({ type: "SET_TASK_DESCRIPTION", payload: value })
  }, [])

  const handleNewPlayerNameChange = useCallback((value: string) => {
    setFormState({ type: "SET_NEW_PLAYER_NAME", payload: value })
  }, [])

  const handleTaskUrgencyChange = useCallback((value: number[]) => {
    setFormState({ type: "SET_TASK_URGENCY", payload: value })
  }, [])

  const handleTaskImportanceChange = useCallback((value: number[]) => {
    setFormState({ type: "SET_TASK_IMPORTANCE", payload: value })
  }, [])

  const deletePlayer = useCallback(
    (playerId: number) => {
      if (isOfflineMode) {
        // Handle offline mode - 修复删除玩家后任务分配的问题
        setPlayers((prev) => prev.filter((p) => p.id !== playerId))
        setTasks((prev) =>
          prev.map((task) => ({
            ...task,
            assignees: task.assignees.filter((assignee) => assignee.id !== playerId),
          })),
        )
        toast({ title: "Player deleted (offline mode)" })
        return
      }

      // Original database logic
      startTransition(async () => {
        const result = await actions.deletePlayerAction(playerId)
        if (result.success) {
          setPlayers((prev) => prev.filter((p) => p.id !== playerId))
          setTasks((prev) =>
            prev.map((task) => ({
              ...task,
              assignees: task.assignees.filter((assignee) => assignee.id !== playerId),
            })),
          )
          toast({ title: "Player deleted successfully" })
        } else {
          toast({ title: "Error", description: result.error, variant: "destructive" })
        }
      })
    },
    [isOfflineMode, toast],
  )

  const addTask = useCallback(() => {
    console.log("addTask called with:", { taskDescription, taskAssignees, isOfflineMode })

    if (!taskDescription.trim()) {
      toast({ title: "Error", description: "Task description is required", variant: "destructive" })
      return
    }

    // 移除了必须分配玩家的限制

    if (isOfflineMode) {
      console.log("Creating task in offline mode")
      // Handle offline mode
      const assignedPlayers = players.filter((p) => taskAssignees.includes(p.id))
      console.log("Assigned players:", assignedPlayers)

      const task: TaskWithAssignees = {
        id: Date.now(),
        description: taskDescription.trim(),
        urgency: taskUrgency[0],
        importance: taskImportance[0],
        assignees: assignedPlayers,
        comments: [],
        created_at: new Date().toISOString(),
      }

      console.log("Created task:", task)
      setTasks((prev) => [task, ...prev])
      // 重置表单
      setFormState({ type: "RESET_TASK_FORM" })
      setIsTaskDialogOpen(false)
      toast({ title: "Task created (offline mode)" })
      return
    }

    // Database mode
    console.log("Creating task in database mode")
    startTransition(async () => {
      try {
        const result = await actions.createTaskAction(
          taskDescription.trim(),
          taskUrgency[0],
          taskImportance[0],
          taskAssignees,
        )

        console.log("Task creation result:", result)

        if (result.success) {
          setTasks((prev) => [result.task, ...prev])
          // 重置表单
          setFormState({ type: "RESET_TASK_FORM" })
          setIsTaskDialogOpen(false)
          toast({ title: "Task created successfully" })
        } else {
          console.error("Task creation failed:", result.error)
          toast({ title: "Error", description: result.error, variant: "destructive" })
        }
      } catch (error) {
        console.error("Task creation error:", error)
        toast({ title: "Error", description: "Failed to create task", variant: "destructive" })
      }
    })
  }, [taskDescription, taskUrgency, taskImportance, taskAssignees, players, isOfflineMode, toast, startTransition])

  const addPlayer = useCallback(() => {
    console.log("addPlayer called with:", { newPlayerName, isOfflineMode })

    if (!newPlayerName.trim()) {
      toast({ title: "Error", description: "Player name is required", variant: "destructive" })
      return
    }

    if (isOfflineMode) {
      console.log("Creating player in offline mode")
      // Handle offline mode
      const color = PLAYER_COLORS[players.length % PLAYER_COLORS.length]
      const player: Player = {
        id: Date.now(),
        name: newPlayerName.trim(),
        color,
        created_at: new Date().toISOString(),
      }

      console.log("Created player:", player)
      setPlayers((prev) => [...prev, player])
      setFormState({ type: "RESET_PLAYER_FORM" })
      setIsPlayerDialogOpen(false)
      toast({ title: "Player added (offline mode)" })
      return
    }

    // Database mode
    console.log("Creating player in database mode")
    startTransition(async () => {
      try {
        const color = PLAYER_COLORS[players.length % PLAYER_COLORS.length]
        const result = await actions.createPlayerAction(newPlayerName.trim(), color)

        console.log("Player creation result:", result)

        if (result.success) {
          setPlayers((prev) => [...prev, result.player])
          setFormState({ type: "RESET_PLAYER_FORM" })
          setIsPlayerDialogOpen(false)
          toast({ title: "Player added successfully" })
        } else {
          console.error("Player creation failed:", result.error)
          toast({ title: "Error", description: result.error, variant: "destructive" })
        }
      } catch (error) {
        console.error("Player creation error:", error)
        toast({ title: "Error", description: "Failed to create player", variant: "destructive" })
      }
    })
  }, [newPlayerName, players.length, isOfflineMode, toast, startTransition])

  const deleteTask = useCallback(
    (taskId: number) => {
      if (isOfflineMode) {
        // Handle offline mode
        setTasks((prev) => prev.filter((task) => task.id !== taskId))
        // 同时删除相关的连线
        setLines((prev) => prev.filter((line) => line.from_task_id !== taskId && line.to_task_id !== taskId))
        toast({ title: "Task deleted (offline mode)" })
        return
      }

      // Original database logic
      startTransition(async () => {
        const result = await actions.deleteTaskAction(taskId)
        if (result.success) {
          setTasks((prev) => prev.filter((task) => task.id !== taskId))
          // 同时删除相关的连线
          setLines((prev) => prev.filter((line) => line.from_task_id !== taskId && line.to_task_id !== taskId))
          toast({ title: "Task deleted successfully" })
        } else {
          toast({ title: "Error", description: result.error, variant: "destructive" })
        }
      })
    },
    [isOfflineMode, toast],
  )

  const updateTask = useCallback(
    (taskId: number, description: string, urgency: number, importance: number, assigneeIds: number[]) => {
      if (isOfflineMode) {
        // Handle offline mode
        setTasks((prev) =>
          prev.map((task) => {
            if (task.id === taskId) {
              const assignedPlayers = players.filter((p) => assigneeIds.includes(p.id))
              return {
                ...task,
                description: description.trim(),
                urgency,
                importance,
                assignees: assignedPlayers,
              }
            }
            return task
          }),
        )
        toast({ title: "Task updated (offline mode)" })
        return
      }

      // Database mode
      startTransition(async () => {
        try {
          const result = await actions.updateTaskAction(taskId, description, urgency, importance, assigneeIds)
          if (result.success) {
            setTasks((prev) => prev.map((task) => (task.id === taskId ? result.task : task)))
            toast({ title: "Task updated successfully" })
          } else {
            toast({ title: "Error", description: result.error, variant: "destructive" })
          }
        } catch (error) {
          console.error("Task update error:", error)
          toast({ title: "Error", description: "Failed to update task", variant: "destructive" })
        }
      })
    },
    [isOfflineMode, players, toast, startTransition],
  )

  const addComment = useCallback(
    (taskId: number, content: string, authorName: string) => {
      if (isOfflineMode) {
        // Handle offline mode
        const comment: TaskComment = {
          id: Date.now(),
          task_id: taskId,
          content: content.trim(),
          author_name: authorName.trim() || "Anonymous",
          created_at: new Date().toISOString(),
        }

        setTasks((prev) =>
          prev.map((task) => {
            if (task.id === taskId) {
              return {
                ...task,
                comments: [comment, ...(task.comments || [])],
              }
            }
            return task
          }),
        )
        toast({ title: "Comment added (offline mode)" })
        return
      }

      // Database mode
      startTransition(async () => {
        try {
          const result = await actions.addTaskCommentAction(taskId, content, authorName)
          if (result.success) {
            setTasks((prev) =>
              prev.map((task) => {
                if (task.id === taskId) {
                  return {
                    ...task,
                    comments: [result.comment, ...(task.comments || [])],
                  }
                }
                return task
              }),
            )
            toast({ title: "Comment added successfully" })
          } else {
            toast({ title: "Error", description: result.error, variant: "destructive" })
          }
        } catch (error) {
          console.error("Comment add error:", error)
          toast({ title: "Error", description: "Failed to add comment", variant: "destructive" })
        }
      })
    },
    [isOfflineMode, toast, startTransition],
  )

  const deleteComment = useCallback(
    (commentId: number) => {
      if (isOfflineMode) {
        // Handle offline mode
        setTasks((prev) =>
          prev.map((task) => ({
            ...task,
            comments: (task.comments || []).filter((comment) => comment.id !== commentId),
          })),
        )
        toast({ title: "Comment deleted (offline mode)" })
        return
      }

      // Database mode
      startTransition(async () => {
        try {
          const result = await actions.deleteTaskCommentAction(commentId)
          if (result.success) {
            setTasks((prev) =>
              prev.map((task) => ({
                ...task,
                comments: (task.comments || []).filter((comment) => comment.id !== commentId),
              })),
            )
            toast({ title: "Comment deleted successfully" })
          } else {
            toast({ title: "Error", description: result.error, variant: "destructive" })
          }
        } catch (error) {
          console.error("Comment delete error:", error)
          toast({ title: "Error", description: "Failed to delete comment", variant: "destructive" })
        }
      })
    },
    [isOfflineMode, toast, startTransition],
  )

  const createLine = useCallback((fromTaskId: number, toTaskId: number) => {
    if (fromTaskId === toTaskId) return

    if (isOfflineMode) {
      // Handle offline mode
      setLines((prev) => {
        const existingLine = prev.find(
          (line) =>
            (line.from_task_id === fromTaskId && line.to_task_id === toTaskId) ||
            (line.from_task_id === toTaskId && line.to_task_id === fromTaskId),
        )

        if (existingLine) {
          // Delete existing line if same two nodes are clicked again
          return prev.filter(line => line.id !== existingLine.id)
        }

        const newLine: Line = {
          id: Date.now(),
          from_task_id: fromTaskId,
          to_task_id: toTaskId,
          style: "filled",
          size: 8,
          color: "#60a5fa",
          created_at: new Date().toISOString(),
        }

        return [...prev, newLine]
      })
      
      // Toast after state update
      const existingLine = lines.find(
        (line) =>
          (line.from_task_id === fromTaskId && line.to_task_id === toTaskId) ||
          (line.from_task_id === toTaskId && line.to_task_id === fromTaskId),
      )
      
      if (existingLine) {
        toast({ title: "Line deleted (offline mode)" })
      } else {
        toast({ title: "Line created (offline mode)" })
      }
    } else {
      // Database mode
      startTransition(async () => {
        try {
          const result = await actions.toggleLineAction(fromTaskId, toTaskId, "filled", 8, "#60a5fa")
          if (result.success) {
            if (result.action === "created") {
              setLines((prev) => [...prev, result.line])
              toast({ title: "Line created successfully" })
            } else {
              setLines((prev) => prev.filter((line) => line.id !== result.lineId))
              toast({ title: "Line deleted successfully" })
            }
          } else {
            toast({ title: "Error", description: result.error, variant: "destructive" })
          }
        } catch (error) {
          console.error("Line toggle error:", error)
          toast({ title: "Error", description: "Failed to toggle line", variant: "destructive" })
        }
      })
    }

    setIsDrawingLine(false)
    setSelectedTaskForLine(null)
  }, [isOfflineMode, toast, startTransition])

  const deleteLine = useCallback((lineId: number) => {
    if (isOfflineMode) {
      // Handle offline mode
      setLines((prev) => prev.filter((line) => line.id !== lineId))
      toast({ title: "Line deleted (offline mode)" })
    } else {
      // Database mode
      startTransition(async () => {
        try {
          const result = await actions.deleteLineAction(lineId)
          if (result.success) {
            setLines((prev) => prev.filter((line) => line.id !== lineId))
            toast({ title: "Line deleted successfully" })
          } else {
            toast({ title: "Error", description: result.error, variant: "destructive" })
          }
        } catch (error) {
          console.error("Line deletion error:", error)
          toast({ title: "Error", description: "Failed to delete line", variant: "destructive" })
        }
      })
    }
  }, [isOfflineMode, toast, startTransition])

  const handleTaskClick = useCallback(
    (taskId: number) => {
      if (isDrawingLine) {
        if (selectedTaskForLine === null) {
          setSelectedTaskForLine(taskId)
        } else {
          createLine(selectedTaskForLine, taskId)
        }
      }
    },
    [isDrawingLine, selectedTaskForLine, createLine],
  )

  const handleTaskDetailClick = useCallback((task: TaskWithAssignees) => {
    setSelectedTask(task)
    setIsTaskDetailOpen(true)
  }, [])

  // Keep selectedTask synchronized with the tasks array
  const currentSelectedTask = useMemo(() => {
    if (!selectedTask) return null
    return tasks.find(t => t.id === selectedTask.id) || selectedTask
  }, [selectedTask, tasks])

  const handleLongPress = useCallback((urgency: number, importance: number) => {
    console.log("Long press detected at:", { urgency, importance })
    
    // 设置表单的urgency和importance值
    setFormState({ type: "SET_TASK_URGENCY", payload: [Math.round(urgency)] })
    setFormState({ type: "SET_TASK_IMPORTANCE", payload: [Math.round(importance)] })
    
    // 打开任务创建对话框
    setIsTaskDialogOpen(true)
    
    toast({ 
      title: "Long press detected", 
      description: `Create task at Urgency: ${Math.round(urgency)}, Importance: ${Math.round(importance)}` 
    })
  }, [toast])

  const handlePlayerSelect = useCallback(
    (playerId: string) => {
      const id = Number.parseInt(playerId)
      if (!taskAssignees.includes(id)) {
        setFormState({ type: "SET_TASK_ASSIGNEES", payload: [...taskAssignees, id] })
      }
    },
    [taskAssignees],
  )

  const handlePlayerRemove = useCallback(
    (playerId: number) => {
      setFormState({ type: "SET_TASK_ASSIGNEES", payload: taskAssignees.filter((id) => id !== playerId) })
    },
    [taskAssignees],
  )

  const handleDrawingToggle = useCallback(() => {
    setIsDrawingLine((prev) => !prev)
    setSelectedTaskForLine(null)
  }, [])

  const handleTaskMove = useCallback(
    (taskId: number, urgency: number, importance: number) => {
      if (isOfflineMode) {
        // Handle offline mode
        setTasks((prev) =>
          prev.map((task) => {
            if (task.id === taskId) {
              return {
                ...task,
                urgency,
                importance,
              }
            }
            return task
          }),
        )
        toast({ title: "Task moved (offline mode)" })
        return
      }

      // Database mode
      startTransition(async () => {
        try {
          const task = tasks.find(t => t.id === taskId)
          if (!task) return

          const result = await actions.updateTaskAction(
            taskId, 
            task.description, 
            urgency, 
            importance, 
            task.assignees.map(a => a.id)
          )
          if (result.success) {
            setTasks((prev) => prev.map((task) => (task.id === taskId ? result.task : task)))
            toast({ title: "Task moved successfully" })
          } else {
            toast({ title: "Error", description: result.error, variant: "destructive" })
          }
        } catch (error) {
          console.error("Task move error:", error)
          toast({ title: "Error", description: "Failed to move task", variant: "destructive" })
        }
      })
    },
    [isOfflineMode, tasks, toast, startTransition],
  )

  // 添加键盘事件处理
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isDrawingLine) {
          setIsDrawingLine(false)
          setSelectedTaskForLine(null)
        }
      }
    },
    [isDrawingLine],
  )

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [handleKeyDown])

  // Show loading state while checking access
  if (isCheckingAccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  // Show access code form if not authenticated
  if (!hasAccess) {
    return <AccessCodeForm onAccessGranted={handleAccessGranted} />
  }

  return (
    <div className="min-h-screen bg-gray-50 p-2 sm:p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-4">
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="flex items-center">
              <Image 
                src="/itsnotai_logo.png" 
                alt="ItsNotAI Task Manager" 
                width={200} 
                height={60}
                className="h-8 sm:h-12 w-auto"
                priority
              />
            </div>
            {isOfflineMode && (
              <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300 text-xs sm:text-sm">
                Offline Mode
              </Badge>
            )}
          </div>
          
          {/* Mobile Settings Panel */}
          {isMobile ? (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Sheet open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="lg" className="w-full">
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </Button>
                </SheetTrigger>
                <SheetContent side="bottom" className="h-auto max-h-[80vh]">
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 -m-6 mb-0 p-6 border-b">
                    <SheetHeader>
                      <SheetTitle className="text-lg text-gray-900">Settings & Actions</SheetTitle>
                      <p className="text-sm text-gray-600 mt-1">Manage your tasks and workspace</p>
                    </SheetHeader>
                  </div>
                  
                  <div className="space-y-6 py-6">
                    {/* Quick Actions Section */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-sm font-medium text-gray-700 flex items-center">
                          <Plus className="w-4 h-4 mr-2" />
                          Quick Actions
                        </h4>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => {
                            console.log("🧪 Test button clicked, opening dialog")
                            setIsTaskDialogOpen(true)
                          }}
                        >
                          Test
                        </Button>
                      </div>
                      <div className="space-y-3">
                        <MobileTaskDialog
                          isOpen={isTaskDialogOpen}
                          onOpenChange={setIsTaskDialogOpen}
                          taskDescription={taskDescription}
                          taskUrgency={taskUrgency}
                          taskImportance={taskImportance}
                          taskAssignees={taskAssignees}
                          players={players}
                          isPending={isPending}
                          isMobile={isMobile}
                          onTaskDescriptionChange={handleTaskDescriptionChange}
                          onTaskUrgencyChange={handleTaskUrgencyChange}
                          onTaskImportanceChange={handleTaskImportanceChange}
                          onPlayerSelect={handlePlayerSelect}
                          onPlayerRemove={handlePlayerRemove}
                          onAddTask={addTask}
                        />
                        <MobilePlayerDialog
                          isOpen={isPlayerDialogOpen}
                          onOpenChange={setIsPlayerDialogOpen}
                          newPlayerName={newPlayerName}
                          players={players}
                          isPending={isPending}
                          isMobile={isMobile}
                          onNewPlayerNameChange={handleNewPlayerNameChange}
                          onAddPlayer={addPlayer}
                          onDeletePlayer={deletePlayer}
                        />
                      </div>
                    </div>

                    {/* Tools Section */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-4 flex items-center">
                        <Link className="w-4 h-4 mr-2" />
                        Tools
                      </h4>
                      <Button
                        variant={isDrawingLine ? "default" : "outline"}
                        size="lg"
                        onClick={() => {
                          handleDrawingToggle()
                          setIsSettingsOpen(false)
                        }}
                        disabled={isPending}
                        className="w-full justify-start"
                      >
                        <Link className="w-4 h-4 mr-2" />
                        {isDrawingLine ? "Cancel Connection" : "Connect Tasks"}
                      </Button>
                    </div>

                    {/* Filter Section */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-4 flex items-center">
                        <Filter className="w-4 h-4 mr-2" />
                        Filter Tasks
                      </h4>
                      <Select value={selectedPlayerFilter} onValueChange={setSelectedPlayerFilter}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Filter by player" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Tasks</SelectItem>
                          <SelectItem value="unassigned">Unassigned</SelectItem>
                          {players.map((player) => (
                            <SelectItem key={player.id} value={player.id.toString()}>
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: player.color }}
                                />
                                {player.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Sign Out Section */}
                    <div className="pt-4 border-t">
                      <Button
                        variant="ghost"
                        size="lg"
                        onClick={handleLogout}
                        className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Sign Out
                      </Button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          ) : (
            /* Desktop Beautiful Settings Popover */
            <div className="w-full sm:w-auto">
              <Popover open={isSettingsPopoverOpen} onOpenChange={setIsSettingsPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="relative">
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                    <ChevronDown className="w-4 h-4 ml-2" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-96 p-0" align="end">
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 border-b">
                    <h3 className="font-semibold text-lg text-gray-900">Settings & Actions</h3>
                    <p className="text-sm text-gray-600 mt-1">Manage your team and tasks</p>
                  </div>
                  
                  <div className="p-4 space-y-4">
                    {/* Quick Actions Section */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                        <Plus className="w-4 h-4 mr-2" />
                        Quick Actions
                      </h4>
                      <div className="grid grid-cols-2 gap-2">
                        <DesktopTaskDialog
                          isOpen={isTaskDialogOpen}
                          onOpenChange={setIsTaskDialogOpen}
                          taskDescription={taskDescription}
                          taskUrgency={taskUrgency}
                          taskImportance={taskImportance}
                          taskAssignees={taskAssignees}
                          players={players}
                          isPending={isPending}
                          isMobile={isMobile}
                          onTaskDescriptionChange={handleTaskDescriptionChange}
                          onTaskUrgencyChange={handleTaskUrgencyChange}
                          onTaskImportanceChange={handleTaskImportanceChange}
                          onPlayerSelect={handlePlayerSelect}
                          onPlayerRemove={handlePlayerRemove}
                          onAddTask={addTask}
                        />
                        <DesktopPlayerDialog
                          isOpen={isPlayerDialogOpen}
                          onOpenChange={setIsPlayerDialogOpen}
                          newPlayerName={newPlayerName}
                          players={players}
                          isPending={isPending}
                          isMobile={isMobile}
                          onNewPlayerNameChange={handleNewPlayerNameChange}
                          onAddPlayer={addPlayer}
                          onDeletePlayer={deletePlayer}
                        />
                      </div>
                    </div>

                    {/* Tools Section */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                        
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-link w-4 h-4 mr-2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>Add Dependency
                      </h4>
                      <Button
                        variant={isDrawingLine ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          handleDrawingToggle()
                          setIsSettingsPopoverOpen(false)
                        }}
                        disabled={isPending}
                        className="w-full justify-start"
                      >
                        <Link className="w-4 h-4 mr-2" />
                        {isDrawingLine ? "Cancel Connection" : "Connect Tasks"}
                      </Button>
                    </div>

                    {/* Filter Section */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                        <Filter className="w-4 h-4 mr-2" />
                        Filter by Player
                      </h4>
                      <Select value={selectedPlayerFilter} onValueChange={setSelectedPlayerFilter}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Filter by player" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Tasks</SelectItem>
                          <SelectItem value="unassigned">Unassigned</SelectItem>
                          {players.map((player) => (
                            <SelectItem key={player.id} value={player.id.toString()}>
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: player.color }}
                                />
                                {player.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="border-t bg-gray-50 p-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleLogout}
                      className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          )}
        </div>

        <Tabs defaultValue="map" className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-12 sm:h-10">
            <TabsTrigger value="map" className="flex items-center gap-2 text-sm sm:text-base">
              <Map className="w-4 h-4" />
            </TabsTrigger>
            <TabsTrigger value="list" className="flex items-center gap-2 text-sm sm:text-base">
              <List className="w-4 h-4" />
            </TabsTrigger>
          </TabsList>

          <TabsContent value="map" className="mt-4 sm:mt-6">
            {selectedPlayerFilter !== "all" && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-blue-600" />
                    <span className="text-sm text-blue-700">
                      Filtered: {filteredAndSortedTasks.length} of {tasks.length} tasks shown
                      {selectedPlayerFilter === "unassigned" ? " (unassigned)" : 
                       ` (${players.find(p => p.id.toString() === selectedPlayerFilter)?.name})`}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedPlayerFilter("all")}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
            <QuadrantMatrix
              tasks={selectedPlayerFilter !== "all" ? filteredAndSortedTasks : tasks}
              players={players}
              lines={lines}
              isMobile={isMobile}
              isDrawingLine={isDrawingLine}
              selectedTaskForLine={selectedTaskForLine}
              onTaskClick={handleTaskClick}
              onDeleteLine={deleteLine}
              onTaskDetailClick={handleTaskDetailClick}
              onLongPress={handleLongPress}
              onTaskMove={handleTaskMove}
            />
          </TabsContent>

          <TabsContent value="list" className="mt-4 sm:mt-6">
            <Card>
              <CardHeader className="px-4 sm:px-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <CardTitle className="text-lg sm:text-xl">Tasks by Priority</CardTitle>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2">
                      <Filter className="w-4 h-4 text-gray-600" />
                      <Select value={selectedPlayerFilter} onValueChange={setSelectedPlayerFilter}>
                        <SelectTrigger className="w-48">
                          <SelectValue placeholder="Filter by player" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Tasks</SelectItem>
                          <SelectItem value="unassigned">Unassigned</SelectItem>
                          {players.map((player) => (
                            <SelectItem key={player.id} value={player.id.toString()}>
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: player.color }}
                                />
                                {player.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                {selectedPlayerFilter !== "all" && (
                  <div className="mt-2 text-sm text-gray-500">
                    Showing {filteredAndSortedTasks.length} of {tasks.length} tasks
                    {selectedPlayerFilter === "unassigned" ? " (unassigned)" : 
                     ` (${players.find(p => p.id.toString() === selectedPlayerFilter)?.name})`}
                  </div>
                )}
              </CardHeader>
              <CardContent className="px-4 sm:px-6">
                <div className="space-y-3">
                  {filteredAndSortedTasks.length === 0 ? (
                    selectedPlayerFilter !== "all" ? (
                      <p className="text-gray-500 text-center py-8">
                        No tasks found for {selectedPlayerFilter === "unassigned" ? "unassigned" : 
                        players.find(p => p.id.toString() === selectedPlayerFilter)?.name}
                      </p>
                    ) : (
                      <p className="text-gray-500 text-center py-8">No tasks yet. Create your first task!</p>
                    )
                  ) : (
                    filteredAndSortedTasks.map((task) => (
                      <div
                        key={task.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 border rounded-lg hover:bg-gray-50 gap-3 sm:gap-4 cursor-pointer"
                        onClick={() => handleTaskDetailClick(task)}
                      >
                        <div className="flex items-center gap-3 sm:gap-4">
                          <TaskSegment task={task} size={isMobile ? 28 : 32} />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm sm:text-base truncate">{task.description}</p>
                            <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500 mt-1">
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
                            {task.assignees.length === 0 ? (
                              <span className="text-xs text-gray-400 italic">Unassigned</span>
                            ) : (
                              task.assignees.map((player) => (
                                <div key={player.id} className="flex items-center gap-1">
                                  <div
                                    className="w-2 h-2 sm:w-3 sm:h-3 rounded-full"
                                    style={{ backgroundColor: player.color }}
                                  />
                                  <span className="text-xs text-gray-600">{player.name}</span>
                                </div>
                              ))
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              deleteTask(task.id)
                            }}
                            className="text-red-500 hover:text-red-700 h-8 w-8 sm:h-auto sm:w-auto"
                            disabled={isPending}
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

        {/* Task Detail Dialog */}
        <TaskDetailDialog
          task={currentSelectedTask}
          isOpen={isTaskDetailOpen}
          onOpenChange={setIsTaskDetailOpen}
          isMobile={isMobile}
          players={players}
          onDeleteTask={deleteTask}
          onUpdateTask={updateTask}
          onAddComment={addComment}
          onDeleteComment={deleteComment}
          isPending={isPending}
        />
      </div>
    </div>
  )
}
