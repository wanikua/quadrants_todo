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
  projectType: "personal" | "team"
  userName?: string
}

export function BulkTaskInput({
  projectId,
  players,
  onTasksCreated,
  open,
  onOpenChange,
  projectType,
  userName
}: BulkTaskInputProps) {
  const [inputText, setInputText] = useState("")
  const [parsedTasks, setParsedTasks] = useState<ParsedTask[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  // Fuzzy match a mention against existing players
  const fuzzyMatchPlayer = (mention: string, playersList: typeof players): string | null => {
    const lowerMention = mention.toLowerCase()

    // 1. Exact match (case-insensitive) - highest priority
    const exactMatch = playersList.find(p => p.name.toLowerCase() === lowerMention)
    if (exactMatch) return exactMatch.name

    // 2. Starts with match - find shortest match to avoid over-matching
    const startsWithMatches = playersList.filter(p => p.name.toLowerCase().startsWith(lowerMention))
    if (startsWithMatches.length > 0) {
      // Return the shortest match (most specific)
      const shortestMatch = startsWithMatches.reduce((shortest, current) =>
        current.name.length < shortest.name.length ? current : shortest
      )
      return shortestMatch.name
    }

    // 3. Contains match - only if no starts-with match found
    const containsMatches = playersList.filter(p => p.name.toLowerCase().includes(lowerMention))
    if (containsMatches.length > 0) {
      // Return the shortest match
      const shortestMatch = containsMatches.reduce((shortest, current) =>
        current.name.length < shortest.name.length ? current : shortest
      )
      return shortestMatch.name
    }

    // 4. Fuzzy similarity (Levenshtein-like simple check) - lowest priority
    const similarMatch = playersList.find(p => {
      const playerLower = p.name.toLowerCase()
      // Check if mention is a subsequence of player name
      let mentionIndex = 0
      for (let i = 0; i < playerLower.length && mentionIndex < lowerMention.length; i++) {
        if (playerLower[i] === lowerMention[mentionIndex]) {
          mentionIndex++
        }
      }
      return mentionIndex === lowerMention.length
    })
    if (similarMatch) return similarMatch.name

    // No match found, return null (will be ignored)
    return null
  }

  // Parse text into tasks and detect @mentions
  const parseTaskText = (text: string): Omit<ParsedTask, 'predictedUrgency' | 'predictedImportance'>[] => {
    // Step 1: Split by newlines first
    let segments = text.split('\n')

    // Step 2: For each segment, also split by common punctuation marks
    const allSegments: string[] = []
    segments.forEach(segment => {
      // Split by Chinese and English punctuation: 。；，、/|
      const subSegments = segment
        .split(/[。；，、/|]/)
        .map(s => s.trim())
        .filter(s => s.length > 0)

      allSegments.push(...subSegments)
    })

    // Step 3: Clean and filter segments
    const cleanedSegments = allSegments
      .map(seg => seg.trim())
      .filter(seg => seg.length >= 2) // Filter out single characters or empty
      .filter(seg => seg !== '')

    // Step 4: Parse each segment for @mentions with fuzzy matching
    return cleanedSegments.map(line => {
      // Extract @mentions
      const mentionRegex = /@(\w+)/g
      const mentions: string[] = []
      let hasAllMention = false
      let match

      while ((match = mentionRegex.exec(line)) !== null) {
        const mentionText = match[1]

        // Special case: @all assigns to all players
        if (mentionText.toLowerCase() === 'all') {
          hasAllMention = true
          continue
        }

        // Fuzzy match against existing players
        const matchedName = fuzzyMatchPlayer(mentionText, players)
        // Only add if match found and not duplicate
        if (matchedName && !mentions.includes(matchedName)) {
          mentions.push(matchedName)
        }
        // If no match found, ignore (don't create non-existent players)
      }

      // Remove @mentions from description and clean up extra spaces
      const description = line
        .replace(/@\w+/g, '')
        .replace(/\s+/g, ' ') // Replace multiple spaces with single space
        .trim()

      // Determine final assignees:
      // 1. If @all mentioned, assign to all players
      // 2. If specific mentions found, use those
      // 3. Otherwise, auto-assign to current user
      let finalAssignees: string[]
      if (hasAllMention) {
        finalAssignees = players.map(p => p.name)
      } else if (mentions.length > 0) {
        finalAssignees = mentions
      } else {
        finalAssignees = userName ? [userName] : []
      }

      return {
        description,
        assignees: finalAssignees
      }
    }).filter(task => task.description.length >= 2) // Final filter for valid descriptions
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

  // Toggle assignee for a task
  const toggleAssignee = (taskIndex: number, assigneeName: string) => {
    setParsedTasks(prev => prev.map((task, i) => {
      if (i !== taskIndex) return task

      const currentAssignees = task.assignees || []
      const hasAssignee = currentAssignees.includes(assigneeName)

      return {
        ...task,
        assignees: hasAssignee
          ? currentAssignees.filter(a => a !== assigneeName) // Remove
          : [...currentAssignees, assigneeName] // Add
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
                  Enter your tasks
                </label>
                <Textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={`Smart input - paste any format:

• One task per line
• Or use commas, periods, semicolons to separate
${projectType === 'team' ? '• Mention players: @alice @bob' : ''}

Example: Fix login bug${projectType === 'team' ? ' @alice' : ''}, Review PR${projectType === 'team' ? ' @bob' : ''}, Update docs${projectType === 'team' ? ' @all' : ''}, Reply emails`}
                  className="min-h-[200px] font-mono text-sm"
                />
                {projectType === 'team' && (
                  <p className="text-xs text-muted-foreground mt-2">
                    💡 Tip: Use @playerName to assign tasks. Use @all for everyone. Tasks without @ will be assigned to yourself.
                  </p>
                )}
              </div>

              <Button
                onClick={analyzeTasks}
                disabled={isAnalyzing || !inputText.trim()}
                className="w-full"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing Tasks...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Analyze Tasks
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
                                task.assignees.map((assignee, i) => {
                                  const player = players.find(p => p.name === assignee)
                                  return (
                                    <Badge
                                      key={i}
                                      variant="default"
                                      className="text-xs cursor-pointer hover:opacity-70 transition-opacity flex items-center gap-1 group text-white"
                                      onClick={() => toggleAssignee(index, assignee)}
                                      title="Click to remove"
                                      style={{
                                        backgroundColor: player?.color || '#3b82f6'
                                      }}
                                    >
                                      {assignee}
                                      <X className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </Badge>
                                  )
                                })
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
