import { auth, currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { ProjectsPage } from "@/components/projects-page"
import { getProjectsForUser } from "@/lib/project-database"

export default async function Projects() {
  const { userId } = await auth()
  const user = await currentUser()

  if (!userId || !user) {
    redirect("/")
  }

  const projects = await getProjectsForUser(userId)

  return (
    <ProjectsPage
      user={{
        id: userId,
        name: user.firstName + " " + user.lastName,
        email: user.emailAddresses[0]?.emailAddress || "",
      }}
      projects={projects}
    />
  )
}
