"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Sparkles, X, GripVertical } from "lucide-react"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface ParsedTask {
  description: string
  assignees: string[] // player names mentioned with @
  predictedUrgency: number
  predictedImportance: number
  finalUrgency?: number
  finalImportance?: number
}

interface BulkTaskInputProps {
  projectId: string
  players: Array<{ id: number; name: string; color: string }>
  onTasksCreated: () => void
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function BulkTaskInput({
  projectId,
  players,
  onTasksCreated,
  open,
  onOpenChange
}: BulkTaskInputProps) {
  const [inputText, setInputText] = useState("")
  const [parsedTasks, setParsedTasks] = useState<ParsedTask[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  // Parse text into tasks and detect @mentions
  const parseTaskText = (text: string): Omit<ParsedTask, 'predictedUrgency' | 'predictedImportance'>[] => {
    const lines = text.split('\n').filter(line => line.trim())

    return lines.map(line => {
      // Extract @mentions
      const mentionRegex = /@(\w+)/g
      const mentions: string[] = []
      let match

      while ((match = mentionRegex.exec(line)) !== null) {
        mentions.push(match[1])
      }

      // Remove @mentions from description
      const description = line.replace(/@\w+/g, '').trim()

      return {
        description,
        assignees: mentions
      }
    })
  }

  // Call AI API to predict priorities
  const analyzeTasks = async () => {
    if (!inputText.trim()) {
      toast.error("Please enter at least one task")
      return
    }

    setIsAnalyzing(true)
    try {
      const parsed = parseTaskText(inputText)

      // Call AI prediction API
      const response = await fetch('/api/ai/predict-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tasks: parsed.map(t => t.description),
          projectId
        })
      })

      if (!response.ok) {
        throw new Error('Failed to analyze tasks')
      }

      const predictions = await response.json()

      // Merge parsed data with predictions
      const tasksWithPredictions: ParsedTask[] = parsed.map((task, index) => ({
        ...task,
        predictedUrgency: predictions[index].urgency,
        predictedImportance: predictions[index].importance,
        finalUrgency: predictions[index].urgency,
        finalImportance: predictions[index].importance
      }))

      setParsedTasks(tasksWithPredictions)
      toast.success(`Analyzed ${tasksWithPredictions.length} tasks with AI`)
    } catch (error) {
      console.error('Analysis error:', error)
      toast.error('Failed to analyze tasks')
    } finally {
      setIsAnalyzing(false)
    }
  }

  // Update task priority
  const updateTaskPriority = (index: number, urgency?: number, importance?: number) => {
    setParsedTasks(prev => prev.map((task, i) => {
      if (i !== index) return task
      return {
        ...task,
        finalUrgency: urgency !== undefined ? urgency : task.finalUrgency,
        finalImportance: importance !== undefined ? importance : task.finalImportance
      }
    }))
  }

  // Remove a task from the list
  const removeTask = (index: number) => {
    setParsedTasks(prev => prev.filter((_, i) => i !== index))
  }

  // Create all tasks
  const createTasks = async () => {
    if (parsedTasks.length === 0) return

    setIsCreating(true)
    try {
      const response = await fetch('/api/tasks/bulk-create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          tasks: parsedTasks.map(task => ({
            description: task.description,
            urgency: task.finalUrgency!,
            importance: task.finalImportance!,
            assigneeNames: task.assignees,
            predictedUrgency: task.predictedUrgency,
            predictedImportance: task.predictedImportance
          }))
        })
      })

      if (!response.ok) {
        throw new Error('Failed to create tasks')
      }

      const result = await response.json()
      toast.success(`Created ${result.created} tasks successfully!`)

      // Reset state
      setInputText("")
      setParsedTasks([])
      onOpenChange(false)
      onTasksCreated()
    } catch (error) {
      console.error('Create tasks error:', error)
      toast.error('Failed to create tasks')
    } finally {
      setIsCreating(false)
    }
  }

  // Get quadrant label
  const getQuadrantLabel = (urgency: number, importance: number) => {
    if (urgency >= 50 && importance >= 50) return { label: "Urgent & Important", color: "bg-red-500" }
    if (urgency < 50 && importance >= 50) return { label: "Important, Not Urgent", color: "bg-yellow-500" }
    if (urgency >= 50 && importance < 50) return { label: "Urgent, Not Important", color: "bg-blue-500" }
    return { label: "Neither Urgent nor Important", color: "bg-gray-500" }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            AI-Powered Bulk Task Creation
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Input Section */}
          {parsedTasks.length === 0 && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Enter your tasks (one per line)
                </label>
                <Textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Example:
Fix login bug @alice
Review pull request @bob
Update documentation
Deploy to production @alice @bob"
                  className="min-h-[200px] font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  💡 Tip: Use @playerName to assign tasks. Leave unassigned for "Unassigned".
                </p>
              </div>

              <Button
                onClick={analyzeTasks}
                disabled={isAnalyzing || !inputText.trim()}
                className="w-full"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing with AI...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Analyze Tasks with AI
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Preview Section */}
          {parsedTasks.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Review & Adjust ({parsedTasks.length} tasks)</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setParsedTasks([])}
                >
                  <X className="w-4 h-4 mr-1" />
                  Start Over
                </Button>
              </div>

              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                {parsedTasks.map((task, index) => {
                  const quadrant = getQuadrantLabel(task.finalUrgency!, task.finalImportance!)

                  return (
                    <Card key={index} className="relative">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <GripVertical className="w-4 h-4 text-muted-foreground mt-1 flex-shrink-0" />

                          <div className="flex-1 space-y-3">
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-sm font-medium flex-1">{task.description}</p>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeTask(index)}
                                className="h-6 w-6 p-0"
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </div>

                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge className={`${quadrant.color} text-white text-xs`}>
                                {quadrant.label}
                              </Badge>

                              {task.assignees.length > 0 ? (
                                task.assignees.map((assignee, i) => (
                                  <Badge key={i} variant="outline" className="text-xs">
                                    @{assignee}
                                  </Badge>
                                ))
                              ) : (
                                <Badge variant="outline" className="text-xs text-muted-foreground">
                                  Unassigned
                                </Badge>
                              )}
                            </div>

                            <div className="grid grid-cols-2 gap-3 text-xs">
                              <div>
                                <label className="text-muted-foreground block mb-1">
                                  Urgency: {task.finalUrgency}%
                                </label>
                                <input
                                  type="range"
                                  min="0"
                                  max="100"
                                  value={task.finalUrgency}
                                  onChange={(e) => updateTaskPriority(index, Number(e.target.value), undefined)}
                                  className="w-full"
                                />
                              </div>
                              <div>
                                <label className="text-muted-foreground block mb-1">
                                  Importance: {task.finalImportance}%
                                </label>
                                <input
                                  type="range"
                                  min="0"
                                  max="100"
                                  value={task.finalImportance}
                                  onChange={(e) => updateTaskPriority(index, undefined, Number(e.target.value))}
                                  className="w-full"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setParsedTasks([])}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={createTasks}
                  disabled={isCreating}
                  className="flex-1"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    `Create ${parsedTasks.length} Tasks`
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
