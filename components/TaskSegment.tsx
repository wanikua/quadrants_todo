'use client'

import React from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Edit, Trash2 } from 'lucide-react'

interface Task {
  id: string
  title: string
  description?: string
  quadrant: 'urgent-important' | 'not-urgent-important' | 'urgent-not-important' | 'not-urgent-not-important'
  priority: 'high' | 'medium' | 'low'
  completed: boolean
  createdAt: Date
  updatedAt: Date
}

interface TaskSegmentProps {
  task: Task
  onEdit: () => void
  onDelete: () => void
  onToggleComplete: (completed: boolean) => void
}

const PRIORITY_COLORS = {
  high: 'bg-red-100 text-red-800 border-red-200',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  low: 'bg-green-100 text-green-800 border-green-200'
}

export function TaskSegment({ task, onEdit, onDelete, onToggleComplete }: TaskSegmentProps) {
  return (
    <Card className={`p-3 transition-all hover:shadow-md ${task.completed ? 'opacity-60' : ''}`}>
      <div className="flex items-start gap-3">
        <Checkbox
          checked={task.completed}
          onCheckedChange={(checked) => onToggleComplete(!!checked)}
          className="mt-1"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <h4 className={`font-medium text-sm ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                {task.title}
              </h4>
              {task.description && (
                <p className={`text-xs text-muted-foreground mt-1 ${task.completed ? 'line-through' : ''}`}>
                  {task.description}
                </p>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Badge variant="outline" className={`text-xs ${PRIORITY_COLORS[task.priority]}`}>
                {task.priority}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={onEdit}
                className="h-6 w-6 p-0"
              >
                <Edit className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onDelete}
                className="h-6 w-6 p-0 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}

export default TaskSegment
