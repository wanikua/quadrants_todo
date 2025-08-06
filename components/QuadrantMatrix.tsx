'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Trash2, Edit, Plus, HelpCircle, User } from 'lucide-react'
import { TaskSegment } from './TaskSegment'
import { shouldUseClerk } from '@/lib/env'
import { useUser } from '@clerk/nextjs'

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

interface QuadrantMatrixProps {
  projectId?: string
  tasks?: Task[]
  onTaskCreate?: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void
  onTaskUpdate?: (id: string, updates: Partial<Task>) => void
  onTaskDelete?: (id: string) => void
}

const QUADRANTS = {
  'urgent-important': {
    title: 'Urgent & Important',
    subtitle: 'Do First',
    color: 'bg-red-50 border-red-200',
    headerColor: 'bg-red-100',
    textColor: 'text-red-800'
  },
  'not-urgent-important': {
    title: 'Not Urgent & Important',
    subtitle: 'Schedule',
    color: 'bg-blue-50 border-blue-200',
    headerColor: 'bg-blue-100',
    textColor: 'text-blue-800'
  },
  'urgent-not-important': {
    title: 'Urgent & Not Important',
    subtitle: 'Delegate',
    color: 'bg-yellow-50 border-yellow-200',
    headerColor: 'bg-yellow-100',
    textColor: 'text-yellow-800'
  },
  'not-urgent-not-important': {
    title: 'Not Urgent & Not Important',
    subtitle: 'Eliminate',
    color: 'bg-gray-50 border-gray-200',
    headerColor: 'bg-gray-100',
    textColor: 'text-gray-800'
  }
} as const

