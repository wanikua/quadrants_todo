"use client"

import { useState } from "react"
import { UserButton } from "@clerk/nextjs"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Plus, Users, UserIcon, Calendar } from "lucide-react"
import { createProject, joinProject } from "@/app/db/actions"
import { useRouter } from "next/navigation"

interface Project {
  id: string
  name: string
  type: "personal" | "team"
  role: "owner" | "admin" | "member"
  created_at: string
  member_count?: number
}

interface ProjectsPageProps {
  user: any
  projects: Project[]
}

export function ProjectsPage({ user, projects }: ProjectsPageProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isJoinDialogOpen, setIsJoinDialogOpen] = useState(false)
  const [projectName, setProjectName] = useState("")
  const [projectType, setProjectType] = useState<"personal" | "team">("personal")
  const [inviteCode, setInviteCode] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleCreateProject = async () => {
    if (!projectName.trim()) return

    setIsLoading(true)
    try {
      const result = await createProject(projectName, projectType)
      if (result.success) {
        setIsCreateDialogOpen(false)
        setProjectName("")
        router.refresh()
      } else {
        alert(`Failed to create project: ${result.error}`)
      }
    } catch (error) {
      console.error("Failed to create project:", error)
      alert("Failed to create project. Please check your database configuration.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleJoinProject = async () => {
    if (!inviteCode.trim()) return

    setIsLoading(true)
    try {
      const result = await joinProject(inviteCode)
      if (result.success) {
        setIsJoinDialogOpen(false)
        setInviteCode("")
        router.refresh()
      } else {
        alert(`Failed to join project: ${result.error}`)
      }
    } catch (error) {
      console.error("Failed to join project:", error)
      alert("Failed to join project. Please check your database configuration.")
    } finally {
      setIsLoading(false)
    }
  }

  const personalProjects = projects.filter((p) => p.type === "personal")
  const teamProjects = projects.filter((p) => p.type === "team")

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Task Manager</h1>
              <p className="text-sm text-gray-600">Welcome back, {user.name}</p>
            </div>
            <div className="flex items-center space-x-4">
              <UserButton afterSignOutUrl="/" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Your Projects</h2>
            <div className="flex space-x-3">
              <Dialog open={isJoinDialogOpen} onOpenChange={setIsJoinDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Users className="w-4 h-4 mr-2" />
                    Join Team
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Join Team Project</DialogTitle>
                    <DialogDescription>Enter the invite code to join an existing team project.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="inviteCode">Invite Code</Label>
                      <Input
                        id="inviteCode"
                        value={inviteCode}
                        onChange={(e) => setInviteCode(e.target.value)}
                        placeholder="Enter invite code"
                      />
                    </div>
                    <Button onClick={handleJoinProject} disabled={isLoading} className="w-full">
                      {isLoading ? "Joining..." : "Join Project"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    New Project
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Project</DialogTitle>
                    <DialogDescription>
                      Create a personal project or team project to organize your tasks.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="projectName">Project Name</Label>
                      <Input
                        id="projectName"
                        value={projectName}
                        onChange={(e) => setProjectName(e.target.value)}
                        placeholder="Enter project name"
                      />
                    </div>
                    <Tabs value={projectType} onValueChange={(value) => setProjectType(value as "personal" | "team")}>
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="personal">Personal</TabsTrigger>
                        <TabsTrigger value="team">Team</TabsTrigger>
                      </TabsList>
                      <TabsContent value="personal" className="mt-4">
                        <p className="text-sm text-gray-600">
                          A personal project is private and only accessible by you.
                        </p>
                      </TabsContent>
                      <TabsContent value="team" className="mt-4">
                        <p className="text-sm text-gray-600">
                          A team project can be shared with others using invite codes.
                        </p>
                      </TabsContent>
                    </Tabs>
                    <Button onClick={handleCreateProject} disabled={isLoading} className="w-full">
                      {isLoading ? "Creating..." : "Create Project"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Personal Projects */}
          <div className="mb-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <UserIcon className="w-5 h-5 mr-2" />
              Personal Projects
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {personalProjects.map((project) => (
                <Card
                  key={project.id}
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => router.push(`/projects/${project.id}`)}
                >
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{project.name}</CardTitle>
                      <Badge variant="secondary">Personal</Badge>
                    </div>
                    <CardDescription className="flex items-center text-sm text-gray-500">
                      <Calendar className="w-4 h-4 mr-1" />
                      Created {new Date(project.created_at).toLocaleDateString()}
                    </CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>

          {/* Team Projects */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <Users className="w-5 h-5 mr-2" />
              Team Projects
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {teamProjects.map((project) => (
                <Card
                  key={project.id}
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => router.push(`/projects/${project.id}`)}
                >
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{project.name}</CardTitle>
                      <Badge variant={project.role === "owner" ? "default" : "secondary"}>{project.role}</Badge>
                    </div>
                    <CardDescription className="flex items-center justify-between">
                      <span className="flex items-center text-sm text-gray-500">
                        <Calendar className="w-4 h-4 mr-1" />
                        Created {new Date(project.created_at).toLocaleDateString()}
                      </span>
                      <span className="text-sm text-gray-500">{project.member_count} members</span>
                    </CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>

          {projects.length === 0 && (
            <div className="text-center py-12">
              <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Plus className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No projects yet</h3>
              <p className="text-gray-600 mb-4">Get started by creating your first project.</p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>Create Your First Project</Button>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
