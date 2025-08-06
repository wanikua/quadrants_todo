'use client'

import React, { useState, useCallback, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Plus, HelpCircle, Users, Palette, Trash2, Edit2, Check, X } from 'lucide-react'
import { TaskSegment } from './TaskSegment'

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

interface Line {
  id: string
  projectId: string
  startX: number
  startY: number
  endX: number
  endY: number
  color: string
  createdAt: Date
  updatedAt: Date
}

interface QuadrantMatrixProps {
  initialTasks: Task[]
  initialPlayers: Player[]
  initialLines: Line[]
}

export function QuadrantMatrix({ initialTasks, initialPlayers, initialLines }: QuadrantMatrixProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [players, setPlayers] = useState<Player[]>(initialPlayers)
  const [lines, setLines] = useState<Line[]>(initialLines)
  const [newTaskDescription, setNewTaskDescription] = useState('')
  const [newTaskUrgency, setNewTaskUrgency] = useState([50])
  const [newTaskImportance, setNewTaskImportance] = useState([50])
  const [showAddTask, setShowAddTask] = useState(false)
  const [showAddPlayer, setShowAddPlayer] = useState(false)
  const [showHelpDialog, setShowHelpDialog] = useState(false)
  const [newPlayerName, setNewPlayerName] = useState('')
  const [newPlayerColor, setNewPlayerColor] = useState('#3b82f6')
  const [editingTask, setEditingTask] = useState<string | null>(null)
  const [editingPlayer, setEditingPlayer] = useState<string | null>(null)

  const matrixRef = useRef<HTMLDivElement>(null)

  const addTask = useCallback(() => {
    if (newTaskDescription.trim()) {
      const newTask: Task = {
        id: Date.now().toString(),
        projectId: 'demo',
        description: newTaskDescription.trim(),
        urgency: newTaskUrgency[0],
        importance: newTaskImportance[0],
        completed: false,
        assignedTo: null,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      setTasks(prev => [...prev, newTask])
      setNewTaskDescription('')
      setNewTaskUrgency([50])
      setNewTaskImportance([50])
      setShowAddTask(false)
    }
  }, [newTaskDescription, newTaskUrgency, newTaskImportance])

  const addPlayer = useCallback(() => {
    if (newPlayerName.trim()) {
      const newPlayer: Player = {
        id: Date.now().toString(),
        projectId: 'demo',
        name: newPlayerName.trim(),
        color: newPlayerColor,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      setPlayers(prev => [...prev, newPlayer])
      setNewPlayerName('')
      setNewPlayerColor('#3b82f6')
      setShowAddPlayer(false)
    }
  }, [newPlayerName, newPlayerColor])

  const updateTask = useCallback((taskId: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId ? { ...task, ...updates, updatedAt: new Date() } : task
    ))
  }, [])

  const deleteTask = useCallback((taskId: string) => {
    setTasks(prev => prev.filter(task => task.id !== taskId))
  }, [])

  const updatePlayer = useCallback((playerId: string, updates: Partial<Player>) => {
    setPlayers(prev => prev.map(player => 
      player.id === playerId ? { ...player, ...updates, updatedAt: new Date() } : player
    ))
  }, [])

  const deletePlayer = useCallback((playerId: string) => {
    setPlayers(prev => prev.filter(player => player.id !== playerId))
    // Unassign tasks from deleted player
    setTasks(prev => prev.map(task => 
      task.assignedTo === playerId ? { ...task, assignedTo: null, updatedAt: new Date() } : task
    ))
  }, [])

  const getQuadrantTasks = useCallback((urgencyMin: number, urgencyMax: number, importanceMin: number, importanceMax: number) => {
    return tasks.filter(task => 
      task.urgency >= urgencyMin && task.urgency < urgencyMax &&
      task.importance >= importanceMin && task.importance < importanceMax
    )
  }, [tasks])

  const getQuadrantTitle = (urgency: 'high' | 'low', importance: 'high' | 'low') => {
    if (urgency === 'high' && importance === 'high') return 'Do First (Urgent & Important)'
    if (urgency === 'high' && importance === 'low') return 'Delegate (Urgent & Not Important)'
    if (urgency === 'low' && importance === 'high') return 'Schedule (Not Urgent & Important)'
    return 'Eliminate (Not Urgent & Not Important)'
  }

  const getQuadrantColor = (urgency: 'high' | 'low', importance: 'high' | 'low') => {
    if (urgency === 'high' && importance === 'high') return 'bg-red-50 border-red-200'
    if (urgency === 'high' && importance === 'low') return 'bg-yellow-50 border-yellow-200'
    if (urgency === 'low' && importance === 'high') return 'bg-green-50 border-green-200'
    return 'bg-gray-50 border-gray-200'
  }

  const renderQuadrant = (urgency: 'high' | 'low', importance: 'high' | 'low') => {
    const urgencyMin = urgency === 'high' ? 50 : 0
    const urgencyMax = urgency === 'high' ? 100 : 50
    const importanceMin = importance === 'high' ? 50 : 0
    const importanceMax = importance === 'high' ? 100 : 50
    
    const quadrantTasks = getQuadrantTasks(urgencyMin, urgencyMax, importanceMin, importanceMax)

    return (
      <Card key={`${urgency}-${importance}`} className={`${getQuadrantColor(urgency, importance)} min-h-[300px]`}>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">
            {getQuadrantTitle(urgency, importance)}
          </CardTitle>
          <Badge variant="outline" className="w-fit">
            {quadrantTasks.length} tasks
          </Badge>
        </CardHeader>
        <CardContent className="space-y-2">
          {quadrantTasks.map(task => (
            <TaskSegment
              key={task.id}
              task={task}
              players={players}
              onUpdate={updateTask}
              onDelete={deleteTask}
              isEditing={editingTask === task.id}
              onStartEdit={() => setEditingTask(task.id)}
              onStopEdit={() => setEditingTask(null)}
            />
          ))}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="p-2 sm:p-6">
      <CardHeader className="pb-2 sm:pb-4 px-2 sm:px-6">
        <CardTitle className="text-center text-lg sm:text-xl">ItsNotAI Task Manager</CardTitle>
        
        <div className="flex flex-wrap justify-center gap-2 mt-4">
          <Dialog open={showAddTask} onOpenChange={setShowAddTask}>
            <DialogTrigger asChild>
              <Button size="sm" className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Add Task
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Task</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="task-description">Description</Label>
                  <Textarea
                    id="task-description"
                    value={newTaskDescription}
                    onChange={(e) => setNewTaskDescription(e.target.value)}
                    placeholder="Enter task description..."
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Urgency: {newTaskUrgency[0]}</Label>
                  <Slider
                    value={newTaskUrgency}
                    onValueChange={setNewTaskUrgency}
                    max={100}
                    step={1}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label>Importance: {newTaskImportance[0]}</Label>
                  <Slider
                    value={newTaskImportance}
                    onValueChange={setNewTaskImportance}
                    max={100}
                    step={1}
                    className="mt-2"
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={addTask} className="flex-1">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Task
                  </Button>
                  <Button variant="outline" onClick={() => setShowAddTask(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={showAddPlayer} onOpenChange={setShowAddPlayer}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Add Player
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Player</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="player-name">Name</Label>
                  <Input
                    id="player-name"
                    value={newPlayerName}
                    onChange={(e) => setNewPlayerName(e.target.value)}
                    placeholder="Enter player name..."
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="player-color">Color</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="color"
                      id="player-color"
                      value={newPlayerColor}
                      onChange={(e) => setNewPlayerColor(e.target.value)}
                      className="w-12 h-8 rounded border"
                    />
                    <Input
                      value={newPlayerColor}
                      onChange={(e) => setNewPlayerColor(e.target.value)}
                      placeholder="#3b82f6"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={addPlayer} className="flex-1">
                    <Users className="w-4 h-4 mr-2" />
                    Add Player
                  </Button>
                  <Button variant="outline" onClick={() => setShowAddPlayer(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={showHelpDialog} onOpenChange={setShowHelpDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4" />
                Help
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Eisenhower Matrix Guide</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-red-50 border border-red-200 rounded">
                    <h4 className="font-semibold text-red-800">Do First</h4>
                    <p className="text-sm text-red-600">Urgent & Important</p>
                    <p className="text-xs mt-1">Crisis, emergencies, deadline-driven projects</p>
                  </div>
                  <div className="p-3 bg-green-50 border border-green-200 rounded">
                    <h4 className="font-semibold text-green-800">Schedule</h4>
                    <p className="text-sm text-green-600">Not Urgent & Important</p>
                    <p className="text-xs mt-1">Long-term development, strategic planning</p>
                  </div>
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                    <h4 className="font-semibold text-yellow-800">Delegate</h4>
                    <p className="text-sm text-yellow-600">Urgent & Not Important</p>
                    <p className="text-xs mt-1">Interruptions, some emails, some meetings</p>
                  </div>
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded">
                    <h4 className="font-semibold text-gray-800">Eliminate</h4>
                    <p className="text-sm text-gray-600">Not Urgent & Not Important</p>
                    <p className="text-xs mt-1">Time wasters, excessive social media</p>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {players.length > 0 && (
          <div className="mt-4">
            <h3 className="text-sm font-medium mb-2">Team Members</h3>
            <div className="flex flex-wrap gap-2">
              {players.map(player => (
                <div key={player.id} className="flex items-center gap-2">
                  {editingPlayer === player.id ? (
                    <div className="flex items-center gap-1">
                      <Input
                        value={player.name}
                        onChange={(e) => updatePlayer(player.id, { name: e.target.value })}
                        className="h-6 text-xs w-20"
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0"
                        onClick={() => setEditingPlayer(null)}
                      >
                        <Check className="w-3 h-3" />
                      </Button>
                    </div>
                  ) : (
                    <Badge
                      variant="outline"
                      style={{ backgroundColor: player.color + '20', borderColor: player.color }}
                      className="flex items-center gap-1 cursor-pointer"
                      onClick={() => setEditingPlayer(player.id)}
                    >
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: player.color }}
                      />
                      {player.name}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-4 w-4 p-0 ml-1"
                        onClick={(e) => {
                          e.stopPropagation()
                          deletePlayer(player.id)
                        }}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent className="px-2 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4" ref={matrixRef}>
          {renderQuadrant('high', 'high')}
          {renderQuadrant('low', 'high')}
          {renderQuadrant('high', 'low')}
          {renderQuadrant('low', 'low')}
        </div>
      </CardContent>
    </Card>
  )
}

export default QuadrantMatrix
