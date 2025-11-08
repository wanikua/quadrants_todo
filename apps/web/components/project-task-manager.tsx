"use client"

import { useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Copy, Check, Home, Archive } from "lucide-react"
import { useRouter } from "next/navigation"
import QuadrantTodoClient from "@/app/client"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getArchivedTasks, restoreTask } from "@/app/db/actions"

interface Project {
  id: string
  name: string
  type: "personal" | "team"
  owner_id: string
  invite_code?: string
  role: "owner" | "admin" | "member"
  created_at: string
}

interface ProjectTaskManagerProps {
  project: Project
  initialTasks: any[]
  initialPlayers: any[]
  initialLines: any[]
  user: any
}

export function ProjectTaskManager({ project, initialTasks, initialPlayers, initialLines, user }: ProjectTaskManagerProps) {
  const router = useRouter()
  const [copied, setCopied] = useState(false)
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false)
  const [archivedTasks, setArchivedTasks] = useState<any[]>([])
  const [isLoadingArchived, setIsLoadingArchived] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const handleCopyInviteCode = async () => {
    if (project.invite_code) {
      await navigator.clipboard.writeText(project.invite_code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }


  const handleOpenArchives = async () => {
    setArchiveDialogOpen(true)
    setIsLoadingArchived(true)

    try {
      const result = await getArchivedTasks(project.id)
      if (result.success && result.tasks) {
        setArchivedTasks(result.tasks)
      } else {
        toast.error(result.error || "Failed to load archived tasks")
      }
    } catch (error) {
      toast.error("Failed to load archived tasks")
      console.error(error)
    } finally {
      setIsLoadingArchived(false)
    }
  }

  const handleRestoreTask = async (taskId: number) => {
    try {
      const result = await restoreTask(taskId)
      if (result.success) {
        toast.success("Task restored successfully")
        setArchiveDialogOpen(false)
        window.location.href = `/projects/${project.id}`
      } else {
        toast.error(result.error || "Failed to restore task")
      }
    } catch (error) {
      toast.error("Failed to restore task")
      console.error(error)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="p-2 sm:p-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center h-14">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/projects")}
                title="Back to Projects"
                className="p-2 -ml-2 text-black hover:text-gray-600 transition-all duration-200"
              >
                <Home className="w-5 h-5" />
              </Button>
              <div className="flex items-center gap-2 -mr-2">
                {project.type === "team" && project.invite_code && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyInviteCode}
                    className="flex items-center border-gray-200"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-2" />
                        <span className="hidden sm:inline">Invite Code</span>
                        <span className="sm:hidden">Invite</span>
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <QuadrantTodoClient
        initialTasks={initialTasks}
        initialPlayers={initialPlayers}
        initialLines={initialLines}
        isOfflineMode={false}
        projectId={project.id}
        projectType={project.type}
        userName={user?.name}
        projectName={project.name}
        userRole={project.role}
        userId={user?.id}
        onFullscreenChange={setIsFullscreen}
      />

      {/* Floating Archives Button - Hidden in fullscreen */}
      {!isFullscreen && (
        <Button
          onClick={handleOpenArchives}
          className="fixed bottom-8 right-8 rounded-full w-14 h-14 shadow-lg bg-gray-800 hover:bg-gray-900 text-white z-50"
          title="View Archived Tasks"
        >
          <Archive className="w-6 h-6" />
        </Button>
      )}

      {/* Archived Tasks Dialog */}
      <Dialog open={archiveDialogOpen} onOpenChange={setArchiveDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <Archive className="w-6 h-6" />
              Archived Tasks
            </DialogTitle>
            <DialogDescription>
              Tasks that have been archived. You can restore them anytime.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4">
            {isLoadingArchived ? (
              <div className="flex items-center justify-center py-16">
                <div className="text-gray-500">Loading archived tasks...</div>
              </div>
            ) : archivedTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <Archive className="h-16 w-16 text-gray-300 mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No archived tasks</h3>
                <p className="text-gray-500">Archived tasks will appear here</p>
              </div>
            ) : (
              <div className="grid gap-4 max-h-[50vh] overflow-y-auto">
                {archivedTasks.map((task) => (
                  <Card key={task.id} className="border-2 border-gray-200">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-gray-900 mb-2">{task.description}</h3>
                          <div className="flex gap-4 text-sm text-gray-600 mb-2">
                            <div>
                              <span className="font-semibold">Urgency:</span> {task.urgency}
                            </div>
                            <div>
                              <span className="font-semibold">Importance:</span> {task.importance}
                            </div>
                          </div>
                          {task.assignees && task.assignees.length > 0 && (
                            <div className="flex gap-2 flex-wrap">
                              {task.assignees.map((assignee: any) => (
                                <Badge
                                  key={assignee.id}
                                  className="text-white"
                                  style={{ backgroundColor: assignee.color }}
                                >
                                  {assignee.name}
                                </Badge>
                              ))}
                            </div>
                          )}
                          <p className="text-sm text-gray-500 mt-2">
                            Created {new Date(task.created_at).toLocaleDateString('en-GB')}
                          </p>
                        </div>
                        <Button
                          onClick={() => handleRestoreTask(task.id)}
                          variant="outline"
                          className="shrink-0"
                        >
                          Restore
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
