import { stackServerApp } from "@/stack"
import { redirect } from "next/navigation"
import ProjectsPageClient from "@/components/projects-page-client"
import { sql } from "@/lib/db"

export default async function ProjectsPage() {
  const user = await stackServerApp.getUser()
  if (!user) {
    redirect("/auth/signin")
  }

  const projects = await sql`
    SELECT * FROM projects WHERE user_id = ${user.id} ORDER BY created_at DESC
  `

  return <ProjectsPageClient initialProjects={projects} user={user} />
}
