"use client"

import { useState, useCallback, useMemo } from "react"
import type { TaskWithAssignees, Player, Line, Project } from "./types"
import QuadrantMatrixMap from "@/components/QuadrantMatrixMap"
import { createTask, deleteTask, updateTask as updateTaskAction } from "@/app/db/actions"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Map, List, Trash2, Settings, Filter, X, Users, Plus, Link as LinkIcon, ChevronDown } from "lucide-react"
import TaskDetailDialog from "@/components/TaskDetailDialog"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import TaskSegment from "@/components/TaskSegment"

interface QuadrantTodoClientProps {
  initialTasks: TaskWithAssignees[]
  initialPlayers: Player[]
  initialLines: Line[]
  isOfflineMode: boolean
  projectId: string
  projectType: "personal" | "team"
}

export default function QuadrantTodoClient({
  initialTasks,
  initialPlayers,
  initialLines,
  isOfflineMode,
  projectId,
  projectType,
}: QuadrantTodoClientProps) {
  const router = useRouter()
  const [isDrawingLine, setIsDrawingLine] = useState(false)
  const [selectedTask, setSelectedTask] = useState<TaskWithAssignees | null>(null)
  const [isTaskDetailOpen, setIsTaskDetailOpen] = useState(false)
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isSettingsPopoverOpen, setIsSettingsPopoverOpen] = useState(false)
  const [selectedPlayerFilter, setSelectedPlayerFilter] = useState<string>("all")
  const [newTaskData, setNewTaskData] = useState({
    description: "",
    urgency: 50,
    importance: 50,
    assigneeIds: [] as string[],
  })

  const isMobile = false // You can add proper mobile detection if needed

  // Filter and sort tasks
  const filteredAndSortedTasks = useMemo(() => {
    let filtered = initialTasks

    if (selectedPlayerFilter !== "all") {
      if (selectedPlayerFilter === "unassigned") {
        filtered = initialTasks.filter(task => !task.assignees || task.assignees.length === 0)
      } else {
        const playerId = parseInt(selectedPlayerFilter)
        filtered = initialTasks.filter(task =>
          task.assignees && task.assignees.some(p => p.id === playerId)
        )
      }
    }

    return [...filtered].sort((a, b) => {
      if (a.importance !== b.importance) {
        return b.importance - a.importance
      }
      return b.urgency - a.urgency
    })
  }, [initialTasks, selectedPlayerFilter])

  const getQuadrantLabel = useCallback((urgency: number, importance: number): string => {
    if (urgency >= 50 && importance >= 50) return "Important & Urgent"
    if (urgency < 50 && importance >= 50) return "Important & Not Urgent"
    if (urgency >= 50 && importance < 50) return "Not Important & Urgent"
    return "Not Important & Not Urgent"
  }, [])

  const handleTaskCreate = async (description: string, urgency: number, importance: number, assigneeIds: string[]) => {
    const result = await createTask(projectId, description, urgency, importance, assigneeIds.map(id => parseInt(id)))
    if (result.success) {
      router.refresh()
    }
  }

  const handleLongPress = async (urgency: number, importance: number) => {
    setNewTaskData({ ...newTaskData, urgency, importance })
    setIsAddTaskOpen(true)
  }

  const handleTaskDetailClick = (task: TaskWithAssignees) => {
    setSelectedTask(task)
    setIsTaskDetailOpen(true)
  }

  const handleTaskUpdate = async (taskId: string, updates: any) => {
    router.refresh()
  }

  const handleTaskDelete = async (taskId: string) => {
    const result = await deleteTask(parseInt(taskId))
    if (result.success) {
      setIsTaskDetailOpen(false)
      router.refresh()
    }
  }

  const handleSubmitTask = async () => {
    if (!newTaskData.description.trim()) return
    await handleTaskCreate(
      newTaskData.description,
      newTaskData.urgency,
      newTaskData.importance,
      newTaskData.assigneeIds
    )
    setNewTaskData({
      description: "",
      urgency: 50,
      importance: 50,
      assigneeIds: [],
    })
    setIsAddTaskOpen(false)
  }

  const handleDrawingToggle = () => {
    setIsDrawingLine(!isDrawingLine)
    setIsSettingsPopoverOpen(false)
    setIsSettingsOpen(false)
  }

  return (
    <div className="min-h-screen bg-background p-2 sm:p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-4">
          <div className="flex items-center gap-2 sm:gap-4">
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">Task Manager</h1>
            {isOfflineMode && (
              <Badge variant="outline" className="bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20">
                Offline Mode
              </Badge>
            )}
          </div>

          {/* Desktop Settings Popover */}
          {!isMobile && (
            <Popover open={isSettingsPopoverOpen} onOpenChange={setIsSettingsPopoverOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                  <ChevronDown className="w-4 h-4 ml-2" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-96 p-0" align="end">
                <div className="bg-primary/5 p-4 border-b">
                  <h3 className="font-semibold text-lg">Settings & Actions</h3>
                  <p className="text-sm text-muted-foreground mt-1">Manage your team and tasks</p>
                </div>

                <div className="p-4 space-y-4">
                  {/* Quick Actions */}
                  <div>
                    <h4 className="text-sm font-medium mb-3 flex items-center">
                      <Plus className="w-4 h-4 mr-2" />
                      Quick Actions
                    </h4>
                    <Dialog open={isAddTaskOpen} onOpenChange={setIsAddTaskOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="w-full">
                          <Plus className="w-4 h-4 mr-2" />
                          Add Task
                        </Button>
                      </DialogTrigger>
                    </Dialog>
                  </div>

                  {/* Tools */}
                  <div>
                    <h4 className="text-sm font-medium mb-3 flex items-center">
                      <LinkIcon className="w-4 h-4 mr-2" />
                      Add Dependency
                    </h4>
                    <Button
                      variant={isDrawingLine ? "default" : "outline"}
                      size="sm"
                      onClick={handleDrawingToggle}
                      className="w-full justify-start"
                    >
                      <LinkIcon className="w-4 h-4 mr-2" />
                      {isDrawingLine ? "Cancel Connection" : "Connect Tasks"}
                    </Button>
                  </div>

                  {/* Filter */}
                  <div>
                    <h4 className="text-sm font-medium mb-3 flex items-center">
                      <Filter className="w-4 h-4 mr-2" />
                      Filter by Player
                    </h4>
                    <Select value={selectedPlayerFilter} onValueChange={setSelectedPlayerFilter}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Filter by player" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Tasks</SelectItem>
                        <SelectItem value="unassigned">Unassigned</SelectItem>
                        {initialPlayers.map((player) => (
                          <SelectItem key={player.id} value={player.id.toString()}>
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: player.color }} />
                              {player.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          )}

          {/* Mobile Settings Sheet */}
          {isMobile && (
            <Sheet open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="lg" className="w-full">
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-auto max-h-[80vh]">
                <SheetHeader>
                  <SheetTitle>Settings & Actions</SheetTitle>
                </SheetHeader>
                <div className="space-y-4 mt-4">
                  <Button onClick={() => { setIsAddTaskOpen(true); setIsSettingsOpen(false) }} className="w-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Task
                  </Button>
                  <Button
                    variant={isDrawingLine ? "default" : "outline"}
                    onClick={handleDrawingToggle}
                    className="w-full"
                  >
                    <LinkIcon className="w-4 h-4 mr-2" />
                    {isDrawingLine ? "Cancel Connection" : "Connect Tasks"}
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          )}
        </div>

        {/* Tabs for Map/List View */}
        <Tabs defaultValue="map" className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-12 sm:h-10">
            <TabsTrigger value="map" className="flex items-center gap-2">
              <Map className="w-4 h-4" />
              Map View
            </TabsTrigger>
            <TabsTrigger value="list" className="flex items-center gap-2">
              <List className="w-4 h-4" />
              List View
            </TabsTrigger>
          </TabsList>

          {/* Map View Tab */}
          <TabsContent value="map" className="mt-4 sm:mt-6">
            {selectedPlayerFilter !== "all" && (
              <div className="mb-4 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-primary" />
                    <span className="text-sm">
                      Filtered: {filteredAndSortedTasks.length} of {initialTasks.length} tasks shown
                      {selectedPlayerFilter === "unassigned"
                        ? " (unassigned)"
                        : ` (${initialPlayers.find(p => p.id.toString() === selectedPlayerFilter)?.name})`}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedPlayerFilter("all")}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
            <QuadrantMatrixMap
              tasks={selectedPlayerFilter !== "all" ? filteredAndSortedTasks : initialTasks}
              players={initialPlayers}
              lines={initialLines}
              projectId={projectId}
              isMobile={isMobile}
              isDrawingLine={isDrawingLine}
              onTaskDetailClick={handleTaskDetailClick}
              onToggleDrawingMode={handleDrawingToggle}
              onLongPress={handleLongPress}
            />
          </TabsContent>

          {/* List View Tab */}
          <TabsContent value="list" className="mt-4 sm:mt-6">
            <Card>
              <CardHeader className="px-4 sm:px-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <CardTitle className="text-lg sm:text-xl">Tasks by Priority</CardTitle>
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-muted-foreground" />
                    <Select value={selectedPlayerFilter} onValueChange={setSelectedPlayerFilter}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Filter by player" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Tasks</SelectItem>
                        <SelectItem value="unassigned">Unassigned</SelectItem>
                        {initialPlayers.map((player) => (
                          <SelectItem key={player.id} value={player.id.toString()}>
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: player.color }} />
                              {player.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {selectedPlayerFilter !== "all" && (
                  <div className="mt-2 text-sm text-muted-foreground">
                    Showing {filteredAndSortedTasks.length} of {initialTasks.length} tasks
                    {selectedPlayerFilter === "unassigned"
                      ? " (unassigned)"
                      : ` (${initialPlayers.find(p => p.id.toString() === selectedPlayerFilter)?.name})`}
                  </div>
                )}
              </CardHeader>
              <CardContent className="px-4 sm:px-6">
                <div className="space-y-3">
                  {filteredAndSortedTasks.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      {selectedPlayerFilter !== "all"
                        ? `No tasks found for ${selectedPlayerFilter === "unassigned" ? "unassigned" : initialPlayers.find(p => p.id.toString() === selectedPlayerFilter)?.name}`
                        : "No tasks yet. Create your first task!"}
                    </p>
                  ) : (
                    filteredAndSortedTasks.map((task) => (
                      <div
                        key={task.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 border rounded-lg hover:bg-accent cursor-pointer gap-3 sm:gap-4"
                        onClick={() => handleTaskDetailClick(task)}
                      >
                        <div className="flex items-center gap-3 sm:gap-4">
                          <TaskSegment task={task} size={isMobile ? 28 : 32} />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm sm:text-base truncate">{task.description}</p>
                            <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground mt-1">
                              <span>Urgency: {task.urgency}</span>
                              <span>Importance: {task.importance}</span>
                              <Badge variant="outline" className="text-xs">
                                {getQuadrantLabel(task.urgency, task.importance)}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between sm:justify-end gap-2">
                          <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                            {!task.assignees || task.assignees.length === 0 ? (
                              <span className="text-xs text-muted-foreground italic">Unassigned</span>
                            ) : (
                              task.assignees.map((player) => (
                                <div key={player.id} className="flex items-center gap-1">
                                  <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full" style={{ backgroundColor: player.color }} />
                                  <span className="text-xs text-muted-foreground">{player.name}</span>
                                </div>
                              ))
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleTaskDelete(task.id.toString())
                            }}
                            className="text-destructive hover:text-destructive h-8 w-8 sm:h-auto sm:w-auto"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Add Task Dialog */}
        <Dialog open={isAddTaskOpen} onOpenChange={setIsAddTaskOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Task</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newTaskData.description}
                  onChange={(e) => setNewTaskData({ ...newTaskData, description: e.target.value })}
                  placeholder="Enter task description..."
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="urgency">Urgency: {newTaskData.urgency}%</Label>
                  <Input
                    id="urgency"
                    type="range"
                    min="0"
                    max="100"
                    value={newTaskData.urgency}
                    onChange={(e) => setNewTaskData({ ...newTaskData, urgency: parseInt(e.target.value) })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="importance">Importance: {newTaskData.importance}%</Label>
                  <Input
                    id="importance"
                    type="range"
                    min="0"
                    max="100"
                    value={newTaskData.importance}
                    onChange={(e) => setNewTaskData({ ...newTaskData, importance: parseInt(e.target.value) })}
                    className="mt-1"
                  />
                </div>
              </div>

              {projectType === "team" && initialPlayers.length > 0 && (
                <div>
                  <Label>Assign to Players</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {initialPlayers.map((player) => (
                      <Badge
                        key={player.id}
                        variant={newTaskData.assigneeIds.includes(player.id) ? "default" : "outline"}
                        className="cursor-pointer"
                        style={newTaskData.assigneeIds.includes(player.id) ? { backgroundColor: player.color } : {}}
                        onClick={() => {
                          const isSelected = newTaskData.assigneeIds.includes(player.id)
                          setNewTaskData({
                            ...newTaskData,
                            assigneeIds: isSelected
                              ? newTaskData.assigneeIds.filter(id => id !== player.id)
                              : [...newTaskData.assigneeIds, player.id]
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
                <Button variant="outline" onClick={() => setIsAddTaskOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSubmitTask} disabled={!newTaskData.description.trim()}>
                  Create Task
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Task Detail Dialog */}
        {selectedTask && (
          <TaskDetailDialog
            task={selectedTask}
            players={initialPlayers}
            isOpen={isTaskDetailOpen}
            onOpenChange={setIsTaskDetailOpen}
            isMobile={isMobile}
            onDeleteTask={handleTaskDelete}
            onUpdateTask={handleTaskUpdate}
            onAddComment={async () => {}}
            onDeleteComment={async () => {}}
          />
        )}
      </div>
    </div>
  )
}
