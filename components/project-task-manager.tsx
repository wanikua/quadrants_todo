"use client"

import { useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Copy, Check, ArrowLeft, Share2 } from "lucide-react"
import { useRouter } from "next/navigation"
import QuadrantTodoClient from "@/app/client"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

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
  const [shareDialogOpen, setShareDialogOpen] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const inviteCode = project.invite_code?.substring(0, 8).toUpperCase() || project.id.substring(0, 8).toUpperCase()
  const projectLink = typeof window !== 'undefined' ? `${window.location.origin}/projects/${project.id}` : ''
  const inviteLink = typeof window !== 'undefined' ? `${window.location.origin}/projects/join?code=${inviteCode}` : ''

  const handleCopyText = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text)
    toast.success(`✓ ${label} copied!`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Minimal Header - scrolls with page */}
      <header className="bg-white border-b">
        <div className="px-2 py-1">
          <button
            onClick={() => router.push("/projects")}
            title="Back to My Projects"
            className="group flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4 text-gray-500 group-hover:text-black transition-colors" />
            <span className="text-gray-500 group-hover:text-black transition-colors">Back</span>
          </button>
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

    </div>
  )
}
