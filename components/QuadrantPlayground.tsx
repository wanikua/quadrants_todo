"use client"

import { useState, useRef } from "react"

interface Task {
  id: number
  description: string
  urgency: number
  importance: number
  color: string
  assignee: string
}

const DEMO_TASKS: Task[] = [
  { id: 1, description: "Fix API bug", urgency: 90, importance: 85, color: "#ef4444", assignee: "Alice" },
  { id: 2, description: "Code review", urgency: 75, importance: 70, color: "#3b82f6", assignee: "Bob" },
  { id: 3, description: "Team meeting", urgency: 45, importance: 60, color: "#ef4444", assignee: "Alice" },
  { id: 4, description: "Update docs", urgency: 70, importance: 30, color: "#10b981", assignee: "Charlie" },
  { id: 5, description: "Buy groceries", urgency: 30, importance: 40, color: "#3b82f6", assignee: "Bob" },
]

export default function QuadrantPlayground() {
  const [tasks, setTasks] = useState<Task[]>(DEMO_TASKS)
  const [draggedTask, setDraggedTask] = useState<Task | null>(null)
  const [hoveredTask, setHoveredTask] = useState<Task | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleMouseDown = (task: Task) => {
    setDraggedTask(task)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggedTask || !containerRef.current) return

    const rect = containerRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // Convert pixel position to 0-100 scale
    const importance = Math.max(0, Math.min(100, (x / rect.width) * 100))
    const urgency = Math.max(0, Math.min(100, 100 - (y / rect.height) * 100))

    setTasks(prev =>
      prev.map(t =>
        t.id === draggedTask.id
          ? { ...t, urgency: Math.round(urgency), importance: Math.round(importance) }
          : t
      )
    )
  }

  const handleMouseUp = () => {
    setDraggedTask(null)
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-white border-3 border-black rounded-2xl overflow-hidden select-none"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Grid background */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 left-1/2 w-px h-full bg-black"></div>
        <div className="absolute top-1/2 left-0 w-full h-px bg-black"></div>
      </div>

      {/* Axis labels */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-white px-2 py-1 rounded-full border border-gray-300 flex items-center justify-center">
        <span className="text-[9px] font-bold text-gray-600 leading-none">IMPORTANCE</span>
      </div>
      <div className="absolute left-0.5 top-1/2 -translate-y-1/2 bg-white px-2 py-1 rounded-full border border-gray-300 -rotate-90 origin-center flex items-center justify-center">
        <span className="text-[9px] font-bold text-gray-600 leading-none">URGENCY</span>
      </div>

      {/* Tasks */}
      {tasks.map(task => {
        const x = (task.importance / 100) * 100
        const y = 100 - (task.urgency / 100) * 100
        const isHovered = hoveredTask?.id === task.id
        const isDragging = draggedTask?.id === task.id
        const isHighestPriority = task.urgency >= 70 && task.importance >= 70

        return (
          <div
            key={task.id}
            className="absolute cursor-grab active:cursor-grabbing transition-transform"
            style={{
              left: `${x}%`,
              top: `${y}%`,
              transform: `translate(-50%, -50%) scale(${isDragging ? 1.2 : isHovered ? 1.1 : 1})`,
              zIndex: isDragging ? 50 : isHovered ? 40 : 10,
            }}
            onMouseDown={() => handleMouseDown(task)}
            onMouseEnter={() => setHoveredTask(task)}
            onMouseLeave={() => setHoveredTask(null)}
          >
            <div
              className={`w-8 h-8 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white text-[10px] font-bold ${
                isHighestPriority ? 'animate-pulse shadow-[0_0_20px_rgba(234,179,8,0.6)]' : ''
              }`}
              style={{ backgroundColor: task.color }}
            >
              {task.assignee.charAt(0).toUpperCase()}
            </div>

            {/* Tooltip on hover */}
            {isHovered && (
              <div className="absolute top-10 left-1/2 -translate-x-1/2 bg-black text-white px-3 py-1.5 rounded-lg text-[10px] font-medium whitespace-nowrap shadow-lg z-50 pointer-events-none">
                <div className="font-bold">{task.description}</div>
                <div className="text-gray-300 text-[9px] mt-0.5">Assigned to: {task.assignee}</div>
                {isHighestPriority && (
                  <div className="text-yellow-400 text-[9px] mt-0.5 font-bold">Highest Priority</div>
                )}
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-black rotate-45"></div>
              </div>
            )}
          </div>
        )
      })}

      {/* Hint text */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none opacity-40">
        <p className="text-sm font-bold text-gray-600">Drag to move</p>
      </div>
    </div>
  )
}
