import { requireAuth, getUser } from "@/lib/auth"
import ProjectsPageClient from "@/components/projects-page-client"
import { getUserProjects } from "@/lib/db-queries"

export default async function ProjectsPage() {
  const userId = await requireAuth()
  const user = await getUser()

  // 使用优化的查询函数，获取用户拥有的和参与的所有项目
  const projects = await getUserProjects(userId)

  return <ProjectsPageClient initialProjects={projects as any} user={user} />
}
