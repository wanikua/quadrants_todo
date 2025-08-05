"use client"

import React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Users, Trash2 } from "lucide-react"
import OptimizedInput from "@/components/OptimizedInput"
import type { Player } from "@/lib/database"

interface TaskDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  taskDescription: string
  taskUrgency: number[]
  taskImportance: number[]
  taskAssignees: number[]
  players: Player[]
  isPending: boolean
  isMobile: boolean
  onTaskDescriptionChange: (value: string) => void
  onTaskUrgencyChange: (value: number[]) => void
  onTaskImportanceChange: (value: number[]) => void
  onPlayerSelect: (playerId: string) => void
  onPlayerRemove: (playerId: number) => void
  onAddTask: () => void
}

interface PlayerDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  newPlayerName: string
  players: Player[]
  isPending: boolean
  isMobile: boolean
  onNewPlayerNameChange: (value: string) => void
  onAddPlayer: () => void
  onDeletePlayer: (playerId: number) => void
}

export const MobileTaskDialog = React.memo(function MobileTaskDialog({
  isOpen,
  onOpenChange,
  taskDescription,
  taskUrgency,
  taskImportance,
  taskAssignees,
  players,
  isPending,
  isMobile,
  onTaskDescriptionChange,
  onTaskUrgencyChange,
  onTaskImportanceChange,
  onPlayerSelect,
  onPlayerRemove,
  onAddTask,
}: TaskDialogProps) {
  const getQuadrantLabel = (urgency: number, importance: number): string => {
    if (urgency >= 50 && importance >= 50) {
      return "Important & Urgent"
    } else if (urgency < 50 && importance >= 50) {
      return "Important & Not Urgent"
    } else if (urgency >= 50 && importance < 50) {
      return "Not Important & Urgent"
    } else {
      return "Not Important & Not Urgent"
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button size="lg" className="w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          Add Task
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[90vh]">
        <SheetHeader className="pb-4">
          <SheetTitle>Create New Task</SheetTitle>
        </SheetHeader>
        <div className="space-y-6 overflow-y-auto h-full pb-6">
          <div className="space-y-2">
            <Label htmlFor="taskDescription">Task Description</Label>
            <Textarea
              id="taskDescription"
              placeholder="Enter task description..."
              value={taskDescription}
              onChange={(e) => onTaskDescriptionChange(e.target.value)}
              disabled={isPending}
              className="min-h-[80px] text-base"
            />
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Urgency: {taskUrgency[0]}</Label>
              <Slider
                value={taskUrgency}
                onValueChange={onTaskUrgencyChange}
                max={100}
                step={1}
                disabled={isPending}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label>Importance: {taskImportance[0]}</Label>
              <Slider
                value={taskImportance}
                onValueChange={onTaskImportanceChange}
                max={100}
                step={1}
                disabled={isPending}
                className="w-full"
              />
            </div>
          </div>

          <div className="p-3 bg-blue-500/10 rounded-lg">
            <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
              Quadrant: {getQuadrantLabel(taskUrgency[0], taskImportance[0])}
            </p>
          </div>

          <div className="space-y-3">
            <Label>Assign Players (Optional)</Label>

            <Select onValueChange={onPlayerSelect} disabled={isPending}>
              <SelectTrigger className="h-12">
                <SelectValue placeholder="Select players to assign" />
              </SelectTrigger>
              <SelectContent>
                {players
                  .filter((player) => !taskAssignees.includes(player.id))
                  .map((player) => (
                    <SelectItem key={player.id} value={player.id.toString()}>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: player.color }} />
                        {player.name}
                      </div>
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>

            <div className="flex flex-wrap gap-2">
              {taskAssignees.map((playerId) => {
                const player = players.find((p) => p.id === playerId)
                return player ? (
                  <Badge
                    key={playerId}
                    variant="secondary"
                    className="cursor-pointer text-sm py-2 px-3"
                    onClick={() => onPlayerRemove(playerId)}
                  >
                    <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: player.color }} />
                    {player.name} ×
                  </Badge>
                ) : null
              })}
              {taskAssignees.length === 0 && (
                <div className="text-sm text-muted-foreground italic">No players assigned (task will be unassigned)</div>
              )}
            </div>
          </div>

          <Button onClick={onAddTask} disabled={isPending || !taskDescription.trim()} className="w-full h-12 text-base">
            {isPending ? "Creating..." : "Create Task"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
})

export const DesktopTaskDialog = React.memo(function DesktopTaskDialog({
  isOpen,
  onOpenChange,
  taskDescription,
  taskUrgency,
  taskImportance,
  taskAssignees,
  players,
  isPending,
  isMobile,
  onTaskDescriptionChange,
  onTaskUrgencyChange,
  onTaskImportanceChange,
  onPlayerSelect,
  onPlayerRemove,
  onAddTask,
}: TaskDialogProps) {
  const getQuadrantLabel = (urgency: number, importance: number): string => {
    if (urgency >= 50 && importance >= 50) {
      return "Important & Urgent"
    } else if (urgency < 50 && importance >= 50) {
      return "Important & Not Urgent"
    } else if (urgency >= 50 && importance < 50) {
      return "Not Important & Urgent"
    } else {
      return "Not Important & Not Urgent"
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" className="w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          Add Task
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="taskDescription">Task Description</Label>
            <Textarea
              id="taskDescription"
              placeholder="Enter task description..."
              value={taskDescription}
              onChange={(e) => onTaskDescriptionChange(e.target.value)}
              disabled={isPending}
              className="min-h-[80px]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Urgency: {taskUrgency[0]}</Label>
              <Slider
                value={taskUrgency}
                onValueChange={onTaskUrgencyChange}
                max={100}
                step={1}
                disabled={isPending}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label>Importance: {taskImportance[0]}</Label>
              <Slider
                value={taskImportance}
                onValueChange={onTaskImportanceChange}
                max={100}
                step={1}
                disabled={isPending}
                className="w-full"
              />
            </div>
          </div>

          <div className="p-3 bg-blue-500/10 rounded-lg">
            <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
              Quadrant: {getQuadrantLabel(taskUrgency[0], taskImportance[0])}
            </p>
          </div>

          <div className="space-y-3">
            <Label>Assign Players</Label>

            <Select onValueChange={onPlayerSelect} disabled={isPending}>
              <SelectTrigger>
                <SelectValue placeholder="Select players to assign" />
              </SelectTrigger>
              <SelectContent>
                {players
                  .filter((player) => !taskAssignees.includes(player.id))
                  .map((player) => (
                    <SelectItem key={player.id} value={player.id.toString()}>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: player.color }} />
                        {player.name}
                      </div>
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>

            <div className="flex flex-wrap gap-2">
              {taskAssignees.map((playerId) => {
                const player = players.find((p) => p.id === playerId)
                return player ? (
                  <Badge
                    key={playerId}
                    variant="secondary"
                    className="cursor-pointer text-sm"
                    onClick={() => onPlayerRemove(playerId)}
                  >
                    <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: player.color }} />
                    {player.name} ×
                  </Badge>
                ) : null
              })}
              {taskAssignees.length === 0 && (
                <div className="text-sm text-muted-foreground italic">No players assigned yet</div>
              )}
            </div>
          </div>

          <Button onClick={onAddTask} disabled={isPending || !taskDescription.trim()} className="w-full">
            {isPending ? "Creating..." : "Create Task"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
})

export const MobilePlayerDialog = React.memo(function MobilePlayerDialog({
  isOpen,
  onOpenChange,
  newPlayerName,
  players,
  isPending,
  isMobile,
  onNewPlayerNameChange,
  onAddPlayer,
  onDeletePlayer,
}: PlayerDialogProps) {
  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button variant="outline" size="lg" className="w-full sm:w-auto bg-transparent">
          <Users className="w-4 h-4" />
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[80vh]">
        <SheetHeader className="pb-4">
          <SheetTitle>Manage Players</SheetTitle>
        </SheetHeader>
        <div className="space-y-6 overflow-y-auto h-full pb-6">
          <div className="space-y-3">
            <Label htmlFor="playerName">Add New Player</Label>
            <div className="flex gap-2">
              <OptimizedInput
                id="playerName"
                placeholder="Enter player name..."
                value={newPlayerName}
                onChange={onNewPlayerNameChange}
                disabled={isPending}
                className="flex-1 h-12 text-base"
              />
              <Button onClick={onAddPlayer} disabled={isPending || !newPlayerName.trim()} size="lg" className="px-6">
                {isPending ? "Adding..." : "Add"}
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            <Label>Current Players ({players.length})</Label>
            <div className="space-y-2">
              {players.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No players yet. Add your first player!</p>
              ) : (
                players.map((player) => (
                  <div key={player.id} className="flex items-center justify-between p-3 border rounded-lg bg-card">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-full border border-border"
                        style={{ backgroundColor: player.color }}
                      />
                      <span className="font-medium">{player.name}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDeletePlayer(player.id)}
                      className="text-red-500 hover:text-red-700 h-10 w-10"
                      disabled={isPending}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
})

export const DesktopPlayerDialog = React.memo(function DesktopPlayerDialog({
  isOpen,
  onOpenChange,
  newPlayerName,
  players,
  isPending,
  isMobile,
  onNewPlayerNameChange,
  onAddPlayer,
  onDeletePlayer,
}: PlayerDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="w-full sm:w-auto bg-transparent">
          <Users className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Manage Players</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 overflow-y-auto">
          <div className="space-y-2">
            <Label htmlFor="playerName">Add New Player</Label>
            <div className="flex gap-2">
              <OptimizedInput
                id="playerName"
                placeholder="Enter player name..."
                value={newPlayerName}
                onChange={onNewPlayerNameChange}
                disabled={isPending}
                className="flex-1"
              />
              <Button onClick={onAddPlayer} disabled={isPending || !newPlayerName.trim()} size="sm">
                {isPending ? "Adding..." : "Add"}
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            <Label>Current Players ({players.length})</Label>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {players.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No players yet. Add your first player!</p>
              ) : (
                players.map((player) => (
                  <div key={player.id} className="flex items-center justify-between p-2 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full border border-border"
                        style={{ backgroundColor: player.color }}
                      />
                      <span className="text-sm font-medium">{player.name}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDeletePlayer(player.id)}
                      className="text-red-500 hover:text-red-700 h-8 w-8"
                      disabled={isPending}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
})
