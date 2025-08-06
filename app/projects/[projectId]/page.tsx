import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { getProjectWithData, getUserProjectAccess } from "@/app/db/actions"
import { QuadrantMatrix } from "@/components/QuadrantMatrix"
import { shouldUseClerk } from "@/lib/env"

interface ProjectPageProps {
  params: {
    projectId: string
  }
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  let userId = 'demo-user'
  
  // Only use Clerk if properly configured
  if (shouldUseClerk()) {
    try {
      const { userId: clerkUserId } = await auth()
      if (!clerkUserId) {
        redirect("/")
      }
      userId = clerkUserId
    } catch (error) {
      console.error('Clerk auth error:', error)
      // Continue with demo user
    }
  }

  // Check if user has access to this project
  const hasAccess = await getUserProjectAccess(userId, params.projectId)
  if (!hasAccess && shouldUseClerk()) {
    redirect("/projects")
  }

  // Get project data
  const projectData = await getProjectWithData(params.projectId)
  if (!projectData) {
    redirect("/projects")
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">{projectData.project.name}</h1>
          <p className="text-muted-foreground">
            {projectData.project.type === 'personal' ? 'Personal Project' : 'Team Project'}
          </p>
        </div>
        
        <QuadrantMatrix
          initialTasks={projectData.tasks}
          initialPlayers={projectData.players}
          initialLines={projectData.lines}
        />
      </div>
    </div>
  )
}
