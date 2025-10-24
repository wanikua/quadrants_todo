import { redirect } from "next/navigation"
import { ProjectTaskManager } from "@/components/project-task-manager"
import { DatabaseConfigWarning } from "@/components/database-config-warning"
import { getProjectWithData, getUserProjectAccess } from "@/app/db/actions"
import { initializeProjectPlayers } from "@/app/db/initialize-project"
import { requireAuth } from "@/lib/auth"

interface ProjectPageProps {
  params: Promise<{
    projectId: string
  }>
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const user = await requireAuth()
  const { projectId } = await params

  if (!user) {
    redirect("/auth/signin")
  }

  // Check if database is configured
  const DATABASE_URL = process.env.DATABASE_URL
  if (!DATABASE_URL) {
    return <DatabaseConfigWarning />
  }

  try {
    // Check if user has access to this project
    const hasAccess = await getUserProjectAccess(user.id, projectId)
    if (!hasAccess) {
      console.log("User does not have access to project:", projectId, "userId:", user.id)
      redirect("/projects")
    }

    // Get project data
    const projectData = await getProjectWithData(projectId)
    if (!projectData) {
      console.log("Project data not found:", projectId)
      redirect("/projects")
    }

    console.log("Loading project:", projectData.project.id, "Tasks:", projectData.tasks.length, "Players:", projectData.players.length)

    // Initialize players if none exist
    if (projectData.players.length === 0) {
      console.log("No players found, initializing...")
      await initializeProjectPlayers(projectId)
      // Re-fetch project data
      const updatedData = await getProjectWithData(projectId)
      if (updatedData) {
        projectData.players = updatedData.players
        console.log("Players initialized:", updatedData.players.length)
      }
    }

    return (
      <ProjectTaskManager
        project={projectData.project as any}
        initialTasks={projectData.tasks}
        initialPlayers={projectData.players}
        initialLines={projectData.lines}
        user={user}
      />
    )
  } catch (error) {
    console.error("Failed to load project:", error)
    return <DatabaseConfigWarning />
  }
}
