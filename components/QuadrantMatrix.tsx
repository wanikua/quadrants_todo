'use client'

import React, { useState, useRef, useCallback, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Edit, Trash2, Users, HelpCircle, X } from 'lucide-react'
import { TaskSegment } from './TaskSegment'
import { Task, Player, TaskWithAssignees, Line, Project } from '@/app/types'

interface QuadrantMatrixProps {
  project: Project
  tasks: Task[]
  players: Player[]
  lines: Line[]
  onTaskCreate?: (description: string, urgency: number, importance: number, assigneeIds: string[]) => void
  onTaskUpdate?: (taskId: string, updates: Partial<Task>) => void
  onTaskDelete?: (taskId: string) => void
  onPlayerCreate?: (name: string, color: string) => void
}

export function QuadrantMatrix({
  project,
  tasks = [],
  players = [],
  lines = [],
  onTaskCreate,
  onTaskUpdate,
  onTaskDelete,
  onPlayerCreate
}: QuadrantMatrixProps) {
  const [isAddingTask, setIsAddingTask] = useState(false)
  const [isAddingPlayer, setIsAddingPlayer] = useState(false)
  const [showHelpDialog, setShowHelpDialog] = useState(false)
  const [newTask, setNewTask] = useState({
    description: '',
    urgency: 50,
    importance: 50,
    assigneeIds: [] as string[]
  })
  const [newPlayer, setNewPlayer] = useState({
    name: '',
    color: '#3b82f6'
  })

  const matrixRef = useRef<HTMLDivElement>(null)

  // Categorize tasks into quadrants
  const getQuadrant = (urgency: number, importance: number) => {
    if (urgency >= 50 && importance >= 50) return 'urgent-important'
    if (urgency < 50 && importance >= 50) return 'not-urgent-important'
    if (urgency >= 50 && importance < 50) return 'urgent-not-important'
    return 'not-urgent-not-important'
  }

  const quadrants = {
    'urgent-important': tasks.filter(task => getQuadrant(task.urgency, task.importance) === 'urgent-important'),
    'not-urgent-important': tasks.filter(task => getQuadrant(task.urgency, task.importance) === 'not-urgent-important'),
    'urgent-not-important': tasks.filter(task => getQuadrant(task.urgency, task.importance) === 'urgent-not-important'),
    'not-urgent-not-important': tasks.filter(task => getQuadrant(task.urgency, task.importance) === 'not-urgent-not-important')
  }

  const handleCreateTask = async () => {
    if (!newTask.description.trim()) return

    if (onTaskCreate) {
      await onTaskCreate(
        newTask.description,
        newTask.urgency,
        newTask.importance,
        newTask.assigneeIds
      )
    }

    setNewTask({
      description: '',
      urgency: 50,
      importance: 50,
      assigneeIds: []
    })
    setIsAddingTask(false)
  }

  const handleCreatePlayer = async () => {
    if (!newPlayer.name.trim()) return

    if (onPlayerCreate) {
      await onPlayerCreate(newPlayer.name, newPlayer.color)
    }

    setNewPlayer({
      name: '',
      color: '#3b82f6'
    })
    setIsAddingPlayer(false)
  }

  const colors = [
    '#ef4444', '#f97316', '#eab308', '#22c55e',
    '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'
  ]

  return (
    <div className="w-full h-full p-4 bg-gray-50">
      <Card className="mb-6">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">{project.name}</CardTitle>
              <p className="text-gray-600 mt-1">Eisenhower Matrix - Task Prioritization</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowHelpDialog(true)}
              >
                <HelpCircle className="w-4 h-4 mr-2" />
                Help
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAddingPlayer(true)}
              >
                <Users className="w-4 h-4 mr-2" />
                Add Player
              </Button>
              <Button
                size="sm"
                onClick={() => setIsAddingTask(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Task
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Players Section */}
      {players.length > 0 && (
        <Card className="mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Team Members</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {players.map((player) => (
                <Badge
                  key={player.id}
                  variant="secondary"
                  className="px-3 py-1"
                  style={{ backgroundColor: player.color + '20', color: player.color }}
                >
                  {player.name}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Matrix Grid */}
      <div ref={matrixRef} className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[600px]">
        {/* Quadrant 1: Urgent & Important */}
        <Card className="border-red-200 bg-red-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-red-800 flex items-center justify-between">
              Do First
              <Badge variant="destructive" className="text-xs">
                Urgent & Important
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 max-h-96 overflow-y-auto">
            {quadrants['urgent-important'].map((task) => (
              <TaskSegment
                key={task.id}
                task={task}
                players={players}
                onUpdate={onTaskUpdate}
                onDelete={onTaskDelete}
              />
            ))}
            {quadrants['urgent-important'].length === 0 && (
              <p className="text-gray-500 text-sm italic">No urgent and important tasks</p>
            )}
          </CardContent>
        </Card>

        {/* Quadrant 2: Not Urgent & Important */}
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-blue-800 flex items-center justify-between">
              Schedule
              <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                Not Urgent & Important
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 max-h-96 overflow-y-auto">
            {quadrants['not-urgent-important'].map((task) => (
              <TaskSegment
                key={task.id}
                task={task}
                players={players}
                onUpdate={onTaskUpdate}
                onDelete={onTaskDelete}
              />
            ))}
            {quadrants['not-urgent-important'].length === 0 && (
              <p className="text-gray-500 text-sm italic">No important but not urgent tasks</p>
            )}
          </CardContent>
        </Card>

        {/* Quadrant 3: Urgent & Not Important */}
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-yellow-800 flex items-center justify-between">
              Delegate
              <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800">
                Urgent & Not Important
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 max-h-96 overflow-y-auto">
            {quadrants['urgent-not-important'].map((task) => (
              <TaskSegment
                key={task.id}
                task={task}
                players={players}
                onUpdate={onTaskUpdate}
                onDelete={onTaskDelete}
              />
            ))}
            {quadrants['urgent-not-important'].length === 0 && (
              <p className="text-gray-500 text-sm italic">No urgent but not important tasks</p>
            )}
          </CardContent>
        </Card>

        {/* Quadrant 4: Not Urgent & Not Important */}
        <Card className="border-gray-200 bg-gray-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-gray-800 flex items-center justify-between">
              Eliminate
              <Badge variant="outline" className="text-xs">
                Not Urgent & Not Important
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 max-h-96 overflow-y-auto">
            {quadrants['not-urgent-not-important'].map((task) => (
              <TaskSegment
                key={task.id}
                task={task}
                players={players}
                onUpdate={onTaskUpdate}
                onDelete={onTaskDelete}
              />
            ))}
            {quadrants['not-urgent-not-important'].length === 0 && (
              <p className="text-gray-500 text-sm italic">No low priority tasks</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add Task Dialog */}
      <Dialog open={isAddingTask} onOpenChange={setIsAddingTask}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="description">Task Description</Label>
              <Textarea
                id="description"
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                placeholder="Enter task description..."
                className="mt-1"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="urgency">Urgency: {newTask.urgency}%</Label>
                <Input
                  id="urgency"
                  type="range"
                  min="0"
                  max="100"
                  value={newTask.urgency}
                  onChange={(e) => setNewTask({ ...newTask, urgency: parseInt(e.target.value) })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="importance">Importance: {newTask.importance}%</Label>
                <Input
                  id="importance"
                  type="range"
                  min="0"
                  max="100"
                  value={newTask.importance}
                  onChange={(e) => setNewTask({ ...newTask, importance: parseInt(e.target.value) })}
                  className="mt-1"
                />
              </div>
            </div>

            {players.length > 0 && (
              <div>
                <Label>Assign to Players</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {players.map((player) => (
                    <Badge
                      key={player.id}
                      variant={newTask.assigneeIds.includes(player.id) ? "default" : "outline"}
                      className="cursor-pointer"
                      style={newTask.assigneeIds.includes(player.id) ? { backgroundColor: player.color } : {}}
                      onClick={() => {
                        const isSelected = newTask.assigneeIds.includes(player.id)
                        setNewTask({
                          ...newTask,
                          assigneeIds: isSelected
                            ? newTask.assigneeIds.filter(id => id !== player.id)
                            : [...newTask.assigneeIds, player.id]
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
              <Button variant="outline" onClick={() => setIsAddingTask(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateTask} disabled={!newTask.description.trim()}>
                Add Task
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Player Dialog */}
      <Dialog open={isAddingPlayer} onOpenChange={setIsAddingPlayer}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Player</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="playerName">Player Name</Label>
              <Input
                id="playerName"
                value={newPlayer.name}
                onChange={(e) => setNewPlayer({ ...newPlayer, name: e.target.value })}
                placeholder="Enter player name..."
                className="mt-1"
              />
            </div>
            
            <div>
              <Label>Color</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {colors.map((color) => (
                  <button
                    key={color}
                    className={`w-8 h-8 rounded-full border-2 ${
                      newPlayer.color === color ? 'border-gray-800' : 'border-gray-300'
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setNewPlayer({ ...newPlayer, color })}
                  />
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsAddingPlayer(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreatePlayer} disabled={!newPlayer.name.trim()}>
                Add Player
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Help Dialog */}
      <Dialog open={showHelpDialog} onOpenChange={setShowHelpDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Eisenhower Matrix Guide</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 border border-red-200 bg-red-50 rounded">
                <h4 className="font-semibold text-red-800 mb-2">Do First</h4>
                <p className="text-sm text-red-700">Urgent & Important tasks that need immediate attention</p>
              </div>
              <div className="p-3 border border-blue-200 bg-blue-50 rounded">
                <h4 className="font-semibold text-blue-800 mb-2">Schedule</h4>
                <p className="text-sm text-blue-700">Important but not urgent tasks to plan for</p>
              </div>
              <div className="p-3 border border-yellow-200 bg-yellow-50 rounded">
                <h4 className="font-semibold text-yellow-800 mb-2">Delegate</h4>
                <p className="text-sm text-yellow-700">Urgent but not important tasks to assign to others</p>
              </div>
              <div className="p-3 border border-gray-200 bg-gray-50 rounded">
                <h4 className="font-semibold text-gray-800 mb-2">Eliminate</h4>
                <p className="text-sm text-gray-700">Neither urgent nor important tasks to remove</p>
              </div>
            </div>
            <div className="text-sm text-gray-600">
              <p>Use the urgency and importance sliders when creating tasks to automatically place them in the correct quadrant.</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default QuadrantMatrix
