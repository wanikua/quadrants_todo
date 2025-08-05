"use client"

import type React from "react"
import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Users, Trash2, Edit, MessageSquare } from "lucide-react"
import { TaskDialogs } from "./TaskDialogs"
import { TaskDetailDialog } from "./TaskDetailDialog"
import type { TaskWithAssignees, Player, Line } from "@/lib/database"
import {
  createTaskAction,
  updateTaskAction,
  deleteTaskAction,
  createPlayerAction,
  deletePlayerAction,
  addTaskCommentAction,
  deleteTaskCommentAction,
  toggleLineAction,
  deleteLineAction,
  initializeDatabaseAction,
} from "@/app/actions"
import { toast } from "sonner"

interface QuadrantMatrixProps {
  initialTasks: TaskWithAssignees[]
  initialPlayers: Player[]
  initialLines: Line[]
}

export function QuadrantMatrix({ initialTasks, initialPlayers, initialLines }: QuadrantMatrixProps) {
  const [tasks, setTasks] = useState<TaskWithAssignees[]>(initialTasks || [])
  const [players, setPlayers] = useState<Player[]>(initialPlayers || [])
  const [lines, setLines] = useState<Line[]>(initialLines || [])
  const [selectedTask, setSelectedTask] = useState<TaskWithAssignees | null>(null)
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false)
  const [isPlayerDialogOpen, setIsPlayerDialogOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<TaskWithAssignees | null>(null)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [connectionStart, setConnectionStart] = useState<TaskWithAssignees | null>(null)
  const matrixRef = useRef<HTMLDivElement>(null)

  // Initialize database on component mount
  useEffect(() => {
    const initDb = async () => {
      try {
        await initializeDatabaseAction()
      } catch (error) {
        console.error("Failed to initialize database:", error)
      }
    }
    initDb()
  }, [])

  const getQuadrant = (urgency: number, importance: number): number => {
    if (urgency >= 50 && importance >= 50) return 1 // High urgency, high importance
    if (urgency < 50 && importance >= 50) return 2 // Low urgency, high importance
    if (urgency >= 50 && importance < 50) return 3 // High urgency, low importance
    return 4 // Low urgency, low importance
  }

  const getQuadrantTasks = (quadrant: number) => {
    return tasks.filter((task) => getQuadrant(task.urgency, task.importance) === quadrant)
  }

  const getQuadrantTitle = (quadrant: number) => {
    switch (quadrant) {
      case 1:
        return "Do First (Urgent & Important)"
      case 2:
        return "Schedule (Not Urgent & Important)"
      case 3:
        return "Delegate (Urgent & Not Important)"
      case 4:
        return "Eliminate (Not Urgent & Not Important)"
      default:
        return ""
    }
  }

  const getQuadrantColor = (quadrant: number) => {
    switch (quadrant) {
      case 1:
        return "bg-red-50 border-red-200"
      case 2:
        return "bg-yellow-50 border-yellow-200"
      case 3:
        return "bg-blue-50 border-blue-200"
      case 4:
        return "bg-green-50 border-green-200"
      default:
        return "bg-gray-50 border-gray-200"
    }
  }

  const handleCreateTask = async (description: string, urgency: number, importance: number, assigneeIds: number[]) => {
    try {
      const result = await createTaskAction(description, urgency, importance, assigneeIds)
      if (result.success && result.task) {
        setTasks((prev) => [result.task, ...prev])
        toast.success("Task created successfully")
      } else {
        toast.error(result.error || "Failed to create task")
      }
    } catch (error) {
      console.error("Error creating task:", error)
      toast.error("Failed to create task")
    }
  }

  const handleUpdateTask = async (
    taskId: number,
    description: string,
    urgency: number,
    importance: number,
    assigneeIds: number[],
  ) => {
    try {
      const result = await updateTaskAction(taskId, description, urgency, importance, assigneeIds)
      if (result.success && result.task) {
        setTasks((prev) => prev.map((task) => (task.id === taskId ? result.task : task)))
        toast.success("Task updated successfully")
      } else {
        toast.error(result.error || "Failed to update task")
      }
    } catch (error) {
      console.error("Error updating task:", error)
      toast.error("Failed to update task")
    }
  }

  const handleDeleteTask = async (taskId: number) => {
    try {
      const result = await deleteTaskAction(taskId)
      if (result.success) {
        setTasks((prev) => prev.filter((task) => task.id !== taskId))
        setLines((prev) => prev.filter((line) => line.from_task_id !== taskId && line.to_task_id !== taskId))
        toast.success("Task deleted successfully")
      } else {
        toast.error(result.error || "Failed to delete task")
      }
    } catch (error) {
      console.error("Error deleting task:", error)
      toast.error("Failed to delete task")
    }
  }

  const handleCreatePlayer = async (name: string, color: string) => {
    try {
      const result = await createPlayerAction(name, color)
      if (result.success && result.player) {
        setPlayers((prev) => [...prev, result.player])
        toast.success("Player created successfully")
      } else {
        toast.error(result.error || "Failed to create player")
      }
    } catch (error) {
      console.error("Error creating player:", error)
      toast.error("Failed to create player")
    }
  }

  const handleDeletePlayer = async (playerId: number) => {
    try {
      const result = await deletePlayerAction(playerId)
      if (result.success) {
        setPlayers((prev) => prev.filter((player) => player.id !== playerId))
        toast.success("Player deleted successfully")
      } else {
        toast.error(result.error || "Failed to delete player")
      }
    } catch (error) {
      console.error("Error deleting player:", error)
      toast.error("Failed to delete player")
    }
  }

  const handleAddComment = async (taskId: number, content: string, authorName: string) => {
    try {
      const result = await addTaskCommentAction(taskId, content, authorName)
      if (result.success && result.comment) {
        setTasks((prev) =>
          prev.map((task) =>
            task.id === taskId
              ? {
                  ...task,
                  comments: [result.comment, ...(task.comments || [])],
                }
              : task,
          ),
        )
        toast.success("Comment added successfully")
      } else {
        toast.error(result.error || "Failed to add comment")
      }
    } catch (error) {
      console.error("Error adding comment:", error)
      toast.error("Failed to add comment")
    }
  }

  const handleDeleteComment = async (commentId: number, taskId: number) => {
    try {
      const result = await deleteTaskCommentAction(commentId)
      if (result.success) {
        setTasks((prev) =>
          prev.map((task) =>
            task.id === taskId
              ? {
                  ...task,
                  comments: (task.comments || []).filter((comment) => comment.id !== commentId),
                }
              : task,
          ),
        )
        toast.success("Comment deleted successfully")
      } else {
        toast.error(result.error || "Failed to delete comment")
      }
    } catch (error) {
      console.error("Error deleting comment:", error)
      toast.error("Failed to delete comment")
    }
  }

  const handleTaskClick = useCallback(
    (task: TaskWithAssignees, event: React.MouseEvent) => {
      if (isConnecting) {
        event.preventDefault()
        event.stopPropagation()

        if (connectionStart && connectionStart.id !== task.id) {
          handleToggleLine(connectionStart.id, task.id)
          setConnectionStart(null)
          setIsConnecting(false)
        } else if (!connectionStart) {
          setConnectionStart(task)
        }
      } else {
        setSelectedTask(task)
        setIsDetailDialogOpen(true)
      }
    },
    [isConnecting, connectionStart],
  )

  const handleToggleLine = async (fromTaskId: number, toTaskId: number) => {
    try {
      const result = await toggleLineAction(fromTaskId, toTaskId)
      if (result.success) {
        if (result.action === "created" && result.line) {
          setLines((prev) => [...prev, result.line])
          toast.success("Connection created")
        } else if (result.action === "deleted") {
          setLines((prev) => prev.filter((line) => line.id !== result.lineId))
          toast.success("Connection removed")
        }
      } else {
        toast.error(result.error || "Failed to toggle connection")
      }
    } catch (error) {
      console.error("Error toggling line:", error)
      toast.error("Failed to toggle connection")
    }
  }

  const handleDeleteLine = async (lineId: number) => {
    try {
      const result = await deleteLineAction(lineId)
      if (result.success) {
        setLines((prev) => prev.filter((line) => line.id !== lineId))
        toast.success("Connection deleted")
      } else {
        toast.error(result.error || "Failed to delete connection")
      }
    } catch (error) {
      console.error("Error deleting line:", error)
      toast.error("Failed to delete connection")
    }
  }

  const renderTask = (task: TaskWithAssignees) => {
    const isConnectionSource = connectionStart?.id === task.id

    return (
      <Card
        key={task.id}
        className={`mb-3 cursor-pointer transition-all hover:shadow-md ${
          isConnectionSource ? "ring-2 ring-blue-500 bg-blue-50" : ""
        } ${isConnecting ? "hover:ring-2 hover:ring-green-500" : ""}`}
        onClick={(e) => handleTaskClick(task, e)}
      >
        <CardContent className="p-3">
          <div className="flex items-start justify-between mb-2">
            <p className="text-sm font-medium flex-1 mr-2">{task.description}</p>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={(e) => {
                  e.stopPropagation()
                  setEditingTask(task)
                  setIsTaskDialogOpen(true)
                }}
              >
                <Edit className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                onClick={(e) => {
                  e.stopPropagation()
                  handleDeleteTask(task.id)
                }}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
            <span>U: {task.urgency}%</span>
            <span>I: {task.importance}%</span>
          </div>

          {task.assignees && task.assignees.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {task.assignees.map((assignee) => (
                <Badge
                  key={assignee.id}
                  variant="secondary"
                  className="text-xs px-1 py-0"
                  style={{ backgroundColor: assignee.color + "20", color: assignee.color }}
                >
                  {assignee.name}
                </Badge>
              ))}
            </div>
          )}

          {task.comments && task.comments.length > 0 && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <MessageSquare className="h-3 w-3" />
              <span>{task.comments.length}</span>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Eisenhower Matrix</h1>
          <div className="flex gap-2">
            <Button
              variant={isConnecting ? "default" : "outline"}
              onClick={() => {
                setIsConnecting(!isConnecting)
                setConnectionStart(null)
              }}
            >
              {isConnecting ? "Cancel Connecting" : "Connect Tasks"}
            </Button>
            <Button onClick={() => setIsPlayerDialogOpen(true)}>
              <Users className="mr-2 h-4 w-4" />
              Manage Players
            </Button>
            <Button onClick={() => setIsTaskDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Task
            </Button>
          </div>
        </div>

        {isConnecting && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              {connectionStart
                ? `Click on another task to connect it with "${connectionStart.description}"`
                : "Click on a task to start connecting"}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6" ref={matrixRef}>
          {[1, 2, 3, 4].map((quadrant) => (
            <Card key={quadrant} className={`${getQuadrantColor(quadrant)} min-h-[400px]`}>
              <CardHeader>
                <CardTitle className="text-lg">{getQuadrantTitle(quadrant)}</CardTitle>
              </CardHeader>
              <CardContent>
                {getQuadrantTasks(quadrant).map(renderTask)}
                {getQuadrantTasks(quadrant).length === 0 && (
                  <p className="text-muted-foreground text-sm text-center py-8">No tasks in this quadrant</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <TaskDialogs
          isTaskDialogOpen={isTaskDialogOpen}
          setIsTaskDialogOpen={setIsTaskDialogOpen}
          isPlayerDialogOpen={isPlayerDialogOpen}
          setIsPlayerDialogOpen={setIsPlayerDialogOpen}
          players={players}
          editingTask={editingTask}
          setEditingTask={setEditingTask}
          onCreateTask={handleCreateTask}
          onUpdateTask={handleUpdateTask}
          onCreatePlayer={handleCreatePlayer}
          onDeletePlayer={handleDeletePlayer}
        />

        {selectedTask && (
          <TaskDetailDialog
            task={selectedTask}
            players={players}
            isOpen={isDetailDialogOpen}
            onOpenChange={setIsDetailDialogOpen}
            isMobile={false}
            onDeleteTask={handleDeleteTask}
            onUpdateTask={handleUpdateTask}
            onAddComment={handleAddComment}
            onDeleteComment={handleDeleteComment}
          />
        )}
      </div>
    </div>
  )
}

// Also export as default for compatibility
export default QuadrantMatrix
