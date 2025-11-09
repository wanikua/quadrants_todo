import { requireAuth } from "@/lib/auth"
import ProjectsPageClient from "@/components/projects-page-client"
import { getUserProjects } from "@/lib/db-queries"

export default async function ProjectsPage() {
  const user = await requireAuth()

  // Use optimized query function to get all projects owned by and participated by the user
  const projects = await getUserProjects(user.id)

  return <ProjectsPageClient initialProjects={projects as any} user={user} />
}
