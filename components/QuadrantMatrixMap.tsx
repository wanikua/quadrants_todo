"use client"

import React, { useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import TaskSegment from "@/components/TaskSegment"
import type { TaskWithAssignees, Player, Line } from "@/app/types"
import { updateTask, toggleLine, deleteLine } from "@/app/db/actions"
import { useRouter } from "next/navigation"

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
}: QuadrantMatrixMapProps) {
  const router = useRouter()
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null)
  const [isLongPress, setIsLongPress] = useState(false)
  const [draggedTask, setDraggedTask] = useState<TaskWithAssignees | null>(null)
  const [selectedTaskForLine, setSelectedTaskForLine] = useState<number | null>(null)
  const [showHelpDialog, setShowHelpDialog] = useState(false)
  const [mouseDownPos, setMouseDownPos] = useState<{ x: number; y: number } | null>(null)

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
    const result = await toggleLine(projectId, fromTaskId, toTaskId)
    if (result.success) {
      router.refresh()
    }
  }

  const handleDeleteLine = async (lineId: number) => {
    const result = await deleteLine(lineId)
    if (result.success) {
      router.refresh()
    }
  }

  const handleTaskDragStart = (task: TaskWithAssignees, e: React.DragEvent) => {
    if (isDrawingLine) {
      e.preventDefault()
      return
    }
    setDraggedTask(task)
    e.dataTransfer.effectAllowed = "move"
    e.dataTransfer.setData("text/plain", task.id.toString())
  }

  const handleTaskDragEnd = () => {
    setDraggedTask(null)
  }

  const handleMatrixDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
  }

  const handleMatrixDrop = async (e: React.DragEvent) => {
    e.preventDefault()

    if (!draggedTask) return

    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100

    const urgency = Math.max(0, Math.min(100, Math.round(x)))
    const importance = Math.max(0, Math.min(100, Math.round(100 - y)))

    const result = await updateTask(draggedTask.id, urgency, importance)
    if (result.success) {
      router.refresh()
    }
    setDraggedTask(null)
  }

  const handleMatrixMouseDown = (e: React.MouseEvent) => {
    if (isDrawingLine) return

    const target = e.target as HTMLElement
    if (target.closest('[data-task-id]')) return

    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100

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
    if (target.closest('[data-task-id]')) return

    const touch = e.touches[0]
    if (!touch) return

    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((touch.clientX - rect.left) / rect.width) * 100
    const y = ((touch.clientY - rect.top) / rect.height) * 100

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

  React.useEffect(() => {
    return () => {
      if (longPressTimer) {
        clearTimeout(longPressTimer)
      }
    }
  }, [longPressTimer])

  return (
    <Card className="p-2 sm:p-6">
      <CardHeader className="pb-2 sm:pb-4 px-2 sm:px-6">
        <CardTitle className="text-center text-lg sm:text-xl">Task Manager - Map View</CardTitle>
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
      <CardContent className="px-2 sm:px-6">
        <div
          className="relative w-full bg-card border-2 border-border rounded-lg overflow-hidden cursor-crosshair"
          style={{ height: isMobile ? "400px" : "700px", touchAction: "none" }}
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
          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
            <defs>
              <marker id="arrowhead-right" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="currentColor" className="text-foreground" />
              </marker>
              <marker id="arrowhead-up" markerWidth="10" markerHeight="7" refX="5" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="currentColor" className="text-foreground" />
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
                stroke="currentColor"
                className="text-muted"
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
                stroke="currentColor"
                className="text-muted"
                strokeWidth="1"
                strokeDasharray="5,5"
              />
            ))}

            {/* Horizontal axis (URGENCY) */}
            <line
              x1="3%"
              y1="50%"
              x2="95%"
              y2="50%"
              stroke="currentColor"
              className="text-foreground"
              strokeWidth="3"
              markerEnd="url(#arrowhead-right)"
            />

            {/* Vertical axis (IMPORTANCE) */}
            <line
              x1="50%"
              y1="95%"
              x2="50%"
              y2="7%"
              stroke="currentColor"
              className="text-foreground"
              strokeWidth="3"
              markerEnd="url(#arrowhead-up)"
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
                      ? "hover:ring-2 hover:ring-primary cursor-pointer"
                      : draggedTask?.id === task.id
                      ? "opacity-50 cursor-grabbing"
                      : "hover:ring-2 hover:ring-primary hover:scale-105 cursor-grab"
                  } ${isSelected ? "ring-2 ring-primary" : ""}`}
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
                    <TaskSegment task={task} size={taskSize} userName={userName} projectType={projectType} />

                    {/* Task Description Tooltip */}
                    {!isMobile && (
                      <div className="absolute left-full top-0 ml-2 bg-popover text-popover-foreground px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 border shadow-lg">
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
            <span className="text-xs sm:text-sm font-bold text-foreground">URGENCY →</span>
          </div>

          <div
            className="absolute top-0 left-0 right-0 h-6 sm:h-8 bg-muted border-b pointer-events-none"
            style={{ zIndex: 2 }}
          />

          <div
            className="absolute top-0 bottom-0 left-0 w-6 sm:w-8 flex flex-col items-center justify-center py-2 sm:py-4 bg-muted border-r pointer-events-none"
            style={{ zIndex: 2 }}
          >
            <span className="text-xs sm:text-sm font-bold text-foreground transform -rotate-90 whitespace-nowrap">
              IMPORTANCE ↑
            </span>
          </div>

          <div
            className="absolute top-0 bottom-0 right-0 w-6 sm:w-8 flex flex-col items-center justify-center py-2 sm:py-4 bg-muted border-l pointer-events-none"
            style={{ zIndex: 2 }}
          />
        </div>
      </CardContent>

      {/* Help Button */}
      <button
        className="fixed bottom-4 right-4 w-10 h-10 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full flex items-center justify-center transition-colors duration-200 shadow-lg hover:shadow-xl z-50"
        onClick={(e) => {
          e.stopPropagation()
          setShowHelpDialog(true)
        }}
        title="Help"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
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
              <p className="text-muted-foreground">Long press (0.8 seconds) on empty space, or use "Add Task" button</p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Move Task</h4>
              <p className="text-muted-foreground">Drag task to new position to change urgency/importance</p>
            </div>
            <div>
              <h4 className="font-medium mb-2">View/Edit Task</h4>
              <p className="text-muted-foreground">Click on task to view and edit details</p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Connect Tasks</h4>
              <p className="text-muted-foreground">Enable drawing mode, then click two tasks to create/delete connections</p>
            </div>
            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground">
                Task position represents (Urgency, Importance) coordinates on the matrix
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
})

export default QuadrantMatrixMap
