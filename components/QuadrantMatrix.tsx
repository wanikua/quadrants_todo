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
<<<<<<< HEAD
    <Card className="p-2 sm:p-6">
      <CardHeader className="pb-2 sm:pb-4 px-2 sm:px-6">
        <CardTitle className="text-center text-lg sm:text-xl">ItsNotAI Task Manager</CardTitle>
        {isDrawingLine && (
          <div className="text-center text-sm text-blue-600 dark:text-blue-400 bg-blue-500/10 p-2 rounded-lg">
            Click on tasks to connect them with lines
          </div>
        )}
        {isMobile && (
          <div className="text-center text-sm text-orange-600 dark:text-orange-400 bg-orange-500/10 p-2 rounded-lg border border-orange-500/20">
            For the full functionality, please use desktop
          </div>
        )}
      </CardHeader>
      <CardContent className="px-2 sm:px-6">
        <div
          className="relative w-full bg-card border-2 border-border rounded-lg overflow-hidden cursor-crosshair"
          style={{ height: isMobile ? "400px" : "700px", touchAction: "none" }}
          onMouseDown={handleMatrixMouseDown}
          onMouseUp={handleMatrixMouseUp}
          onMouseMove={handleMatrixMouseMove}
          onMouseLeave={handleMatrixMouseLeave}
          onTouchStart={isMobile ? undefined : handleMatrixTouchStart}
          onTouchMove={isMobile ? undefined : handleMatrixTouchMove}
          onTouchEnd={isMobile ? undefined : handleMatrixTouchEnd}
          onTouchCancel={isMobile ? undefined : handleMatrixTouchEnd}
          onDragOver={handleMatrixDragOver}
          onDrop={handleMatrixDrop}
        >
          {/* Grid Lines and Axes */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
            <defs>
              <marker id="arrowhead-right" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="#374151" />
              </marker>
              <marker id="arrowhead-up" markerWidth="10" markerHeight="7" refX="5" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="#374151" />
              </marker>
            </defs>
            
            {/* Vertical grid lines */}
            {[0, 25, 75, 100].map((x) => (
              <line
                key={`v-${x}`}
                x1={`${x}%`}
                y1="0%"
                x2={`${x}%`}
                y2="100%"
                stroke="#e5e7eb"
                strokeWidth="1"
                strokeDasharray="5,5"
              />
            ))}
            {/* Horizontal grid lines */}
            {[0, 25, 75, 100].map((y) => (
              <line
                key={`h-${y}`}
                x1="0%"
                y1={`${y}%`}
                x2="100%"
                y2={`${y}%`}
                stroke="#e5e7eb"
                strokeWidth="1"
                strokeDasharray="5,5"
              />
            ))}
            
            {/* Horizontal axis (URGENCY) - pointing right */}
            <line
              x1="3%"
              y1="50%"
              x2="95%"
              y2="50%"
              stroke="#374151"
              strokeWidth="3"
              markerEnd="url(#arrowhead-right)"
            />
            
            {/* Vertical axis (IMPORTANCE) - pointing up */}
            <line
              x1="50%"
              y1="95%"
              x2="50%"
              y2="7%"
              stroke="#374151"
              strokeWidth="3"
              markerEnd="url(#arrowhead-up)"
            />
          </svg>

          {/* Lines */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 2 }}>
            <defs>
              <marker id="arrowhead-filled" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="#374151" />
              </marker>
              <marker id="arrowhead-open" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="none" stroke="#60a5fa" strokeWidth="1" />
              </marker>
            </defs>

            {lines.map((line) => {
              const fromTask = tasks.find((t) => t.id === line.from_task_id)
              const toTask = tasks.find((t) => t.id === line.to_task_id)

              if (!fromTask || !toTask) return null

              const fromX = fromTask.urgency
              const fromY = 100 - fromTask.importance
              const toX = toTask.urgency
              const toY = 100 - toTask.importance

              const dx = toX - fromX
              const dy = toY - fromY
              const length = Math.sqrt(dx * dx + dy * dy)

              if (length === 0) return null

              const unitX = dx / length
              const unitY = dy / length

              const startX = fromX + unitX * 4
              const startY = fromY + unitY * 4
              const endX = toX - unitX * 4
              const endY = toY - unitY * 4

              return (
                <g key={line.id}>
                  <line
                    x1={`${startX}%`}
                    y1={`${startY}%`}
                    x2={`${endX}%`}
                    y2={`${endY}%`}
                    stroke="#60a5fa"
                    strokeWidth="2"
                    markerEnd={`url(#arrowhead-${line.style})`}
                    className="cursor-pointer hover:stroke-red-500 transition-all duration-200"
                    style={{ pointerEvents: "stroke" }}
                    onClick={(e) => {
                      e.stopPropagation()
                      if (confirm('Delete this line?')) {
                        onDeleteLine(line.id)
                      }
                    }}
                  />
                </g>
              )
            })}
          </svg>

          {/* Tasks */}
          <div className="absolute inset-0" style={{ zIndex: 3 }}>
            {tasks.map((task) => {
              const x = task.urgency
              const y = 100 - task.importance
              const isSelected = selectedTaskForLine === task.id
              const taskSize = isMobile ? 40 : 60
              const offset = taskSize / 2

              return (
                <div
                  key={task.id}
                  data-task-id={task.id}
                  className={`absolute group transition-all duration-200 ${
                    isDrawingLine
                      ? "hover:ring-2 hover:ring-blue-500 cursor-pointer"
                      : draggedTask?.id === task.id
                      ? "opacity-50 cursor-grabbing"
                      : "hover:ring-2 hover:ring-green-500 hover:scale-105 cursor-grab"
                  } ${isSelected ? "ring-2 ring-blue-500" : ""}`}
                  style={{
                    left: `calc(${x}% - ${offset}px)`,
                    top: `calc(${y}% - ${offset}px)`,
                    transform: "translate(0, 0)",
                  }}
                  draggable={!isDrawingLine && !isMobile}
                  onDragStart={(e) => handleTaskDragStart(task, e)}
                  onDragEnd={handleTaskDragEnd}
                  onClick={(e) => handleTaskClick(task, e)}
                >
                  <div className="relative">
                    <TaskSegment task={task} size={taskSize} />

                    {/* Task Description Tooltip - Hidden on mobile */}
                    {!isMobile && (
                      <div className="absolute left-full top-0 ml-2 bg-black text-white px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                        <div className="font-medium">{task.description}</div>
                        <div className="text-gray-400">
                          Urgency: {task.urgency} | Importance: {task.importance}
                        </div>
                        <div className="text-gray-400">{task.assignees.map((p) => p.name).join(", ")}</div>
                        <div className="text-gray-400 text-xs mt-1">
                          {isDrawingLine ? "Click to connect" : isMobile ? "Click for details" : "Click for details • Drag to move"}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Task Description Label */}
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 bg-card border border-border rounded px-2 py-1 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className={`text-xs font-medium text-center truncate ${isMobile ? "max-w-16" : "max-w-24"}`}>
                      {task.description}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Axis Labels */}
          <div
            className="absolute bottom-0 left-0 right-0 h-6 sm:h-8 flex items-center justify-center px-2 sm:px-4 bg-muted border-t pointer-events-none"
            style={{ zIndex: 2 }}
          >
            <span className="text-xs sm:text-sm font-bold text-foreground">IMPORTANCE</span>
          </div>


          {/* Top border */}
          <div
            className="absolute top-0 left-0 right-0 h-6 sm:h-8 bg-muted border-b pointer-events-none"
            style={{ zIndex: 2 }}
          ></div>

          {/* TOP PRIORITY Label */}
          <div className="absolute -top-4 sm:-top-6 -right-4 sm:-right-6" style={{ zIndex: 10 }}>
            
          </div>

          <div
            className="absolute top-0 bottom-0 left-0 w-6 sm:w-8 flex flex-col items-center justify-center py-2 sm:py-4 bg-muted border-r pointer-events-none"
            style={{ zIndex: 2 }}
          >
            <span className="text-xs sm:text-sm font-bold text-foreground transform -rotate-90 whitespace-nowrap"
              URGENCY
            </span>
          </div>

          <div
            className="absolute top-0 bottom-0 right-0 w-6 sm:w-8 flex flex-col items-center justify-center py-2 sm:py-4 bg-muted border-l pointer-events-none"
            style={{ zIndex: 2 }}
          ></div>

        </div>

      </CardContent>
      
      {/* Information Button - Fixed positioning to avoid event interference */}
      <button
        className="fixed bottom-4 right-4 w-8 h-8 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center transition-colors duration-200 shadow-md hover:shadow-lg"
        style={{ zIndex: 50 }}
        onClick={(e) => {
          e.stopPropagation()
          setShowHelpDialog(true)
        }}
        title="Usage Instructions"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
        </svg>
      </button>
      
      {/* Help Dialog */}
      <Dialog open={showHelpDialog} onOpenChange={setShowHelpDialog}>
        <DialogContent className="max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-medium">Usage Instructions</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">Create Task</h4>
              <p className="text-muted-foreground">Currently there is bug in long pressing for creating tasks, please use settings - add task</p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Move Task</h4>
              <p className="text-muted-foreground">Drag task to new position</p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Task Details</h4>
              <p className="text-muted-foreground">Click task to view and edit detailed information</p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Connect Tasks</h4>
              <p className="text-muted-foreground">Click "Add Dependency", then click two tasks to create/delete connections</p>
            </div>
            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground">
                Task position represents (Urgency, Importance) coordinates
              </p>
            </div>
=======
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
>>>>>>> ff6bcd1c287f152cbff654c035ffffce6ed3b1c2
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
