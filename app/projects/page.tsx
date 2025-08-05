import { auth, currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { ProjectsPage } from "@/components/projects-page"
import { DatabaseConfigWarning } from "@/components/database-config-warning"
import { getProjectsForUser } from "@/app/db/actions"

export default async function Projects() {
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
  } catch (error) {
    console.error("Failed to load projects:", error)
    return <DatabaseConfigWarning />
  }
}
