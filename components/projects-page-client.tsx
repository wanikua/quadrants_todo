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
import { LogOut, Plus, Folder, Settings, Users, Crown, Sparkles } from "lucide-react"
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

  async function handleSignOut() {
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
      router.refresh()
    } catch (error) {
      toast.error("Failed to join project")
      console.error(error)
    } finally {
      setIsJoining(false)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-6 md:px-20 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/Original Logo Symbol.png"
              alt="Logo"
              width={64}
              height={64}
              className="w-16 h-16 object-contain"
            />
            <span className="text-xl font-semibold text-black">Quadrants</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" className="text-black hover:text-[#F45F00] transition-all duration-200 font-medium">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Button>
            </Link>
            <Button onClick={handleSignOut} variant="outline" className="border border-gray-200 text-black hover:bg-gray-50 transition-all duration-200 font-medium">
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 md:px-20 py-12">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-black mb-2 flex items-center gap-3">
              My Projects
              {isPro && (
                <Badge className="bg-[#F45F00] hover:bg-[#d64f00] text-white">
                  <Crown className="w-3 h-3 mr-1" />
                  Pro
                </Badge>
              )}
            </h1>
            <p className="text-[#575757]">Welcome back, {user?.name || user?.email}</p>
          </div>
        </div>

        {/* Free plan limit banner */}
        {!isPro && (personalProjectCount >= 1 || teamProjectCount >= 1) && (
          <div className="mb-8 p-4 bg-gradient-to-r from-orange-50 to-amber-50 border-2 border-orange-200 rounded-lg">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-5 h-5 text-orange-600" />
                  <h3 className="font-semibold text-orange-900">You're on the Free Plan</h3>
                </div>
                <p className="text-sm text-orange-800 mb-3">
                  You've used {personalProjectCount}/1 personal project{personalProjectCount !== 1 ? 's' : ''} and {teamProjectCount}/1 team project{teamProjectCount !== 1 ? 's' : ''}
                </p>
                <p className="text-xs text-orange-700">
                  Upgrade to Pro for unlimited projects, priority support, and advanced features
                </p>
              </div>
              <Link href="/dashboard">
                <Button size="sm" className="bg-[#F45F00] hover:bg-[#d64f00] text-white ml-4">
                  <Crown className="w-4 h-4 mr-1" />
                  Upgrade to Pro
                </Button>
              </Link>
            </div>
          </div>
        )}

        <div className="mb-12 flex gap-4">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#F45F00] hover:bg-[#d64f00] text-white transition-all duration-200 font-medium shadow-sm hover:shadow-md">
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

                  {/* Project limits info for free users */}
                  {!isPro && (
                    <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-md">
                      <p className="text-xs text-orange-800 font-medium mb-1">Free Plan Limits:</p>
                      <div className="space-y-1 text-xs text-orange-700">
                        <div className="flex items-center justify-between">
                          <span>Personal projects:</span>
                          <span className={personalProjectCount >= 1 ? "font-bold text-orange-900" : ""}>
                            {personalProjectCount}/1
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Team projects:</span>
                          <span className={teamProjectCount >= 1 ? "font-bold text-orange-900" : ""}>
                            {teamProjectCount}/1
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-orange-600 mt-2">
                        Upgrade to Pro for unlimited projects
                      </p>
                    </div>
                  )}
                </div>
                <Button type="submit" className="w-full bg-[#F45F00] hover:bg-[#d64f00] text-white transition-all duration-200 font-medium shadow-sm hover:shadow-md" disabled={isCreating}>
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
                  className="w-full bg-[#F45F00] hover:bg-[#d64f00] text-white transition-all duration-200 font-medium shadow-sm hover:shadow-md"
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
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {projects.map((project) => (
              <Link key={project.id} href={`/projects/${project.id}`}>
                <Card className="border border-gray-200 hover:border-[#F45F00] hover:shadow-md transition-all duration-200 cursor-pointer h-full shadow-sm">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="flex-1 text-black">{project.name}</CardTitle>
                      <Badge
                        variant={project.type === 'team' ? 'default' : 'secondary'}
                        className={project.type === 'team' ? 'bg-[#F45F00] hover:bg-[#d64f00]' : 'bg-gray-200 text-black'}
                      >
                        {project.type === 'team' ? 'Team' : 'Personal'}
                      </Badge>
                    </div>
                    <CardDescription className="text-[#575757]">{project.description || "No description"}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm">
                      <p className="text-[#A3A3A3]" suppressHydrationWarning>
                        Created {new Date(project.created_at).toLocaleDateString()}
                      </p>
                      {project.type === 'team' && project.member_count && (
                        <div className="flex items-center gap-1 text-[#575757] font-medium">
                          <Users className="h-4 w-4" />
                          <span>{project.member_count}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
