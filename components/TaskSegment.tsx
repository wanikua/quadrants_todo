import React from "react"
import type { TaskWithAssignees } from "@/app/types"
import { Sparkles } from "lucide-react"

interface TaskSegmentProps {
  task: TaskWithAssignees
  size?: number
  userName?: string
  projectType?: "personal" | "team"
  isHighestPriority?: boolean
  hasMoved?: boolean
}

const TaskSegment = React.memo(function TaskSegment({ task, size = 40, userName, projectType, isHighestPriority = false, hasMoved = false }: TaskSegmentProps) {
  // Filter out auto-generated user names (e.g., "User c0eea5c2")
  const assignedPlayers = (task.assignees || []).filter(player => !player.name.startsWith('User '))

  // Helper function to get first letter uppercase
  const getInitial = (name: string) => {
    return name.charAt(0).toUpperCase()
  }

  // Personal project - always show empty circle without initials
  if (projectType === "personal") {
    return (
      <div className="relative" style={{ width: size, height: size }}>
        {isHighestPriority && (
          <div
            className="absolute rounded-full border-4 border-yellow-400 animate-pulse"
            style={{
              width: size + 8,
              height: size + 8,
              top: -4,
              left: -4,
            }}
          />
        )}
        {hasMoved && (
          <div
            className="absolute -top-1 -right-1 bg-purple-600 rounded-full p-0.5 shadow-lg animate-pulse"
            title="Task repositioned"
          >
            <Sparkles className="w-3 h-3 text-white" />
          </div>
        )}
        <div
          className="rounded-full flex items-center justify-center text-muted-foreground text-xs font-bold cursor-pointer hover:scale-110 transition-all duration-200 shadow-lg border-2 border-primary bg-primary/10 relative"
          style={{
            width: size,
            height: size,
          }}
          title={`${task.description} - Personal Task${isHighestPriority ? ' (Highest Priority)' : ''}${hasMoved ? ' (Repositioned)' : ''}`}
        >
          {/* Empty circle for personal project tasks */}
        </div>
      </div>
    )
  }

  // Team project with no assignees (or only auto-generated users) - show empty circle
  if (assignedPlayers.length === 0) {
    return (
      <div className="relative" style={{ width: size, height: size }}>
        {isHighestPriority && (
          <div
            className="absolute rounded-full border-4 border-yellow-400 animate-pulse"
            style={{
              width: size + 8,
              height: size + 8,
              top: -4,
              left: -4,
            }}
          />
        )}
        {hasMoved && (
          <div
            className="absolute -top-1 -right-1 bg-purple-600 rounded-full p-0.5 shadow-lg animate-pulse"
            title="Task repositioned"
          >
            <Sparkles className="w-3 h-3 text-white" />
          </div>
        )}
        <div
          className="rounded-full flex items-center justify-center text-muted-foreground text-xs font-bold cursor-pointer hover:scale-110 transition-all duration-200 shadow-lg border-2 border-gray-300 bg-gray-100 relative"
          style={{
            width: size,
            height: size,
          }}
          title={`${task.description} - Unassigned${isHighestPriority ? ' (Highest Priority)' : ''}${hasMoved ? ' (Repositioned)' : ''}`}
        >
          {/* Empty circle for unassigned team tasks */}
        </div>
      </div>
    )
  }

  // Team task - single player, show player's initial
  if (assignedPlayers.length === 1) {
    const initial = getInitial(assignedPlayers[0].name)
    return (
      <div className="relative" style={{ width: size, height: size }}>
        {isHighestPriority && (
          <div
            className="absolute rounded-full border-4 border-yellow-400 animate-pulse"
            style={{
              width: size + 8,
              height: size + 8,
              top: -4,
              left: -4,
            }}
          />
        )}
        {hasMoved && (
          <div
            className="absolute -top-1 -right-1 bg-purple-600 rounded-full p-0.5 shadow-lg animate-pulse z-10"
            title="Task repositioned"
          >
            <Sparkles className="w-3 h-3 text-white" />
          </div>
        )}
        <div
          className="rounded-full flex items-center justify-center text-white font-bold cursor-pointer hover:scale-110 transition-all duration-200 shadow-lg border-2 border-white relative"
          style={{
            backgroundColor: assignedPlayers[0].color,
            width: size,
            height: size,
            fontSize: size * 0.4, // Scale font size with circle size
          }}
          title={`${task.description} - ${assignedPlayers[0].name}${isHighestPriority ? ' (Highest Priority)' : ''}${hasMoved ? ' (Repositioned)' : ''}`}
        >
          <span className="drop-shadow-sm">{initial}</span>
        </div>
      </div>
    )
  }

  // Team task - multiple players, show pie chart with initials
  const segmentAngle = 360 / assignedPlayers.length

  return (
    <div className="relative" style={{ width: size, height: size }}>
      {isHighestPriority && (
        <div
          className="absolute rounded-full border-4 border-yellow-400 animate-pulse"
          style={{
            width: size + 8,
            height: size + 8,
            top: -4,
            left: -4,
          }}
        />
      )}
      {hasMoved && (
        <div
          className="absolute -top-1 -right-1 bg-purple-600 rounded-full p-0.5 shadow-lg animate-pulse z-10"
          title="Task repositioned"
        >
          <Sparkles className="w-3 h-3 text-white" />
        </div>
      )}
      <div
        className="relative rounded-full cursor-pointer hover:scale-110 transition-all duration-200 shadow-lg"
        style={{ width: size, height: size }}
        title={`${task.description} - ${assignedPlayers.map((p) => p.name).join(", ")}${isHighestPriority ? ' (Highest Priority)' : ''}${hasMoved ? ' (Repositioned)' : ''}`}
      >
        <svg width={size} height={size} className="absolute inset-0">
        <circle cx={size / 2} cy={size / 2} r={size / 2 - 1} fill="white" stroke="#e5e7eb" strokeWidth="2" />
        {assignedPlayers.map((player, index) => {
          const startAngle = index * segmentAngle - 90
          const endAngle = (index + 1) * segmentAngle - 90
          const startRad = (startAngle * Math.PI) / 180
          const endRad = (endAngle * Math.PI) / 180
          const radius = size / 2 - 2
          const centerX = size / 2
          const centerY = size / 2

          const x1 = centerX + radius * Math.cos(startRad)
          const y1 = centerY + radius * Math.sin(startRad)
          const x2 = centerX + radius * Math.cos(endRad)
          const y2 = centerY + radius * Math.sin(endRad)

          const largeArcFlag = segmentAngle > 180 ? 1 : 0

          const pathData = [
            `M ${centerX} ${centerY}`,
            `L ${x1} ${y1}`,
            `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
            "Z",
          ].join(" ")

          return <path key={player.id} d={pathData} fill={player.color} stroke="white" strokeWidth="1" />
        })}
      </svg>
      <div
        className="absolute inset-0 flex items-center justify-center text-white font-bold drop-shadow-sm"
        style={{ fontSize: size * 0.3 }}
      >
        {assignedPlayers.map((p) => getInitial(p.name)).join("")}
      </div>
      </div>
    </div>
  )
})

export default TaskSegment
