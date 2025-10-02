import { redirect } from "next/navigation"
import { ProjectTaskManager } from "@/components/project-task-manager"
import { DatabaseConfigWarning } from "@/components/database-config-warning"
import { getProjectWithData, getUserProjectAccess } from "@/app/db/actions"
import { requireAuth } from "@/lib/auth"

interface ProjectPageProps {
  params: Promise<{
    projectId: string
  }>
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const userId = await requireAuth()
  const { projectId } = await params

  if (!userId) {
    redirect("/auth/signin")
  }

  // Check if database is configured
  const DATABASE_URL = process.env.DATABASE_URL
  if (!DATABASE_URL) {
    return <DatabaseConfigWarning />
  }

  try {
    // Check if user has access to this project
    const hasAccess = await getUserProjectAccess(userId, projectId)
    if (!hasAccess) {
      redirect("/projects")
    }

    // Get project data
    const projectData = await getProjectWithData(projectId)
    if (!projectData) {
      redirect("/projects")
    }

    return (
      <ProjectTaskManager
        project={projectData.project}
        initialTasks={projectData.tasks}
        initialPlayers={projectData.players}
        initialLines={projectData.lines}
      />
    )
  } catch (error) {
    console.error("Failed to load project:", error)
    return <DatabaseConfigWarning />
  }
}
