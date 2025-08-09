import { auth, currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { ProjectTaskManager } from "@/components/project-task-manager"
import { DatabaseConfigWarning } from "@/components/database-config-warning"
import { getProjectWithData, getUserProjectAccess } from "@/app/db/actions"

interface ProjectPageProps {
  params: {
    projectId: string
  }
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { userId } = await auth()
  const user = await currentUser()

  if (!userId || !user) {
    redirect("/")
  }

  // Check if database is configured
  const DATABASE_URL = process.env.DATABASE_URL
  if (!DATABASE_URL) {
    return <DatabaseConfigWarning />
  }

  try {
    // Check if user has access to this project
    const hasAccess = await getUserProjectAccess(userId, params.projectId)
    if (!hasAccess) {
      redirect("/projects")
    }

    // Get project data
    const projectData = await getProjectWithData(params.projectId)
    if (!projectData) {
      redirect("/projects")
    }

    return (
      <ProjectTaskManager
        user={{
          id: userId,
          name: user.firstName + " " + user.lastName,
          email: user.emailAddresses[0]?.emailAddress || "",
        }}
        project={projectData.project}
        tasks={projectData.tasks}
        players={projectData.players}
        lines={projectData.lines}
      />
    )
  } catch (error) {
    console.error("Failed to load project:", error)
    return <DatabaseConfigWarning />
  }
}
