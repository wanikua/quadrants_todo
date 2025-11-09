import { redirect } from "next/navigation"
import { requireAuth } from "@/lib/auth"
import { DashboardClient } from "@/components/dashboard-client"

export default async function DashboardPage() {
  const user = await requireAuth()

  if (!user) {
    redirect("/auth/signin")
  }

  return <DashboardClient user={user} />
}
