'use client'

import React, { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Edit, Trash2, User } from 'lucide-react'
import { Task, Player } from '@/app/types'

interface TaskSegmentProps {
  task: Task
  players?: Player[]
  onUpdate?: (taskId: string, updates: Partial<Task>) => void
  onDelete?: (taskId: string) => void
  size?: number
}

export function TaskSegment({ task, players = [], onUpdate, onDelete, size = 64 }: TaskSegmentProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedTask, setEditedTask] = useState({
    description: task.description,
    urgency: task.urgency,
    importance: task.importance,
    assigneeIds: task.assignees?.map(a => a.id) || []
  })

  const handleSave = () => {
    if (onUpdate) {
      onUpdate(task.id, {
        description: editedTask.description,
        urgency: editedTask.urgency,
        importance: editedTask.importance
      })
    }
    setIsEditing(false)
  }

  const handleDelete = () => {
    if (onDelete && confirm('Are you sure you want to delete this task?')) {
      onDelete(task.id)
    }
  }

  const getUrgencyColor = (urgency: number) => {
    if (urgency >= 75) return 'bg-red-100 text-red-800'
    if (urgency >= 50) return 'bg-yellow-100 text-yellow-800'
    return 'bg-green-100 text-green-800'
  }

  const getImportanceColor = (importance: number) => {
    if (importance >= 75) return 'bg-purple-100 text-purple-800'
    if (importance >= 50) return 'bg-blue-100 text-blue-800'
    return 'bg-gray-100 text-gray-800'
  }

  return (
    <>
      <Card className="p-3 hover:shadow-md transition-shadow cursor-pointer group">
        <CardContent className="p-0">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 mb-2 line-clamp-2">
                {task.description}
              </p>
              
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary" className={`text-xs ${getUrgencyColor(task.urgency)}`}>
                  U: {task.urgency}%
                </Badge>
                <Badge variant="secondary" className={`text-xs ${getImportanceColor(task.importance)}`}>
                  I: {task.importance}%
                </Badge>
              </div>

              {task.assignees && task.assignees.length > 0 && (
                <div className="flex items-center gap-1 mb-2">
                  <User className="w-3 h-3 text-gray-400" />
                  <div className="flex gap-1">
                    {task.assignees.map((assignee) => (
                      <Badge
                        key={assignee.id}
                        variant="outline"
                        className="text-xs px-1 py-0"
                        style={{ borderColor: assignee.color, color: assignee.color }}
                      >
                        {assignee.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-xs text-gray-500">
                Created {task.created_at ? new Date(task.created_at).toLocaleDateString() : 'Unknown'}
              </p>
            </div>

            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => setIsEditing(true)}
              >
                <Edit className="w-3 h-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                onClick={handleDelete}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={editedTask.description}
                onChange={(e) => setEditedTask({ ...editedTask, description: e.target.value })}
                className="mt-1"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Urgency: {editedTask.urgency}%</label>
                <Input
                  type="range"
                  min="0"
                  max="100"
                  value={editedTask.urgency}
                  onChange={(e) => setEditedTask({ ...editedTask, urgency: parseInt(e.target.value) })}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Importance: {editedTask.importance}%</label>
                <Input
                  type="range"
                  min="0"
                  max="100"
                  value={editedTask.importance}
                  onChange={(e) => setEditedTask({ ...editedTask, importance: parseInt(e.target.value) })}
                  className="mt-1"
                />
              </div>
            </div>

            {players.length > 0 && (
              <div>
                <label className="text-sm font-medium">Assign to Players</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {players.map((player) => (
                    <Badge
                      key={player.id}
                      variant={editedTask.assigneeIds.includes(player.id) ? "default" : "outline"}
                      className="cursor-pointer"
                      style={editedTask.assigneeIds.includes(player.id) ? { backgroundColor: player.color } : {}}
                      onClick={() => {
                        const isSelected = editedTask.assigneeIds.includes(player.id)
                        setEditedTask({
                          ...editedTask,
                          assigneeIds: isSelected
                            ? editedTask.assigneeIds.filter(id => id !== player.id)
                            : [...editedTask.assigneeIds, player.id]
                        })
                      }}
                    >
                      {player.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default TaskSegment
