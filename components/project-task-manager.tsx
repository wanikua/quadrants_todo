"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Copy, Check, ArrowLeft, Share2 } from "lucide-react"
import { useRouter } from "next/navigation"
import QuadrantTodoClient from "@/app/client"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { SyncStatusIndicator, OfflineBanner } from "@/components/SyncStatusIndicator"
import { getSyncService } from "@/app/lib/offline"
import { useDesktop } from "@/hooks/use-desktop"

interface Project {
  id: string
  name: string
  description?: string
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
  const [shareDialogOpen, setShareDialogOpen] = useState(false)
  const { isDesktop } = useDesktop()
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isEditingProject, setIsEditingProject] = useState(false)
  const [editedProjectName, setEditedProjectName] = useState(project.name)
  const [editedProjectDescription, setEditedProjectDescription] = useState(project.description || "")
  const [projectName, setProjectName] = useState(project.name)
  const [isSaving, setIsSaving] = useState(false)

  // Cache project data for offline access
  useEffect(() => {
    const syncService = getSyncService()
    syncService.cacheProjectData(
      project.id,
      {
        id: project.id,
        name: project.name,
        description: project.description,
        type: project.type,
        owner_id: project.owner_id,
        archived: false,
      },
      initialTasks,
      initialPlayers,
      initialLines
    )
  }, [project, initialTasks, initialPlayers, initialLines])

  const inviteCode = project.invite_code?.substring(0, 8).toUpperCase() || project.id.substring(0, 8).toUpperCase()
  const projectLink = typeof window !== 'undefined' ? `${window.location.origin}/projects/${project.id}` : ''
  const inviteLink = typeof window !== 'undefined' ? `${window.location.origin}/projects/join?code=${inviteCode}` : ''

  const handleCopyText = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text)
    toast.success(`✓ ${label} copied!`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSaveProjectEdit = async () => {
    if (!editedProjectName.trim()) {
      toast.error("Project name cannot be empty")
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editedProjectName.trim(),
          description: editedProjectDescription.trim() || null,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        toast.error(data.error || "Failed to update project")
        return
      }

      toast.success("Project updated successfully")
      setProjectName(editedProjectName.trim())
      setIsEditingProject(false)
      router.refresh()
    } catch (error) {
      toast.error("Failed to update project")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="h-screen overflow-hidden bg-white flex flex-col">
      {/* Offline Banner */}
      <OfflineBanner />

      {/* Breadcrumb Header — matches projects page style */}
      <header className={`bg-white border-b-3 border-black ${isDesktop ? 'tauri-drag-region' : ''}`}
        style={isDesktop ? { paddingTop: '28px' } : undefined}>
        <div className="px-4 py-2.5 flex items-center gap-2">
          <button
            onClick={() => router.push("/projects")}
            title="Back to My Projects"
            className="group flex items-center gap-1.5 text-sm font-bold text-gray-500 hover:text-black transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>All Projects</span>
          </button>
          <span className="text-gray-300 font-bold">/</span>
          <span
            className="text-sm font-bold text-black flex items-center gap-1.5 group cursor-pointer hover:text-primary transition-colors"
            title="Click to edit project"
            onClick={() => setIsEditingProject(true)}
          >
            {projectName}
            <svg className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </span>
          <div className="ml-auto">
            <SyncStatusIndicator />
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-auto">
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
          onEditProject={() => setIsEditingProject(true)}
        />
      </div>


      {/* Share Project Dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share Project</DialogTitle>
            <p className="text-sm text-muted-foreground">
              Share this project with your team members
            </p>
          </DialogHeader>
          <div className="space-y-4">
            {/* Invite Code Option */}
            <div className="bg-white border-3 border-black rounded-2xl p-6 shadow-bold hover-lift-shadow transition-all">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-purple-100 border-2 border-black rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-black">Copy Invite Code</h3>
                  <p className="text-xs text-muted-foreground">8-digit code</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Input
                  value={inviteCode}
                  readOnly
                  className="flex-1 font-mono text-sm text-lg font-bold tracking-wider uppercase text-center"
                />
                <Button
                  onClick={() => handleCopyText(inviteCode, "Invite code")}
                  className="bg-black text-white hover:bg-black/90 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover-lift-shadow"
                >
                  Copy
                </Button>
              </div>
            </div>

            {/* Invite Accept Link */}
            <div className="bg-white border-3 border-black rounded-2xl p-6 shadow-bold hover-lift-shadow transition-all">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-green-100 border-2 border-black rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-black">Copy Invite Link</h3>
                  <p className="text-xs text-muted-foreground">One-click to join</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Input
                  value={inviteLink}
                  readOnly
                  className="flex-1 font-mono text-sm"
                />
                <Button
                  onClick={() => handleCopyText(inviteLink, "Invite link")}
                  className="bg-black text-white hover:bg-black/90 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover-lift-shadow"
                >
                  Copy
                </Button>
              </div>
            </div>

            {/* Info Note */}
            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4">
              <p className="text-sm text-yellow-800 flex items-start gap-2">
                <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Team members need to sign in to access the project. Use the invite link for easy one-click joining!</span>
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Project Dialog */}
      <Dialog open={isEditingProject} onOpenChange={setIsEditingProject}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Project Name</Label>
              <Input
                id="edit-name"
                value={editedProjectName}
                onChange={(e) => setEditedProjectName(e.target.value)}
                placeholder="Project name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description (optional)</Label>
              <Textarea
                id="edit-description"
                value={editedProjectDescription}
                onChange={(e) => setEditedProjectDescription(e.target.value)}
                placeholder="Project description"
                rows={3}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setIsEditingProject(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleSaveProjectEdit} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  )
}
