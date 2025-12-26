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
      <header className="bg-white border-b-3 border-black">
        <div className="w-full px-[4%] md:px-[10%] h-24 flex items-center justify-between">
          <Link href="/" className="flex items-center group">
            <div className="bg-yellow-300 border-3 border-black px-2 py-1 shadow-bold-sm transform -rotate-2 rounded-lg group-hover:rotate-0 transition-all">
              <span className="text-xl font-black tracking-tight text-black">Q.</span>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/dashboard")}
              title="Account Settings"
              className="text-black hover:text-gray-600 p-2 hover:bg-gray-100 rounded-xl"
            >
              <User className="w-6 h-6" />
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-[4%] md:px-[10%] py-16">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
          <div>
            <h1 className="text-5xl md:text-6xl font-black text-black mb-4 flex items-center gap-4 leading-[1.1]">
              <span className="text-black inline-block border-b-4 border-yellow-300">My Projects</span>
              {isPro && (
                <Badge className="bg-black text-white text-lg px-4 py-2 rounded-xl font-bold border-2 border-black">
                  <Crown className="w-4 h-4 mr-2 text-yellow-500 fill-current" />
                  Pro
                </Badge>
              )}
            </h1>
            <p className="text-xl text-gray-600 font-medium">Welcome back, <span className="font-bold text-black">{user?.name || user?.email}</span></p>
          </div>
        </div>

        <div className="mb-12 flex flex-wrap gap-4">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-black hover:bg-gray-800 text-white transition-all font-bold h-12 px-6 rounded-xl border-3 border-black shadow-bold hover:shadow-bold-hover hover:-translate-y-1">
                <Plus className="mr-2 h-5 w-5" />
                New Project
              </Button>
            </DialogTrigger>
            <DialogContent className="border-3 border-black shadow-bold-lg rounded-2xl p-6 sm:p-8">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black">Create New Project</DialogTitle>
                <DialogDescription className="text-base font-medium text-gray-600">Add a new project to organize your tasks</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateProject} className="space-y-6 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="font-bold text-base">Project Name</Label>
                  <Input
                    id="name"
                    placeholder="My Project"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    required
                    disabled={isCreating}
                    className="border-3 border-black rounded-xl h-12 text-lg focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-black focus-visible:shadow-bold-hover transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description" className="font-bold text-base">Description (optional)</Label>
                  <Input
                    id="description"
                    placeholder="Project description"
                    value={newProjectDescription}
                    onChange={(e) => setNewProjectDescription(e.target.value)}
                    disabled={isCreating}
                    className="border-3 border-black rounded-xl h-12 text-lg focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-black focus-visible:shadow-bold-hover transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type" className="font-bold text-base">Project Type</Label>
                  <Select value={newProjectType} onValueChange={(value: "personal" | "team") => setNewProjectType(value)} disabled={isCreating}>
                    <SelectTrigger id="type" className="border-3 border-black rounded-xl h-12 text-lg focus:ring-0 focus:ring-offset-0 shadow-bold-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border-3 border-black rounded-xl shadow-bold">
                      <SelectItem value="personal" className="font-bold cursor-pointer">Personal Project</SelectItem>
                      <SelectItem value="team" className="font-bold cursor-pointer">Team Project</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full bg-black hover:bg-gray-800 text-white transition-all font-bold h-12 rounded-xl border-3 border-black shadow-bold hover:shadow-bold-hover" disabled={isCreating}>
                  {isCreating ? "Creating..." : "Create Project"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={joinDialogOpen} onOpenChange={setJoinDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="bg-white hover:bg-gray-50 text-black border-3 border-black transition-all font-bold h-12 px-6 rounded-xl shadow-bold hover:shadow-bold-hover hover:-translate-y-1">
                <Folder className="mr-2 h-5 w-5" />
                Join Project
              </Button>
            </DialogTrigger>
            <DialogContent className="border-3 border-black shadow-bold-lg rounded-2xl p-6 sm:p-8">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black">Join Existing Project</DialogTitle>
                <DialogDescription className="text-base font-medium text-gray-600">Enter the invite code shared by the project owner</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleJoinProject} className="space-y-6 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="inviteCode" className="font-bold text-base">Invite Code</Label>
                  <Input
                    id="inviteCode"
                    placeholder="ABC12345"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                    required
                    disabled={isJoining}
                    maxLength={8}
                    className="uppercase font-mono tracking-wider border-3 border-black rounded-xl h-12 text-lg focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-black focus-visible:shadow-bold-hover transition-all"
                  />
                  <p className="text-xs text-gray-500 font-bold ml-1">
                    Enter the 8-character code shared by the project owner
                  </p>
                </div>
                <Button
                  type="submit"
                  className="w-full bg-black hover:bg-gray-800 text-white transition-all font-bold h-12 rounded-xl border-3 border-black shadow-bold hover:shadow-bold-hover"
                  disabled={isJoining}
                >
                  {isJoining ? "Joining..." : "Join Project"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {projects.length === 0 ? (
          <Card className="border-3 border-black shadow-bold rounded-[20px] bg-gray-50">
            <CardContent className="flex flex-col items-center justify-center py-20">
              <div className="w-24 h-24 bg-white border-3 border-black rounded-full flex items-center justify-center mb-6 shadow-bold-sm animate-float-gentle">
                <Folder className="h-10 w-10 text-black" />
              </div>
              <h3 className="text-2xl font-black text-black mb-2">No projects yet</h3>
              <p className="text-gray-600 font-medium mb-8 text-lg">Create your first project to get started</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {projects.map((project) => (
              <div key={project.id} className="relative group">
                <Link href={`/projects/${project.id}`}>
                  <Card className="border-3 border-black cursor-pointer h-full bg-white rounded-[20px] transition-all duration-300 hover:-translate-y-2 hover:shadow-bold-hover shadow-bold">
                    <CardHeader className="p-6 pb-4">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <CardTitle className="flex-1 text-black text-2xl font-black leading-tight line-clamp-1" title={project.name}>{project.name}</CardTitle>
                        <Badge
                          variant={project.type === 'team' ? 'default' : 'secondary'}
                          className={project.type === 'team'
                            ? 'bg-black text-white text-xs px-2 py-1 rounded-md font-bold border border-black'
                            : 'bg-gray-100 text-black text-xs px-2 py-1 rounded-md font-bold border-2 border-black'}
                        >
                          {project.type === 'team' ? 'Team' : 'Personal'}
                        </Badge>
                      </div>
                      <CardDescription className="text-gray-600 text-base font-medium line-clamp-2 min-h-[3rem]">{project.description || "No description"}</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 pt-0 mt-4">
                      <div className="flex items-center justify-between text-sm pt-4 border-t-2 border-gray-100">
                        <p className="text-gray-500 font-bold">
                          {new Date(project.created_at).toLocaleDateString('en-GB')}
                        </p>
                        {project.type === 'team' && project.member_count && (
                          <div className="flex items-center gap-2 text-black font-black bg-gray-100 px-2 py-1 rounded-lg border-2 border-black">
                            <Users className="h-4 w-4" />
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
        className="fixed bottom-8 right-8 rounded-full w-14 h-14 shadow-bold-lg bg-black hover:bg-gray-800 text-white border-3 border-black hover:-translate-y-1 transition-all z-40"
        title="View Archived Projects"
      >
        <Archive className="w-6 h-6" />
      </Button>

      {/* Archived Projects Dialog */}
      <Dialog open={archiveDialogOpen} onOpenChange={setArchiveDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] border-3 border-black shadow-bold-lg rounded-2xl p-8">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black flex items-center gap-2">
              <Archive className="w-6 h-6" />
              Archived Projects
            </DialogTitle>
            <DialogDescription className="font-medium text-gray-600">
              Projects that have been archived. You can restore them anytime.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-6">
            {isLoadingArchived ? (
              <div className="flex items-center justify-center py-16">
                <div className="text-gray-500 font-medium">Loading archived projects...</div>
              </div>
            ) : archivedProjects.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <Archive className="h-16 w-16 text-gray-300 mb-4" />
                <h3 className="text-xl font-bold text-gray-700 mb-2">No archived projects</h3>
                <p className="text-gray-500 font-medium">Archived projects will appear here</p>
              </div>
            ) : (
              <div className="grid gap-4 max-h-[50vh] overflow-y-auto pr-2">
                {archivedProjects.map((project) => (
                  <Card key={project.id} className="border-3 border-gray-200 hover:border-black transition-colors rounded-xl">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-xl font-black text-black">{project.name}</h3>
                            <Badge variant={project.type === 'team' ? 'default' : 'secondary'} className="font-bold border border-gray-200">
                              {project.type === 'team' ? 'Team' : 'Personal'}
                            </Badge>
                          </div>
                          <p className="text-gray-600 mb-2 font-medium">{project.description || "No description"}</p>
                          <p className="text-sm text-gray-400 font-medium">
                            Archived on {new Date(project.created_at).toLocaleDateString('en-GB')}
                          </p>
                        </div>
                        <Button
                          onClick={() => handleRestoreProject(project.id)}
                          variant="outline"
                          className="shrink-0 border-2 border-black font-bold hover:shadow-bold-sm transition-all"
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
