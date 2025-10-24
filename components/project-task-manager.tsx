"use client"

import { useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Copy, Check, LogOut, Settings } from "lucide-react"
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => router.push("/projects")}
                title="Back to Projects"
                className="p-0 h-auto hover:bg-transparent"
              >
                <Image
                  src="/Original Logo Symbol.png"
                  alt="Home"
                  width={64}
                  height={64}
                  className="w-16 h-16 object-contain"
                />
              </Button>
            </div>
            <div className="flex items-center space-x-2">
              {project.type === "team" && project.invite_code && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyInviteCode}
                  className="flex items-center bg-transparent"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-2" />
                      Copy Invite Code
                    </>
                  )}
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/dashboard")}
                title="Settings"
              >
                <Settings className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={handleSignOut} title="Sign Out">
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Task Manager */}
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
