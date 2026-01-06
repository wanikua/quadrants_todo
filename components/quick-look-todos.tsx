"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Zap, Folder, ArrowRight, ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"

interface PriorityTask {
  id: number
  description: string
  urgency: number
  importance: number
  priority_score: number
  project_id: string
  project_name: string
  project_type: string
}

export default function QuickLookTodos() {
  const router = useRouter()
  const [tasks, setTasks] = useState<PriorityTask[]>([])
  const [loading, setLoading] = useState(true)
  const [isExpanded, setIsExpanded] = useState(false)

  useEffect(() => {
    fetchPriorityTasks()
  }, [])

  async function fetchPriorityTasks() {
    try {
      const response = await fetch("/api/priority-todos")
      if (!response.ok) throw new Error("Failed to fetch priority tasks")
      const data = await response.json()
      setTasks(data)
    } catch (error) {
      console.error("Error fetching priority tasks:", error)
    } finally {
      setLoading(false)
    }
  }

  // Get color based on priority score
  const getPriorityColor = (score: number) => {
    if (score >= 150) return "bg-red-100 border-red-300 text-red-800"
    if (score >= 100) return "bg-orange-100 border-orange-300 text-orange-800"
    if (score >= 50) return "bg-yellow-100 border-yellow-300 text-yellow-800"
    return "bg-gray-100 border-gray-300 text-gray-800"
  }

  // Get quadrant label based on urgency and importance
  const getQuadrant = (urgency: number, importance: number) => {
    const isUrgent = urgency > 50
    const isImportant = importance > 50

    if (isUrgent && isImportant) return { label: "Do First", color: "bg-red-500" }
    if (!isUrgent && isImportant) return { label: "Schedule", color: "bg-yellow-500" }
    if (isUrgent && !isImportant) return { label: "Delegate", color: "bg-blue-500" }
    return { label: "Eliminate", color: "bg-gray-500" }
  }

  if (loading) {
    return null
  }

  if (tasks.length === 0) {
    return null
  }

  return (
    <div className="relative">
      {/* Sticky Note Style Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="bg-yellow-100 border-3 border-black rounded-xl p-4 shadow-bold hover:shadow-bold-hover transition-all hover:-translate-y-1 cursor-pointer"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-600 fill-yellow-600" />
            <span className="text-base font-black text-black">Quick Look</span>
            <Badge className="bg-yellow-500 text-black text-xs px-2 py-0.5 rounded-md font-bold border-2 border-black">
              {tasks.length}
            </Badge>
          </div>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-black" />
          ) : (
            <ChevronDown className="w-5 h-5 text-black" />
          )}
        </div>
      </button>

      {/* Expanded Task List */}
      {isExpanded && (
        <Card className="absolute right-0 mt-4 border-3 border-black shadow-bold-lg rounded-[20px] bg-gradient-to-br from-yellow-50 to-white w-[500px] max-w-[90vw] z-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-xl font-black text-black flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-500 fill-yellow-500" />
              Top Priority Tasks
            </CardTitle>
            <p className="text-sm text-gray-600 font-medium mt-1">
              Your most important tasks across all projects
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {tasks.map((task) => {
              const quadrant = getQuadrant(task.urgency, task.importance)
              return (
                <div
                  key={task.id}
                  onClick={() => router.push(`/projects/${task.project_id}`)}
                  className="p-3 rounded-xl border-2 border-black cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-bold-hover bg-white"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-black text-sm mb-2 line-clamp-2">
                        {task.description}
                      </p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-lg border-2 border-black">
                          <Folder className="w-3 h-3" />
                          <span className="truncate max-w-[120px]">{task.project_name}</span>
                        </div>
                        <Badge
                          className={`${quadrant.color} text-white text-xs px-2 py-0.5 rounded-md font-bold border-2 border-black`}
                        >
                          {quadrant.label}
                        </Badge>
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-400 shrink-0" />
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
