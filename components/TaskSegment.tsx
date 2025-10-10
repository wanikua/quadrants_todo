import React from "react"
import type { TaskWithAssignees } from "@/app/types"

interface TaskSegmentProps {
  task: TaskWithAssignees
  size?: number
}

const TaskSegment = React.memo(function TaskSegment({ task, size = 40 }: TaskSegmentProps) {
  const assignedPlayers = task.assignees || []

  // If no players assigned, show gray circle
  if (assignedPlayers.length === 0) {
    return (
      <div
        className="rounded-full flex items-center justify-center text-muted-foreground text-xs font-bold cursor-pointer hover:scale-110 transition-all duration-200 shadow-lg border-2 border-muted bg-muted"
        style={{
          width: size,
          height: size,
        }}
        title={`${task.description} - Unassigned`}
      >
        <span className="drop-shadow-sm">?</span>
      </div>
    )
  }

  // Single player - solid color circle
  if (assignedPlayers.length === 1) {
    return (
      <div
        className="rounded-full flex items-center justify-center text-white text-xs font-bold cursor-pointer hover:scale-110 transition-all duration-200 shadow-lg border-2 border-white"
        style={{
          backgroundColor: assignedPlayers[0].color,
          width: size,
          height: size,
        }}
        title={`${task.description} - ${assignedPlayers[0].name}`}
      >
        <span className="drop-shadow-sm">1</span>
      </div>
    )
  }

  // Multiple players - pie chart segments
  const segmentAngle = 360 / assignedPlayers.length

  return (
    <div
      className="relative rounded-full cursor-pointer hover:scale-110 transition-all duration-200 shadow-lg"
      style={{ width: size, height: size }}
      title={`${task.description} - ${assignedPlayers.map((p) => p.name).join(", ")}`}
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
      <div className="absolute inset-0 flex items-center justify-center text-white text-xs font-bold drop-shadow-sm">
        {assignedPlayers.length}
      </div>
    </div>
  )
})

export default TaskSegment
