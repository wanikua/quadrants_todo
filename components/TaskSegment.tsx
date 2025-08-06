'use client'

import React, { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Edit2, Trash2, Check, X, User } from 'lucide-react'

interface Task {
  id: string
  projectId: string
  description: string
  urgency: number
  importance: number
  completed: boolean
  assignedTo: string | null
  createdAt: Date
  updatedAt: Date
}

interface Player {
  id: string
  projectId: string
  name: string
  color: string
  createdAt: Date
  updatedAt: Date
}

interface TaskSegmentProps {
  task: Task
  players: Player[]
  onUpdate: (taskId: string, updates: Partial<Task>) => void
  onDelete: (taskId: string) => void
  isEditing: boolean
  onStartEdit: () => void
  onStopEdit: () => void
}

export function TaskSegment({ 
  task, 
  players, 
  onUpdate, 
  onDelete, 
  isEditing, 
  onStartEdit, 
  onStopEdit 
}: TaskSegmentProps) {
  const [editDescription, setEditDescription] = useState(task.description)
  const [editUrgency, setEditUrgency] = useState([task.urgency])
  const [editImportance, setEditImportance] = useState([task.importance])

  const assignedPlayer = players.find(p => p.id === task.assignedTo)

  const handleSave = () => {
    onUpdate(task.id, {
      description: editDescription,
      urgency: editUrgency[0],
      importance: editImportance[0]
    })
    onStopEdit()
  }

  const handleCancel = () => {
    setEditDescription(task.description)
    setEditUrgency([task.urgency])
    setEditImportance([task.importance])
    onStopEdit()
  }

  const toggleComplete = () => {
    onUpdate(task.id, { completed: !task.completed })
  }

  const handleAssign = (playerId: string | null) => {
    onUpdate(task.id, { assignedTo: playerId })
  }

  if (isEditing) {
    return (
      <Card className="p-3 border-2 border-blue-200">
        <div className="space-y-3">
          <Textarea
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            className="min-h-[60px] text-sm"
          />
          
          <div className="space-y-2">
            <div>
              <label className="text-xs font-medium">Urgency: {editUrgency[0]}</label>
              <Slider
                value={editUrgency}
                onValueChange={setEditUrgency}
                max={100}
                step={1}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-xs font-medium">Importance: {editImportance[0]}</label>
              <Slider
                value={editImportance}
                onValueChange={setEditImportance}
                max={100}
                step={1}
                className="mt-1"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave} className="flex-1">
              <Check className="w-3 h-3 mr-1" />
              Save
            </Button>
            <Button size="sm" variant="outline" onClick={handleCancel}>
              <X className="w-3 h-3 mr-1" />
              Cancel
            </Button>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className={`p-3 transition-all hover:shadow-md ${task.completed ? 'opacity-60' : ''}`}>
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <p className={`text-sm flex-1 ${task.completed ? 'line-through' : ''}`}>
            {task.description}
          </p>
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0"
              onClick={onStartEdit}
            >
              <Edit2 className="w-3 h-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
              onClick={() => onDelete(task.id)}
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <Badge variant="outline" className="text-xs">
            U: {task.urgency}
          </Badge>
          <Badge variant="outline" className="text-xs">
            I: {task.importance}
          </Badge>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={task.completed ? "default" : "outline"}
              className="h-6 text-xs"
              onClick={toggleComplete}
            >
              {task.completed ? 'Completed' : 'Complete'}
            </Button>
          </div>

          <div className="flex items-center gap-2">
            {assignedPlayer && (
              <Badge
                variant="outline"
                style={{ 
                  backgroundColor: assignedPlayer.color + '20', 
                  borderColor: assignedPlayer.color 
                }}
                className="text-xs"
              >
                <div
                  className="w-2 h-2 rounded-full mr-1"
                  style={{ backgroundColor: assignedPlayer.color }}
                />
                {assignedPlayer.name}
              </Badge>
            )}
            
            <Select value={task.assignedTo || ''} onValueChange={handleAssign}>
              <SelectTrigger className="h-6 w-6 p-0 border-none">
                <User className="w-3 h-3" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Unassigned</SelectItem>
                {players.map(player => (
                  <SelectItem key={player.id} value={player.id}>
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
    </Card>
  )
}

export default TaskSegment
