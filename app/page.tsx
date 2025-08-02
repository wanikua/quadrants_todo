import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { AuthPage } from "@/components/auth-page"

export default async function HomePage() {
  const { userId } = await auth()

  if (userId) {
    redirect("/projects")
  }

  return <AuthPage />
}
