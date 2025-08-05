"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import TaskSegment from "@/components/TaskSegment"
import type { TaskWithAssignees, Player, Line } from "@/lib/database"

interface QuadrantMatrixProps {
  tasks: TaskWithAssignees[]
  players: Player[]
  lines: Line[]
  isMobile: boolean
  isDrawingLine: boolean
  selectedTaskForLine: number | null
  onTaskClick: (taskId: number) => void
  onDeleteLine: (lineId: number) => void
  onTaskDetailClick: (task: TaskWithAssignees) => void
  onLongPress: (urgency: number, importance: number) => void
  onTaskMove?: (taskId: number, urgency: number, importance: number) => void
}

const QuadrantMatrix = React.memo(function QuadrantMatrix({
  tasks,
  players,
  lines,
  isMobile,
  isDrawingLine,
  selectedTaskForLine,
  onTaskClick,
  onDeleteLine,
  onTaskDetailClick,
  onLongPress,
  onTaskMove,
}: QuadrantMatrixProps) {
  const [longPressTimer, setLongPressTimer] = React.useState<NodeJS.Timeout | null>(null)
  const [isLongPress, setIsLongPress] = React.useState(false)
  const [draggedTask, setDraggedTask] = React.useState<TaskWithAssignees | null>(null)
  const [dragOffset, setDragOffset] = React.useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [showHelpDialog, setShowHelpDialog] = React.useState(false)

  const handleTaskClick = (task: TaskWithAssignees, e: React.MouseEvent) => {
    e.stopPropagation()

    if (isDrawingLine) {
      onTaskClick(task.id)
    } else if (!draggedTask && !isLongPress) {
      onTaskDetailClick(task)
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
    setDragOffset({ x: 0, y: 0 })
  }

  const handleMatrixDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
  }

  const handleMatrixDrop = (e: React.DragEvent) => {
    e.preventDefault()
    
    if (!draggedTask || !onTaskMove) return

    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    
    const urgency = Math.max(0, Math.min(100, Math.round(x)))
    const importance = Math.max(0, Math.min(100, Math.round(100 - y))) // Invert Y axis
    
    onTaskMove(draggedTask.id, urgency, importance)
    setDraggedTask(null)
    setDragOffset({ x: 0, y: 0 })
  }

  const handleMatrixMouseDown = (e: React.MouseEvent) => {
    console.log('=== MOUSE DOWN EVENT ===')
    
    if (isMobile) {
      console.log('Skipping - mobile device detected')
      return
    }
    
    if (isDrawingLine) {
      console.log('Skipping - drawing line mode active')
      return
    }
    
    // Check if click is on empty space (not on tasks)
    const target = e.target as HTMLElement
    console.log('Mouse down target:', target.tagName, target.className)
    
    if (target.closest('[data-task-id]')) {
      console.log('Skipping long press - clicked on task')
      return
    }
    
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    
    const urgency = Math.max(0, Math.min(100, x))
    const importance = Math.max(0, Math.min(100, 100 - y))
    
    console.log('✅ Starting long press at:', { 
      urgency: Math.round(urgency), 
      importance: Math.round(importance), 
      target: target.tagName,
      onLongPress: typeof onLongPress
    })
    
    // Store initial mouse position for movement detection
    setMouseDownPos({ x: e.clientX, y: e.clientY })
    setIsLongPress(false)
    
    const timer = setTimeout(() => {
      console.log('🎯 LONG PRESS TRIGGERED! Calling onLongPress...')
      setIsLongPress(true)
      onLongPress(Math.round(urgency), Math.round(importance))
    }, 2000)
    
    setLongPressTimer(timer)
    console.log('Timer set with ID:', timer)
  }

  const handleMatrixMouseUp = (e: React.MouseEvent) => {
    console.log('=== MOUSE UP EVENT ===')
    if (longPressTimer) {
      console.log('❌ Long press CANCELLED - you released mouse too early! Need to hold for 2 seconds')
      clearTimeout(longPressTimer)
      setLongPressTimer(null)
    } else {
      console.log('ℹ️ Mouse up - no active timer')
    }
    setMouseDownPos(null)
    // Reset long press state after a short delay
    setTimeout(() => setIsLongPress(false), 100)
  }

  const [mouseDownPos, setMouseDownPos] = React.useState<{ x: number; y: number } | null>(null)

  const handleMatrixMouseMove = (e: React.MouseEvent) => {
    // Cancel long press only if mouse moves significantly from initial press position
    if (longPressTimer && mouseDownPos) {
      const deltaX = Math.abs(e.clientX - mouseDownPos.x)
      const deltaY = Math.abs(e.clientY - mouseDownPos.y)
      
      // Cancel if moved more than 15 pixels in any direction (increased threshold)
      if (deltaX > 15 || deltaY > 15) {
        console.log('❌ Canceling long press due to mouse movement:', { deltaX, deltaY })
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

  const [touchStartPos, setTouchStartPos] = React.useState<{ x: number; y: number } | null>(null)

  const handleMatrixTouchStart = (e: React.TouchEvent) => {
    // Disable touch task creation on mobile
    return
  }

  const handleMatrixTouchMove = (e: React.TouchEvent) => {
    // Disable touch task creation on mobile
    return
  }

  const handleMatrixTouchEnd = (e: React.TouchEvent) => {
    // Disable touch task creation on mobile
    return
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
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
})

export default QuadrantMatrix
