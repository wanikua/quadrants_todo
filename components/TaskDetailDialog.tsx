"use client"

import React, { useState, useCallback, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Calendar, Clock, Users, Trash2, Edit, Save, X, MessageCircle, Send } from "lucide-react"
import TaskSegment from "@/components/TaskSegment"
import OptimizedInput from "@/components/OptimizedInput"
import type { TaskWithAssignees, Player } from "@/lib/database"

interface TaskDetailDialogProps {
  task: TaskWithAssignees | null
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  isMobile: boolean
  players: Player[]
  onDeleteTask: (taskId: number) => void
  onUpdateTask: (
    taskId: number,
    description: string,
    urgency: number,
    importance: number,
    assigneeIds: number[],
  ) => void
  onAddComment: (taskId: number, content: string, authorName: string) => void
  onDeleteComment: (commentId: number) => void
  isPending: boolean
}

const TaskDetailDialog = React.memo(function TaskDetailDialog({
  task,
  isOpen,
  onOpenChange,
  isMobile,
  players,
  onDeleteTask,
  onUpdateTask,
  onAddComment,
  onDeleteComment,
  isPending,
}: TaskDetailDialogProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editDescription, setEditDescription] = useState("")
  const [editUrgency, setEditUrgency] = useState([50])
  const [editImportance, setEditImportance] = useState([50])
  const [editAssignees, setEditAssignees] = useState<number[]>([])
  const [newComment, setNewComment] = useState("")
  const [commentAuthor, setCommentAuthor] = useState("Anonymous")

  useEffect(() => {
    if (task && isOpen) {
      setEditDescription(task.description)
      setEditUrgency([task.urgency])
      setEditImportance([task.importance])
      setEditAssignees(task.assignees.map((p) => p.id))
    }
  }, [task, isOpen])

  // 在任务assignees更新时，同步editAssignees状态
  useEffect(() => {
    if (task && isEditing) {
      setEditAssignees(task.assignees.map((p) => p.id))
    }
  }, [task?.assignees, isEditing])

  const handleStartEdit = useCallback(() => {
    setIsEditing(true)
  }, [])

  const handleCancelEdit = useCallback(() => {
    if (task) {
      setEditDescription(task.description)
      setEditUrgency([task.urgency])
      setEditImportance([task.importance])
      setEditAssignees(task.assignees.map((p) => p.id))
    }
    setIsEditing(false)
  }, [task])

  const handleSaveEdit = useCallback(() => {
    if (task) {
      onUpdateTask(task.id, editDescription.trim(), editUrgency[0], editImportance[0], editAssignees)
      setIsEditing(false)
    }
  }, [task, editDescription, editUrgency, editImportance, editAssignees, onUpdateTask])

  const handlePlayerSelect = useCallback(
    (playerId: string) => {
      const id = Number.parseInt(playerId)
      if (!editAssignees.includes(id)) {
        setEditAssignees((prev) => [...prev, id])
      }
    },
    [editAssignees],
  )

  const handlePlayerRemove = useCallback((playerId: number) => {
    setEditAssignees((prev) => prev.filter((id) => id !== playerId))
  }, [])

  const handleAddComment = useCallback(() => {
    if (task && newComment.trim()) {
      onAddComment(task.id, newComment.trim(), commentAuthor.trim() || "Anonymous")
      setNewComment("")
    }
  }, [task, newComment, commentAuthor, onAddComment])

  if (!task) return null

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

  const getQuadrantColor = (urgency: number, importance: number): string => {
    if (urgency >= 50 && importance >= 50) {
      return "bg-red-100 text-red-800 border-red-300"
    } else if (urgency < 50 && importance >= 50) {
      return "bg-blue-100 text-blue-800 border-blue-300"
    } else if (urgency >= 50 && importance < 50) {
      return "bg-yellow-100 text-yellow-800 border-yellow-300"
    } else {
      return "bg-muted text-muted-foreground border-border"
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const content = (
    <div className="space-y-6">
      {/* Task Header */}
      <div className="flex items-start gap-4">
        <TaskSegment task={task} size={isMobile ? 48 : 64} />
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div className="space-y-3">
              <OptimizedInput
                placeholder="Task description"
                value={editDescription}
                onChange={setEditDescription}
                disabled={isPending}
                className="text-lg font-semibold"
              />
            </div>
          ) : (
            <h3 className="text-lg font-semibold text-foreground break-words">{task.description}</h3>
          )}
          <div className="mt-2">
            <Badge
              variant="outline"
              className={`${getQuadrantColor(
                isEditing ? editUrgency[0] : task.urgency,
                isEditing ? editImportance[0] : task.importance,
              )} text-sm`}
            >
              {getQuadrantLabel(
                isEditing ? editUrgency[0] : task.urgency,
                isEditing ? editImportance[0] : task.importance,
              )}
            </Badge>
          </div>
        </div>
        <div className="flex gap-2">
          {!isEditing ? (
            <Button variant="outline" size="sm" onClick={handleStartEdit} disabled={isPending}>
              <Edit className="w-4 h-4" />
            </Button>
          ) : (
            <>
              <Button variant="outline" size="sm" onClick={handleSaveEdit} disabled={isPending}>
                <Save className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={handleCancelEdit} disabled={isPending}>
                <X className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Priority Metrics */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Clock className="w-4 h-4" />
            Urgency
          </div>
          {isEditing ? (
            <>
              <div className="text-2xl font-bold text-foreground">{editUrgency[0]}</div>
              <Slider value={editUrgency} onValueChange={setEditUrgency} max={100} step={1} disabled={isPending} />
            </>
          ) : (
            <>
              <div className="text-2xl font-bold text-foreground">{task.urgency}</div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${task.urgency}%` }}
                />
              </div>
            </>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Users className="w-4 h-4" />
            Importance
          </div>
          {isEditing ? (
            <>
              <div className="text-2xl font-bold text-foreground">{editImportance[0]}</div>
              <Slider
                value={editImportance}
                onValueChange={setEditImportance}
                max={100}
                step={1}
                disabled={isPending}
              />
            </>
          ) : (
            <>
              <div className="text-2xl font-bold text-foreground">{task.importance}</div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${task.importance}%` }}
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Assigned Players */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <Users className="w-4 h-4" />
          Assigned Players ({isEditing ? editAssignees.length : task.assignees.length})
        </div>

        {isEditing ? (
          <div className="space-y-3">
            <Select onValueChange={handlePlayerSelect} disabled={isPending}>
              <SelectTrigger>
                <SelectValue placeholder="Select players to assign" />
              </SelectTrigger>
              <SelectContent>
                {players
                  .filter((player) => !editAssignees.includes(player.id))
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
              {editAssignees.map((playerId) => {
                const player = players.find((p) => p.id === playerId)
                return player ? (
                  <Badge
                    key={playerId}
                    variant="secondary"
                    className="cursor-pointer text-sm py-1 px-3"
                    onClick={() => handlePlayerRemove(playerId)}
                  >
                    <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: player.color }} />
                    {player.name} ×
                  </Badge>
                ) : null
              })}
              {editAssignees.length === 0 && <div className="text-sm text-muted-foreground italic">No players assigned</div>}
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {task.assignees.length === 0 ? (
              <div className="text-sm text-muted-foreground italic p-3 bg-muted rounded-lg">
                No players assigned to this task
              </div>
            ) : (
              task.assignees.map((player) => (
                <div key={player.id} className="flex items-center gap-3 p-2 bg-muted rounded-lg">
                  <div
                    className="w-4 h-4 rounded-full border border-border"
                    style={{ backgroundColor: player.color }}
                  />
                  <span className="text-sm font-medium text-foreground">{player.name}</span>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Comments Section */}
      <div className="space-y-3 pt-4 border-t border-border">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <MessageCircle className="w-4 h-4" />
          Comments ({task.comments?.length || 0})
        </div>

        {/* Add Comment */}
        <div className="space-y-2">
          <div className="flex gap-2">
            <OptimizedInput
              placeholder="Your name (optional)"
              value={commentAuthor}
              onChange={setCommentAuthor}
              disabled={isPending}
              className="w-32"
            />
          </div>
          <div className="flex gap-2">
            <Textarea
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              disabled={isPending}
              className="flex-1 min-h-[60px]"
            />
            <Button
              onClick={handleAddComment}
              disabled={isPending || !newComment.trim()}
              size="sm"
              className="self-end"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Comments List */}
        {task.comments && task.comments.length > 0 && (
          <ScrollArea className="max-h-48">
            <div className="space-y-2">
              {task.comments.map((comment) => (
                <div key={comment.id} className="p-3 bg-muted rounded-lg">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-foreground">{comment.author_name}</span>
                        <span className="text-xs text-muted-foreground">{formatDate(comment.created_at)}</span>
                      </div>
                      <p className="text-sm text-foreground break-words">{comment.content}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDeleteComment(comment.id)}
                      className="text-red-500 hover:text-red-700 h-6 w-6 p-0"
                      disabled={isPending}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>

      {/* Task Metadata */}
      <div className="space-y-3 pt-4 border-t border-border">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="w-4 h-4" />
          Created: {formatDate(task.created_at)}
        </div>
        <div className="text-xs text-muted-foreground">Task ID: {task.id}</div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-4 border-t border-gray-200">
        <Button
          variant="destructive"
          size="sm"
          onClick={() => {
            onDeleteTask(task.id)
            onOpenChange(false)
          }}
          disabled={isPending}
          className="flex items-center gap-2"
        >
          <Trash2 className="w-4 h-4" />
          Delete Task
        </Button>
        <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="flex-1">
          Close
        </Button>
      </div>
    </div>
  )

  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="h-[90vh]">
          <SheetHeader className="pb-4">
            <SheetTitle>Task Details</SheetTitle>
          </SheetHeader>
          <ScrollArea className="h-full pb-6">{content}</ScrollArea>
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Task Details</DialogTitle>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  )
})

export default TaskDetailDialog
