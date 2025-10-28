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
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" className="text-black hover:text-gray-600 transition-all duration-[1200ms] ease-[ease] font-bold text-lg h-auto px-6 py-3 rounded-[20px] hover:bg-gray-100">
                <Settings className="mr-2 h-5 w-5" />
                Settings
              </Button>
            </Link>
            <Button onClick={handleSignOut} className="border-[3px] border-black bg-white text-black hover:bg-black hover:text-white transition-all duration-[1200ms] ease-[ease] font-bold text-lg rounded-[20px] px-6 py-3">
              <LogOut className="mr-2 h-5 w-5" />
              Sign Out
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
              <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white transition-all duration-200 font-semibold shadow-sm hover:shadow-md rounded-full">
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
                <Button type="submit" className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white transition-all duration-200 font-semibold shadow-sm hover:shadow-md rounded-full" disabled={isCreating}>
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
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white transition-all duration-200 font-semibold shadow-sm hover:shadow-md rounded-full"
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
              <Link key={project.id} href={`/projects/${project.id}`}>
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
                      <p className="text-gray-600 font-medium" suppressHydrationWarning>
                        Created {new Date(project.created_at).toLocaleDateString()}
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
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
