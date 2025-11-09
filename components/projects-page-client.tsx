"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, Folder, Settings, Users, Crown, Sparkles, User, Archive, X as CloseIcon } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { joinProject } from "@/app/db/actions"

interface Project {
  id: string
  name: string
  description: string | null
  type?: string
  created_at: string
  member_count?: number
}

export default function ProjectsPageClient({ initialProjects, user }: { initialProjects: Project[]; user: any }) {
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>(initialProjects)

  // Check if user is Pro
  const isPro = user?.subscription_plan === 'pro' && user?.subscription_status === 'active'

  // Count current projects by type
  const personalProjectCount = projects.filter(p => p.type === 'personal').length
  const teamProjectCount = projects.filter(p => p.type === 'team').length
  const [newProjectName, setNewProjectName] = useState("")
  const [newProjectDescription, setNewProjectDescription] = useState("")
  const [newProjectType, setNewProjectType] = useState<"personal" | "team">("personal")
  const [isCreating, setIsCreating] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [joinDialogOpen, setJoinDialogOpen] = useState(false)
  const [inviteCode, setInviteCode] = useState("")
  const [isJoining, setIsJoining] = useState(false)
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false)
  const [archivedProjects, setArchivedProjects] = useState<Project[]>([])
  const [isLoadingArchived, setIsLoadingArchived] = useState(false)

  async function handleCreateProject(e: React.FormEvent) {
    e.preventDefault()
    setIsCreating(true)

    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newProjectName,
          description: newProjectDescription || null,
          type: newProjectType,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        // Check if it's a limit error that requires upgrade
        if (data.requiresUpgrade) {
          toast.error(data.error, {
            action: {
              label: "Upgrade to Pro",
              onClick: () => router.push("/dashboard")
            }
          })
        } else {
          toast.error(data.error || "Failed to create project")
        }
        return
      }

      setProjects([data, ...projects])
      setNewProjectName("")
      setNewProjectDescription("")
      setNewProjectType("personal")
      setDialogOpen(false)
      toast.success("Project created successfully!")
    } catch (error) {
      toast.error("Failed to create project")
      console.error(error)
    } finally {
      setIsCreating(false)
    }
  }

  async function handleJoinProject(e: React.FormEvent) {
    e.preventDefault()
    if (!inviteCode.trim()) {
      toast.error("Please enter an invite code")
      return
    }

    setIsJoining(true)

    try {
      const result = await joinProject(inviteCode.trim())

      if (!result.success) {
        toast.error(result.error || "Failed to join project")
        return
      }

      toast.success(`Successfully joined ${result.projectName}!`)
      setInviteCode("")
      setJoinDialogOpen(false)

      // Navigate directly to the project instead of refreshing
      if (result.projectId) {
        router.push(`/projects/${result.projectId}`)
      } else {
        router.refresh()
      }
    } catch (error) {
      toast.error("Failed to join project")
      console.error(error)
    } finally {
      setIsJoining(false)
    }
  }

  async function handleOpenArchives() {
    setArchiveDialogOpen(true)
    setIsLoadingArchived(true)

    try {
      const response = await fetch('/api/projects/archived')
      if (!response.ok) {
        throw new Error('Failed to load archived projects')
      }
      const data = await response.json()
      setArchivedProjects(data)
    } catch (error) {
      toast.error("Failed to load archived projects")
      console.error(error)
    } finally {
      setIsLoadingArchived(false)
    }
  }

  async function handleRestoreProject(projectId: string) {
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ archived: false })
      })

      if (!response.ok) {
        throw new Error('Failed to restore project')
      }

      toast.success("Project restored successfully")
      setArchiveDialogOpen(false)
      window.location.href = '/projects'
    } catch (error) {
      toast.error("Failed to restore project")
      console.error(error)
    }
  }


  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b-[3px] border-black">
        <div className="w-full px-[4%] md:px-[10%] h-24 flex items-center justify-between">
          <Link href="/" className="flex items-center group">
            <Image
              src="/Original Logo Symbol.png"
              alt="Logo"
              width={70}
              height={70}
              className="w-[70px] h-[70px] object-contain transition-all duration-[1200ms] ease-[ease] group-hover:scale-110"
            />
          </Link>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/dashboard")}
              title="Account Settings"
              className="text-black hover:text-gray-600 p-2"
            >
              <User className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-[4%] md:px-[10%] py-16">
        <div className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-5xl md:text-6xl font-bold text-black mb-4 flex items-center gap-4 leading-[1.1]">
              <span className="text-highlight-yellow inline-block">My Projects</span>
              {isPro && (
                <Badge className="bg-black text-white text-lg px-4 py-2 rounded-[20px] font-bold">
                  <Crown className="w-4 h-4 mr-2" />
                  Pro
                </Badge>
              )}
            </h1>
            <p className="text-xl text-gray-700">Welcome back, <span className="font-bold">{user?.name || user?.email}</span></p>
          </div>
        </div>

        <div className="mb-12 flex gap-4">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="transition-all duration-200 font-semibold shadow-sm hover:shadow-md rounded-full">
                <Plus className="mr-2 h-4 w-4" />
                New Project
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Project</DialogTitle>
                <DialogDescription>Add a new project to organize your tasks</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateProject} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Project Name</Label>
                  <Input
                    id="name"
                    placeholder="My Project"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    required
                    disabled={isCreating}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description (optional)</Label>
                  <Input
                    id="description"
                    placeholder="Project description"
                    value={newProjectDescription}
                    onChange={(e) => setNewProjectDescription(e.target.value)}
                    disabled={isCreating}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Project Type</Label>
                  <Select value={newProjectType} onValueChange={(value: "personal" | "team") => setNewProjectType(value)} disabled={isCreating}>
                    <SelectTrigger id="type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="personal">Personal Project</SelectItem>
                      <SelectItem value="team">Team Project</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white transition-all duration-200 font-semibold shadow-sm hover:shadow-md rounded-full" disabled={isCreating}>
                  {isCreating ? "Creating..." : "Create Project"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={joinDialogOpen} onOpenChange={setJoinDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border border-gray-200 text-black hover:bg-gray-50 transition-all duration-200 font-medium">
                <Folder className="mr-2 h-4 w-4" />
                Join an existing project
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Join Existing Project</DialogTitle>
                <DialogDescription>Enter the invite code shared by the project owner</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleJoinProject} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="inviteCode">Invite Code</Label>
                  <Input
                    id="inviteCode"
                    placeholder="ABC12345"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                    required
                    disabled={isJoining}
                    maxLength={8}
                    className="uppercase font-mono tracking-wider"
                  />
                  <p className="text-xs text-[#A3A3A3]">
                    Enter the 8-character code shared by the project owner
                  </p>
                </div>
                <Button
                  type="submit"
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white transition-all duration-200 font-semibold shadow-sm hover:shadow-md rounded-full"
                  disabled={isJoining}
                >
                  {isJoining ? "Joining..." : "Join Project"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {projects.length === 0 ? (
          <Card className="border border-gray-200 shadow-sm">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Folder className="h-16 w-16 text-[#A3A3A3] mb-4" />
              <h3 className="text-xl font-semibold text-black mb-2">No projects yet</h3>
              <p className="text-[#575757] mb-4">Create your first project to get started</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
            {projects.map((project) => (
              <div key={project.id} className="relative">
                <Link href={`/projects/${project.id}`}>
                  <Card className="border-[3px] border-black hover:shadow-2xl transition-all duration-[1200ms] ease-[ease] cursor-pointer h-full bg-white rounded-[20px] hover:-translate-y-2">
                    <CardHeader className="p-8">
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <CardTitle className="flex-1 text-black text-2xl font-bold leading-tight">{project.name}</CardTitle>
                        <Badge
                          variant={project.type === 'team' ? 'default' : 'secondary'}
                          className={project.type === 'team' ? 'bg-black text-white text-sm px-3 py-1 rounded-[10px] font-bold' : 'bg-gray-200 text-black text-sm px-3 py-1 rounded-[10px] font-bold'}
                        >
                          {project.type === 'team' ? 'Team' : 'Personal'}
                        </Badge>
                      </div>
                    <CardDescription className="text-gray-700 text-base leading-relaxed">{project.description || "No description"}</CardDescription>
                  </CardHeader>
                  <CardContent className="p-8 pt-0">
                    <div className="flex items-center justify-between text-sm">
                      <p className="text-gray-600 font-medium">
                        Created {new Date(project.created_at).toLocaleDateString('en-GB')}
                      </p>
                      {project.type === 'team' && project.member_count && (
                        <div className="flex items-center gap-2 text-black font-bold">
                          <Users className="h-5 w-5" />
                          <span>{project.member_count}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Floating Archives Button */}
      <Button
        onClick={handleOpenArchives}
        className="fixed bottom-8 right-8 rounded-full w-14 h-14 shadow-lg bg-gray-800 hover:bg-gray-900 text-white"
        title="View Archived Projects"
      >
        <Archive className="w-6 h-6" />
      </Button>

      {/* Archived Projects Dialog */}
      <Dialog open={archiveDialogOpen} onOpenChange={setArchiveDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <Archive className="w-6 h-6" />
              Archived Projects
            </DialogTitle>
            <DialogDescription>
              Projects that have been archived. You can restore them anytime.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4">
            {isLoadingArchived ? (
              <div className="flex items-center justify-center py-16">
                <div className="text-gray-500">Loading archived projects...</div>
              </div>
            ) : archivedProjects.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <Archive className="h-16 w-16 text-gray-300 mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No archived projects</h3>
                <p className="text-gray-500">Archived projects will appear here</p>
              </div>
            ) : (
              <div className="grid gap-4 max-h-[50vh] overflow-y-auto">
                {archivedProjects.map((project) => (
                  <Card key={project.id} className="border-2 border-gray-200">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-xl font-bold text-gray-900">{project.name}</h3>
                            <Badge variant={project.type === 'team' ? 'default' : 'secondary'}>
                              {project.type === 'team' ? 'Team' : 'Personal'}
                            </Badge>
                          </div>
                          <p className="text-gray-600 mb-2">{project.description || "No description"}</p>
                          <p className="text-sm text-gray-500">
                            Archived on {new Date(project.created_at).toLocaleDateString('en-GB')}
                          </p>
                        </div>
                        <Button
                          onClick={() => handleRestoreProject(project.id)}
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
