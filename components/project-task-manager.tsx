"use client"

import { useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Copy, Check, LogOut, Home, User } from "lucide-react"
import { useRouter } from "next/navigation"
import QuadrantTodoClient from "@/app/client"

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

  const handleCopyInviteCode = async () => {
    if (project.invite_code) {
      await navigator.clipboard.writeText(project.invite_code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleSignOut = async () => {
    try {
      const response = await fetch('/api/auth/signout', { method: 'POST' })
      if (response.ok) {
        router.push("/")
        router.refresh()
      }
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
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
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push("/dashboard")}
                  title="Account Settings"
                  className="text-black hover:text-gray-600 p-2"
                >
                  <User className="w-5 h-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSignOut}
                  title="Sign Out"
                  className="text-black hover:text-gray-600 p-2"
                >
                  <LogOut className="w-5 h-5" />
                </Button>
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
      />
    </div>
  )
}
