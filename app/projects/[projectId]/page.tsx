import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { getProject, getProjectTasks, getProjectPlayers, getProjectLines } from "@/lib/project-database"
import { ProjectTaskManager } from "@/components/project-task-manager"

interface ProjectPageProps {
  params: {
    projectId: string
  }
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { userId } = await auth()

  if (!userId) {
    redirect("/")
  }

  const project = await getProject(params.projectId, userId)

  if (!project) {
    redirect("/projects")
  }

  const [tasks, players, lines] = await Promise.all([
    getProjectTasks(params.projectId),
    getProjectPlayers(params.projectId),
    getProjectLines(params.projectId),
  ])

  return <ProjectTaskManager project={project} initialTasks={tasks} initialPlayers={players} initialLines={lines} />
}