export function QuadrantMatrix({ 
  projectId, 
  tasks = [], 
  onTaskCreate, 
  onTaskUpdate, 
  onTaskDelete 
}: QuadrantMatrixProps) {
  const { user } = shouldUseClerk() ? useUser() : { user: null }
  const [localTasks, setLocalTasks] = useState<Task[]>(tasks)
  const [isAddingTask, setIsAddingTask] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [showHelpDialog, setShowHelpDialog] = useState(false)
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    quadrant: 'urgent-important' as Task['quadrant'],
    priority: 'medium' as Task['priority']
  })

  useEffect(() => {
    setLocalTasks(tasks)
  }, [tasks])

  const tasksByQuadrant = useMemo(() => {
    return localTasks.reduce((acc, task) => {
      if (!acc[task.quadrant]) {
        acc[task.quadrant] = []
      }
      acc[task.quadrant].push(task)
      return acc
    }, {} as Record<Task['quadrant'], Task[]>)
  }, [localTasks])

  const handleCreateTask = useCallback(() => {
    if (!newTask.title.trim()) return

    const task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'> = {
      title: newTask.title,
      description: newTask.description,
      quadrant: newTask.quadrant,
      priority: newTask.priority,
      completed: false
    }

    if (onTaskCreate) {
      onTaskCreate(task)
    } else {
      // Local state management
      const fullTask: Task = {
        ...task,
        id: Date.now().toString(),
        createdAt: new Date(),
        updatedAt: new Date()
      }
      setLocalTasks(prev => [...prev, fullTask])
    }

    setNewTask({
      title: '',
      description: '',
      quadrant: 'urgent-important',
      priority: 'medium'
    })
    setIsAddingTask(false)
  }, [newTask, onTaskCreate])

  const handleUpdateTask = useCallback((id: string, updates: Partial<Task>) => {
    if (onTaskUpdate) {
      onTaskUpdate(id, updates)
    } else {
      setLocalTasks(prev => prev.map(task => 
        task.id === id 
          ? { ...task, ...updates, updatedAt: new Date() }
          : task
      ))
    }
    setEditingTask(null)
  }, [onTaskUpdate])

  const handleDeleteTask = useCallback((id: string) => {
    if (onTaskDelete) {
      onTaskDelete(id)
    } else {
      setLocalTasks(prev => prev.filter(task => task.id !== id))
    }
  }, [onTaskDelete])

  const handleTaskComplete = useCallback((id: string, completed: boolean) => {
    handleUpdateTask(id, { completed })
  }, [handleUpdateTask])

  return (
    <div className="w-full max-w-7xl mx-auto p-4">
      <Card className="mb-6">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold">Eisenhower Matrix</CardTitle>
              <p className="text-muted-foreground mt-1">
                Organize your tasks by urgency and importance
              </p>
            </div>
            <div className="flex items-center gap-2">
              {user && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span>{user.firstName || user.emailAddresses[0]?.emailAddress}</span>
                </div>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowHelpDialog(true)}
              >
                <HelpCircle className="h-4 w-4 mr-2" />
                Help
              </Button>
              <Button onClick={() => setIsAddingTask(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Task
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Object.entries(QUADRANTS).map(([quadrantKey, quadrant]) => {
          const quadrantTasks = tasksByQuadrant[quadrantKey as Task['quadrant']] || []
          
          return (
            <Card key={quadrantKey} className={`${quadrant.color} border-2`}>
              <CardHeader className={`${quadrant.headerColor} rounded-t-lg`}>
                <CardTitle className={`${quadrant.textColor} text-lg font-semibold`}>
                  {quadrant.title}
                </CardTitle>
                <p className={`${quadrant.textColor} text-sm opacity-80`}>
                  {quadrant.subtitle}
                </p>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-3 min-h-[200px]">
                  {quadrantTasks.map((task) => (
                    <TaskSegment
                      key={task.id}
                      task={task}
                      onEdit={() => setEditingTask(task)}
                      onDelete={() => handleDeleteTask(task.id)}
                      onToggleComplete={(completed) => handleTaskComplete(task.id, completed)}
                    />
                  ))}
                  {quadrantTasks.length === 0 && (
                    <div className="text-center text-muted-foreground py-8">
                      <p>No tasks in this quadrant</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-2"
                        onClick={() => {
                          setNewTask(prev => ({ ...prev, quadrant: quadrantKey as Task['quadrant'] }))
                          setIsAddingTask(true)
                        }}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add task here
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Add Task Dialog */}
      <Dialog open={isAddingTask} onOpenChange={setIsAddingTask}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={newTask.title}
                onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter task title"
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newTask.description}
                onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter task description (optional)"
              />
            </div>
            <div>
              <Label htmlFor="quadrant">Quadrant</Label>
              <Select
                value={newTask.quadrant}
                onValueChange={(value) => setNewTask(prev => ({ ...prev, quadrant: value as Task['quadrant'] }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(QUADRANTS).map(([key, quadrant]) => (
                    <SelectItem key={key} value={key}>
                      {quadrant.title} - {quadrant.subtitle}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={newTask.priority}
                onValueChange={(value) => setNewTask(prev => ({ ...prev, priority: value as Task['priority'] }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsAddingTask(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateTask}>
                Create Task
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Task Dialog */}
      <Dialog open={!!editingTask} onOpenChange={() => setEditingTask(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
          </DialogHeader>
          {editingTask && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-title">Title</Label>
                <Input
                  id="edit-title"
                  value={editingTask.title}
                  onChange={(e) => setEditingTask(prev => prev ? { ...prev, title: e.target.value } : null)}
                  placeholder="Enter task title"
                />
              </div>
              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={editingTask.description || ''}
                  onChange={(e) => setEditingTask(prev => prev ? { ...prev, description: e.target.value } : null)}
                  placeholder="Enter task description (optional)"
                />
              </div>
              <div>
                <Label htmlFor="edit-quadrant">Quadrant</Label>
                <Select
                  value={editingTask.quadrant}
                  onValueChange={(value) => setEditingTask(prev => prev ? { ...prev, quadrant: value as Task['quadrant'] } : null)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(QUADRANTS).map(([key, quadrant]) => (
                      <SelectItem key={key} value={key}>
                        {quadrant.title} - {quadrant.subtitle}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-priority">Priority</Label>
                <Select
                  value={editingTask.priority}
                  onValueChange={(value) => setEditingTask(prev => prev ? { ...prev, priority: value as Task['priority'] } : null)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditingTask(null)}>
                  Cancel
                </Button>
                <Button onClick={() => handleUpdateTask(editingTask.id, editingTask)}>
                  Update Task
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Help Dialog */}
      <Dialog open={showHelpDialog} onOpenChange={setShowHelpDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Eisenhower Matrix Guide</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              The Eisenhower Matrix helps you prioritize tasks by categorizing them based on urgency and importance.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(QUADRANTS).map(([key, quadrant]) => (
                <div key={key} className={`p-4 rounded-lg ${quadrant.color} border`}>
                  <h3 className={`font-semibold ${quadrant.textColor}`}>
                    {quadrant.title}
                  </h3>
                  <p className={`text-sm ${quadrant.textColor} opacity-80 mb-2`}>
                    {quadrant.subtitle}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {key === 'urgent-important' && 'Critical tasks that need immediate attention. Handle these first.'}
                    {key === 'not-urgent-important' && 'Important tasks that can be planned. Schedule time for these.'}
                    {key === 'urgent-not-important' && 'Tasks that seem urgent but aren\'t important. Consider delegating.'}
                    {key === 'not-urgent-not-important' && 'Tasks that waste time. Consider eliminating these.'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default QuadrantMatrix
