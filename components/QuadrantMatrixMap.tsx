"use client"
// Task visualization with Eisenhower Matrix
import React, { useState, useCallback, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
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
import type { TaskWithAssignees, Player, Line } from "@/app/types"
import { updateTask, toggleLine, deleteLine, deleteTask, completeTask } from "@/app/db/actions"
import { useRouter } from "next/navigation"
import { Trash2, Maximize2, Minimize2, CheckCircle2, Check, X, Sparkles, LayoutGrid } from "lucide-react"
import { toast } from "sonner"

interface QuadrantMatrixMapProps {
  tasks: TaskWithAssignees[]
  players: Player[]
  lines: Line[]
  projectId: string
  isMobile: boolean
  isDrawingLine: boolean
  onTaskDetailClick: (task: TaskWithAssignees) => void
  onToggleDrawingMode: () => void
  onLongPress: (urgency: number, importance: number) => void
  userName?: string
  projectType?: "personal" | "team"
  highestPriorityTaskId?: number | null
  setTasks?: (updater: (prev: TaskWithAssignees[]) => TaskWithAssignees[]) => void
  onOrganizeTasks?: () => void
  isOrganizing?: boolean
  originalTaskPositions?: Map<number, { urgency: number; importance: number }>
  onAcceptOrganize?: () => void
  onRevertOrganize?: () => void
  onDragStart?: () => void
  onDragEnd?: () => void
}

const QuadrantMatrixMap = React.memo(function QuadrantMatrixMap({
  tasks,
  players,
  lines,
  projectId,
  isMobile,
  isDrawingLine,
  onTaskDetailClick,
  onToggleDrawingMode,
  onLongPress,
  userName,
  projectType,
  highestPriorityTaskId,
  setTasks,
  onOrganizeTasks,
  isOrganizing,
  originalTaskPositions,
  onAcceptOrganize,
  onRevertOrganize,
  onDragStart,
  onDragEnd,
}: QuadrantMatrixMapProps) {
  const router = useRouter()
  const cardRef = useRef<HTMLDivElement>(null)
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null)
  const [isLongPress, setIsLongPress] = useState(false)
  const [draggedTask, setDraggedTask] = useState<TaskWithAssignees | null>(null)
  const [selectedTaskForLine, setSelectedTaskForLine] = useState<number | null>(null)
  const [showHelpDialog, setShowHelpDialog] = useState(false)
  const [mouseDownPos, setMouseDownPos] = useState<{ x: number; y: number } | null>(null)
  const [isOverTrash, setIsOverTrash] = useState(false)
  const [isOverComplete, setIsOverComplete] = useState(false)
  const [taskToDelete, setTaskToDelete] = useState<TaskWithAssignees | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const handleTaskClick = useCallback((task: TaskWithAssignees, e: React.MouseEvent) => {
    e.stopPropagation()

    if (isDrawingLine) {
      if (selectedTaskForLine === null) {
        setSelectedTaskForLine(task.id)
      } else if (selectedTaskForLine !== task.id) {
        handleToggleLine(selectedTaskForLine, task.id)
        setSelectedTaskForLine(null)
        onToggleDrawingMode()
      }
    } else if (!draggedTask && !isLongPress) {
      onTaskDetailClick(task)
    }
  }, [isDrawingLine, selectedTaskForLine, draggedTask, isLongPress, onTaskDetailClick, onToggleDrawingMode])

  const handleToggleLine = async (fromTaskId: number, toTaskId: number) => {
    await toggleLine(projectId, fromTaskId, toTaskId)
    // Rely on sync polling to update lines
  }

  const handleDeleteLine = async (lineId: number) => {
    await deleteLine(lineId)
    // Rely on sync polling to update lines
  }

  const handleTaskDragStart = (task: TaskWithAssignees, e: React.DragEvent) => {
    if (isDrawingLine) {
      e.preventDefault()
      return
    }
    onDragStart?.() // Pause sync during drag
    setDraggedTask(task)
    e.dataTransfer.effectAllowed = "move"
    e.dataTransfer.setData("text/plain", task.id.toString())
  }

  const handleTaskDragEnd = () => {
    setDraggedTask(null)
    onDragEnd?.() // Resume sync after drag
  }

  const handleMatrixDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
  }

  const handleMatrixDrop = async (e: React.DragEvent) => {
    e.preventDefault()

    if (!draggedTask) return

    const rect = e.currentTarget.getBoundingClientRect()
    const taskSize = isMobile ? 40 : 60
    const offset = taskSize / 2
    const marginX = offset + (isMobile ? 25 : 40)
    const marginY = offset + (isMobile ? 35 : 50)

    const effectiveWidth = rect.width - (marginX * 2)
    const effectiveHeight = rect.height - (marginY * 2)

    const x = ((e.clientX - rect.left - marginX) / effectiveWidth) * 100
    const y = ((e.clientY - rect.top - marginY) / effectiveHeight) * 100

    // Allow full range 0-100 for urgency and importance
    const urgency = Math.max(0, Math.min(100, Math.round(x)))
    const importance = Math.max(0, Math.min(100, Math.round(100 - y)))

    // Save old position for rollback
    const oldUrgency = draggedTask.urgency
    const oldImportance = draggedTask.importance

    // Optimistic update - update UI immediately
    if (setTasks) {
      setTasks(prev => prev.map(t =>
        t.id === draggedTask.id
          ? { ...t, urgency, importance }
          : t
      ))
    }

    setDraggedTask(null)

    // Sync to database in background
    const result = await updateTask(draggedTask.id, urgency, importance)
    if (!result.success) {
      // Rollback on failure
      if (setTasks) {
        setTasks(prev => prev.map(t =>
          t.id === draggedTask.id
            ? { ...t, urgency: oldUrgency, importance: oldImportance }
            : t
        ))
      }
      toast.error(result.error || "Failed to move task")
    }
    // Don't call router.refresh() - rely on optimistic update and sync polling

    // Small delay before resuming sync to ensure DB transaction is committed
    setTimeout(() => {
      onDragEnd?.() // Resume sync after drop
    }, 200)
  }

  const handleMatrixMouseDown = (e: React.MouseEvent) => {
    if (isDrawingLine) return

    const target = e.target as HTMLElement
    // Only ignore clicks on tasks
    if (target.closest('[data-task-id]')) {
      return
    }

    const rect = e.currentTarget.getBoundingClientRect()
    const taskSize = isMobile ? 40 : 60
    const offset = taskSize / 2
    const marginX = offset + (isMobile ? 25 : 40)
    const marginY = offset + (isMobile ? 35 : 50)

    const effectiveWidth = rect.width - (marginX * 2)
    const effectiveHeight = rect.height - (marginY * 2)

    const x = ((e.clientX - rect.left - marginX) / effectiveWidth) * 100
    const y = ((e.clientY - rect.top - marginY) / effectiveHeight) * 100

    // Allow full range 0-100 for urgency and importance
    const urgency = Math.max(0, Math.min(100, x))
    const importance = Math.max(0, Math.min(100, 100 - y))

    setMouseDownPos({ x: e.clientX, y: e.clientY })
    setIsLongPress(false)

    const timer = setTimeout(() => {
      setIsLongPress(true)
      onLongPress(Math.round(urgency), Math.round(importance))
    }, 800)

    setLongPressTimer(timer)
  }

  const handleMatrixMouseUp = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer)
      setLongPressTimer(null)
    }
    setMouseDownPos(null)
    setTimeout(() => setIsLongPress(false), 100)
  }

  const handleMatrixMouseMove = (e: React.MouseEvent) => {
    if (longPressTimer && mouseDownPos) {
      const deltaX = Math.abs(e.clientX - mouseDownPos.x)
      const deltaY = Math.abs(e.clientY - mouseDownPos.y)

      if (deltaX > 15 || deltaY > 15) {
        clearTimeout(longPressTimer)
        setLongPressTimer(null)
        setMouseDownPos(null)
      }
    }
  }

  const handleMatrixMouseLeave = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer)
      setLongPressTimer(null)
    }
    setMouseDownPos(null)
  }

  // Touch event handlers for mobile support
  const handleMatrixTouchStart = (e: React.TouchEvent) => {
    if (isDrawingLine) return

    const target = e.target as HTMLElement
    // Only ignore touches on tasks
    if (target.closest('[data-task-id]')) {
      return
    }

    // CRITICAL: Prevent default touch behavior to avoid interference
    e.preventDefault()

    const touch = e.touches[0]
    if (!touch) return

    const rect = e.currentTarget.getBoundingClientRect()
    const taskSize = isMobile ? 40 : 60
    const offset = taskSize / 2
    const marginX = offset + (isMobile ? 25 : 40)
    const marginY = offset + (isMobile ? 35 : 50)

    const effectiveWidth = rect.width - (marginX * 2)
    const effectiveHeight = rect.height - (marginY * 2)

    const x = ((touch.clientX - rect.left - marginX) / effectiveWidth) * 100
    const y = ((touch.clientY - rect.top - marginY) / effectiveHeight) * 100

    // Allow full range 0-100 for urgency and importance
    const urgency = Math.max(0, Math.min(100, x))
    const importance = Math.max(0, Math.min(100, 100 - y))

    setMouseDownPos({ x: touch.clientX, y: touch.clientY })
    setIsLongPress(false)

    const timer = setTimeout(() => {
      setIsLongPress(true)
      onLongPress(Math.round(urgency), Math.round(importance))
    }, 800)

    setLongPressTimer(timer)
  }

  const handleMatrixTouchEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer)
      setLongPressTimer(null)
    }
    setMouseDownPos(null)
    setTimeout(() => setIsLongPress(false), 100)
  }

  const handleMatrixTouchMove = (e: React.TouchEvent) => {
    if (longPressTimer && mouseDownPos) {
      // Prevent default to avoid scrolling/zooming during long press
      e.preventDefault()

      const touch = e.touches[0]
      if (!touch) return

      const deltaX = Math.abs(touch.clientX - mouseDownPos.x)
      const deltaY = Math.abs(touch.clientY - mouseDownPos.y)

      if (deltaX > 15 || deltaY > 15) {
        clearTimeout(longPressTimer)
        setLongPressTimer(null)
        setMouseDownPos(null)
      }
    }
  }

  const handleMatrixTouchCancel = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer)
      setLongPressTimer(null)
    }
    setMouseDownPos(null)
  }

  // Trash zone handlers
  const handleTrashDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsOverTrash(true)
  }

  const handleTrashDragLeave = () => {
    setIsOverTrash(false)
  }

  const handleTrashDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsOverTrash(false)

    if (!draggedTask) return

    // Show confirmation dialog instead of deleting directly
    setTaskToDelete(draggedTask)
    setShowDeleteConfirm(true)
    setDraggedTask(null)

    // Resume sync immediately for trash drop (no DB operation yet)
    onDragEnd?.()
  }

  const handleConfirmDelete = async () => {
    if (!taskToDelete) return

    // Optimistic update - remove task immediately
    if (setTasks) {
      setTasks(prev => prev.filter(t => t.id !== taskToDelete.id))
    }

    const result = await deleteTask(taskToDelete.id)
    if (!result.success) {
      // Rollback on failure - will be restored by next sync
      toast.error(result.error || "Failed to delete task")
    }
    // Rely on sync polling to update after delete

    setTaskToDelete(null)
    setShowDeleteConfirm(false)
  }

  const handleCancelDelete = () => {
    setTaskToDelete(null)
    setShowDeleteConfirm(false)
  }

  // Complete zone handlers
  const handleCompleteDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsOverComplete(true)
  }

  const handleCompleteDragLeave = () => {
    setIsOverComplete(false)
  }

  const handleCompleteDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsOverComplete(false)

    if (!draggedTask) return

    // Optimistic update - remove completed task immediately
    if (setTasks) {
      setTasks(prev => prev.filter(t => t.id !== draggedTask.id))
    }

    const taskId = draggedTask.id
    setDraggedTask(null)

    const result = await completeTask(taskId)
    if (!result.success) {
      toast.error(result.error || "Failed to complete task")
      // Rely on sync polling to restore task on failure
    }
    // Rely on sync polling to update after complete

    // Small delay before resuming sync to ensure DB transaction is committed
    setTimeout(() => {
      onDragEnd?.() // Resume sync after drop
    }, 200)
  }

  // Fullscreen handlers - Use CSS instead of Fullscreen API to avoid Dialog hiding
  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(!isFullscreen)
  }, [isFullscreen])

  React.useEffect(() => {
    return () => {
      if (longPressTimer) {
        clearTimeout(longPressTimer)
      }
    }
  }, [longPressTimer])

  // Listen for ESC key to exit fullscreen
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isFullscreen])

  return (
    <Card
      ref={cardRef}
      className={`transition-all duration-300 ${
        isFullscreen
          ? "fixed inset-0 w-screen h-screen rounded-none p-0 bg-background z-40"
          : "p-2 sm:p-6"
      }`}
    >
      {/* Exit Fullscreen Button - Higher z-index than Card but lower than Dialog */}
      {isFullscreen && (
        <button
          onClick={toggleFullscreen}
          className="fixed top-4 right-4 z-[60] flex items-center justify-center w-12 h-12 bg-background/95 hover:bg-muted border-2 border-border rounded-lg shadow-lg transition-all duration-200 hover:scale-110"
          title="Exit fullscreen (ESC)"
          style={{ pointerEvents: 'auto' }}
        >
          <Minimize2 className="w-6 h-6" />
        </button>
      )}

      {!isFullscreen && (
        <CardHeader className="pb-2 sm:pb-4 px-2 sm:px-6">
          {/* Organize Mode Banner */}
          {isOrganizing && onAcceptOrganize && onRevertOrganize && originalTaskPositions && (
            <div className="mb-4 p-4 bg-purple-50 dark:bg-purple-950 border-2 border-purple-300 dark:border-purple-700 rounded-lg">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-purple-900 dark:text-purple-100">Preview Mode</h3>
                  <p className="text-sm text-purple-700 dark:text-purple-300">
                    {(() => {
                      const movedCount = tasks.filter(task => {
                        const original = originalTaskPositions.get(task.id)
                        if (!original) return false
                        return original.urgency !== task.urgency || original.importance !== task.importance
                      }).length
                      return movedCount > 0
                        ? `${movedCount} task${movedCount > 1 ? 's' : ''} repositioned. Accept to save or Revert to cancel.`
                        : 'Review the organized layout. Accept to save or Revert to cancel.'
                    })()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button onClick={onRevertOrganize} variant="outline" size="sm">
                    <X className="w-4 h-4 mr-2" />
                    Revert
                  </Button>
                  <Button onClick={onAcceptOrganize} size="sm" className="bg-purple-600 hover:bg-purple-700 text-white">
                    <Check className="w-4 h-4 mr-2" />
                    Accept
                  </Button>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 mb-2">
            {onOrganizeTasks && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onOrganizeTasks()
                }}
                disabled={tasks.length === 0 || isOrganizing}
                className="flex items-center justify-center gap-1.5 px-3 h-8 rounded-full bg-purple-600 hover:bg-purple-700 text-white transition-all duration-300 hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 text-sm font-medium group"
                title="AI Organize tasks"
              >
                <LayoutGrid className="w-3.5 h-3.5 group-hover:scale-110 transition-transform duration-300" />
                Organize
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation()
                setShowHelpDialog(true)
              }}
              className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-muted transition-all duration-200 hover:scale-110"
              title="Help & Instructions"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
            </button>
            <button
              onClick={toggleFullscreen}
              className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-muted transition-all duration-200 hover:scale-110"
              title="Enter fullscreen"
            >
              <Maximize2 className="w-5 h-5" />
            </button>
          </div>
          {isDrawingLine && (
            <div className="text-center text-sm text-blue-600 dark:text-blue-400 bg-blue-500/10 p-2 rounded-lg">
              {selectedTaskForLine === null
                ? "Click on a task to start connecting"
                : "Click on another task to complete the connection"}
            </div>
          )}
          {isMobile && (
            <div className="text-center text-sm text-blue-600 dark:text-blue-400 bg-blue-500/10 p-2 rounded-lg border border-blue-500/20">
              Long press (0.8s) on empty space to create a task
            </div>
          )}
        </CardHeader>
      )}
      <CardContent className={`${isFullscreen ? "h-screen p-0 relative" : "px-2 sm:px-6"}`}>
        <div
          className={`relative w-full bg-gradient-to-br from-background to-muted/20 overflow-hidden cursor-crosshair ${
            isFullscreen ? "h-screen border-0 rounded-none" : "border-2 border-border rounded-xl shadow-inner"
          }`}
          style={{
            height: isFullscreen ? "100vh" : (isMobile ? "400px" : "700px"),
            // Remove touchAction: "none" to allow proper event handling
            // We handle preventDefault() in event handlers instead
          }}
          onMouseDown={handleMatrixMouseDown}
          onMouseUp={handleMatrixMouseUp}
          onMouseMove={handleMatrixMouseMove}
          onMouseLeave={handleMatrixMouseLeave}
          onTouchStart={handleMatrixTouchStart}
          onTouchEnd={handleMatrixTouchEnd}
          onTouchMove={handleMatrixTouchMove}
          onTouchCancel={handleMatrixTouchCancel}
          onDragOver={handleMatrixDragOver}
          onDrop={handleMatrixDrop}
        >

          {/* Grid Lines and Axes */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 1000 1000" preserveAspectRatio="none" style={{ zIndex: 1 }}>
            {/* Subtle grid lines at quadrant boundaries */}
            {[250, 750].map((x) => (
              <line
                key={`v-${x}`}
                x1={x}
                y1="0"
                x2={x}
                y2="1000"
                stroke="currentColor"
                className="text-muted/30"
                strokeWidth="2"
                strokeDasharray="20,20"
                vectorEffect="non-scaling-stroke"
              />
            ))}
            {[250, 750].map((y) => (
              <line
                key={`h-${y}`}
                x1="0"
                y1={y}
                x2="1000"
                y2={y}
                stroke="currentColor"
                className="text-muted/30"
                strokeWidth="2"
                vectorEffect="non-scaling-stroke"
                strokeDasharray="20,20"
              />
            ))}

            {/* Main axes - perfectly centered */}
            {/* Horizontal axis (URGENCY) - left to right */}
            <line
              x1="0"
              y1="500"
              x2="985"
              y2="500"
              stroke="currentColor"
              className="text-foreground"
              strokeWidth="3"
              vectorEffect="non-scaling-stroke"
            />
            {/* Right arrow for horizontal axis - clean triangle */}
            <polygon
              points="985,490 1000,500 985,510"
              fill="currentColor"
              className="text-foreground"
            />

            {/* Vertical axis (IMPORTANCE) - bottom to top */}
            <line
              x1="500"
              y1="1000"
              x2="500"
              y2="15"
              stroke="currentColor"
              className="text-foreground"
              strokeWidth="3"
              vectorEffect="non-scaling-stroke"
            />
            {/* Up arrow for vertical axis - clean triangle */}
            <polygon
              points="490,15 500,0 510,15"
              fill="currentColor"
              className="text-foreground"
            />

            {/* Origin point indicator */}
            <circle
              cx="500"
              cy="500"
              r="6"
              fill="currentColor"
              className="text-foreground"
            />
          </svg>

          {/* Lines */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 2 }}>
            <defs>
              <marker id="arrowhead-filled" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="currentColor" className="text-primary" />
              </marker>
            </defs>

            {lines.map((line) => {
              const fromTask = tasks.find((t) => String(t.id) === String(line.from_task_id))
              const toTask = tasks.find((t) => String(t.id) === String(line.to_task_id))

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
                    stroke="currentColor"
                    className="text-primary cursor-pointer hover:text-destructive transition-all duration-200"
                    strokeWidth="2"
                    markerEnd="url(#arrowhead-filled)"
                    style={{ pointerEvents: "stroke" }}
                    onClick={(e) => {
                      e.stopPropagation()
                      if (confirm('Delete this connection?')) {
                        handleDeleteLine(line.id)
                      }
                    }}
                  />
                </g>
              )
            })}
          </svg>

          {/* Tasks - positioned within safe area to prevent edge clipping */}
          <div className="absolute inset-0" style={{ zIndex: 15 }}>
            {tasks.map((task) => {
              const x = task.urgency
              const y = 100 - task.importance
              const isSelected = selectedTaskForLine === task.id
              const taskSize = isMobile ? 40 : 60
              const offset = taskSize / 2
              // Add larger margin to prevent clipping and ensure draggability in corners
              const marginX = offset + (isMobile ? 25 : 40)
              const marginY = offset + (isMobile ? 35 : 50) // Extra margin at bottom for action zones

              return (
                <div
                  key={task.id}
                  data-task-id={task.id}
                  className={`absolute group transition-all duration-200 ${
                    isDrawingLine
                      ? "hover:ring-2 hover:ring-primary cursor-pointer"
                      : draggedTask?.id === task.id
                      ? "opacity-50 cursor-grabbing"
                      : "hover:ring-2 hover:ring-primary hover:scale-105 cursor-grab"
                  } ${isSelected ? "ring-2 ring-primary" : ""}`}
                  style={{
                    left: `calc(${marginX}px + (100% - ${marginX * 2}px) * ${x / 100} - ${offset}px)`,
                    top: `calc(${marginY}px + (100% - ${marginY * 2}px) * ${y / 100} - ${offset}px)`,
                    transform: "translate(0, 0)",
                  }}
                  draggable={!isDrawingLine && !isMobile}
                  onDragStart={(e) => handleTaskDragStart(task, e)}
                  onDragEnd={handleTaskDragEnd}
                  onClick={(e) => handleTaskClick(task, e)}
                >
                  <div className="relative">
                    <TaskSegment
                      task={task}
                      size={taskSize}
                      userName={userName}
                      projectType={projectType}
                      isHighestPriority={task.id === highestPriorityTaskId}
                    />

                    {/* Task Description Tooltip - switches side based on position */}
                    {!isMobile && (
                      <div className={`absolute top-0 bg-popover text-popover-foreground px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 border shadow-lg ${
                        task.urgency > 70 ? "right-full mr-2" : "left-full ml-2"
                      }`}>
                        <div className="font-medium">{task.description}</div>
                        {task.assignees && task.assignees.length > 0 && (
                          <div className="text-muted-foreground">{task.assignees.map((p) => p.name).join(", ")}</div>
                        )}
                        <div className="text-muted-foreground text-xs mt-1">
                          {isDrawingLine ? "Click to connect" : "Click for details • Drag to move"}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Task Description Label - adjusts position for edges */}
                  <div className={`absolute top-full mt-1 bg-card border border-border rounded px-2 py-1 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity ${
                    task.urgency > 70
                      ? "right-0"
                      : task.urgency < 30
                      ? "left-0"
                      : "left-1/2 transform -translate-x-1/2"
                  }`}>
                    <div className={`text-xs font-medium text-center truncate ${isMobile ? "max-w-16" : "max-w-24"}`}>
                      {task.description}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Action Zones - Only visible when dragging a task */}
          {draggedTask && (
            <>
              {/* Complete Zone - Left bottom corner */}
              <div
                className={`absolute bottom-4 left-4 w-16 h-16 sm:w-20 sm:h-20 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1 transition-all duration-300 shadow-lg backdrop-blur-sm ${
                  isOverComplete
                    ? "bg-green-500 border-green-600 scale-110 shadow-green-500/50"
                    : "bg-green-50/90 border-green-300 hover:bg-green-100/90 hover:scale-105"
                }`}
                style={{ zIndex: 20, pointerEvents: "auto" }}
                onDragOver={handleCompleteDragOver}
                onDragLeave={handleCompleteDragLeave}
                onDrop={handleCompleteDrop}
              >
                <CheckCircle2 className={`w-6 h-6 sm:w-8 sm:h-8 transition-all ${isOverComplete ? "text-white animate-bounce" : "text-green-500"}`} />
                <span className={`text-xs font-bold ${isOverComplete ? "text-white" : "text-green-500"}`}>
                  Done
                </span>
              </div>

              {/* Trash Zone - Right bottom corner */}
              <div
                className={`absolute bottom-4 right-4 w-16 h-16 sm:w-20 sm:h-20 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1 transition-all duration-300 shadow-lg backdrop-blur-sm ${
                  isOverTrash
                    ? "bg-red-500 border-red-600 scale-110 shadow-red-500/50"
                    : "bg-red-50/90 border-red-300 hover:bg-red-100/90 hover:scale-105"
                }`}
                style={{ zIndex: 20, pointerEvents: "auto" }}
                onDragOver={handleTrashDragOver}
                onDragLeave={handleTrashDragLeave}
                onDrop={handleTrashDrop}
              >
                <Trash2 className={`w-6 h-6 sm:w-8 sm:h-8 transition-all ${isOverTrash ? "text-white animate-bounce" : "text-red-500"}`} />
                <span className={`text-xs font-bold ${isOverTrash ? "text-white" : "text-red-500"}`}>
                  Delete
                </span>
              </div>
            </>
          )}

          {/* Axis Labels - positioned correctly */}
          {/* Bottom center - IMPORTANCE label for horizontal axis */}
          <div
            className="absolute bottom-3 left-1/2 transform -translate-x-1/2 pointer-events-none"
            style={{ zIndex: 4 }}
          >
            <div className="bg-background/95 backdrop-blur-sm px-4 py-1.5 rounded-full border border-border shadow-sm">
              <span className="text-xs sm:text-sm font-semibold text-foreground tracking-wide">IMPORTANCE</span>
            </div>
          </div>

          {/* Left center - URGENCY label for vertical axis (horizontal text) */}
          <div
            className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none"
            style={{ zIndex: 4 }}
          >
            <div className="bg-background/95 backdrop-blur-sm px-4 py-1.5 rounded-full border border-border shadow-sm">
              <span className="text-xs sm:text-sm font-semibold text-foreground tracking-wide whitespace-nowrap">URGENCY</span>
            </div>
          </div>
        </div>
      </CardContent>

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
              <h4 className="font-medium mb-1">Connect Tasks</h4>
              <p className="text-muted-foreground">Enable drawing mode to visualize dependencies</p>
            </div>
            <div>
              <h4 className="font-medium mb-1">Priority Highlight</h4>
              <p className="text-muted-foreground">Highest priority task is auto-highlighted</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Delete Task?</AlertDialogTitle>
            <AlertDialogDescription>
              {taskToDelete && (
                <>
                  Are you sure you want to delete task <strong>&quot;{taskToDelete.description}&quot;</strong>? This action cannot be undone.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelDelete}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
})

export default QuadrantMatrixMap
