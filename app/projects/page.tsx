import { requireAuth } from "@/lib/auth"
import ProjectsPageClient from "@/components/projects-page-client"
import { getUserProjects } from "@/lib/db-queries"

export default async function ProjectsPage() {
  const user = await requireAuth()

  // 使用优化的查询函数，获取用户拥有的和参与的所有项目
  const projects = await getUserProjects(user.id)

  return <ProjectsPageClient initialProjects={projects} user={user} />
}
