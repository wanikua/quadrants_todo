import { redirect } from "next/navigation"
import { sql } from "@/lib/database"

export default async function DevTestPage() {
  // Development only - bypass auth
  if (process.env.NODE_ENV !== 'development') {
    redirect('/sign-in')
  }

  if (!sql) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Development Test Mode</h1>
          <p className="text-red-600 mb-4">Database not configured</p>
          <p className="text-sm text-muted-foreground">This page is only available in development mode.</p>
          <a href="/sign-in" className="text-blue-600 hover:underline mt-4 block">Go to Sign In</a>
        </div>
      </div>
    )
  }

  try {
    // Get or create a test user
    const testUser = await sql`
      INSERT INTO users (id, email, name, created_at)
      VALUES ('dev-test-user', 'test@dev.local', 'Dev Test User', NOW())
      ON CONFLICT (id) DO UPDATE SET name = 'Dev Test User'
      RETURNING *
    `

    // Get user's projects
    const projects = await sql`
      SELECT
        p.*,
        u.name as owner_name,
        CASE
          WHEN p.owner_id = 'dev-test-user' THEN true
          ELSE false
        END as is_owner
      FROM projects p
      LEFT JOIN users u ON p.owner_id = u.id
      WHERE p.owner_id = 'dev-test-user'
         OR EXISTS (
           SELECT 1 FROM project_members pm
           WHERE pm.project_id = p.id AND pm.user_id = 'dev-test-user'
         )
      ORDER BY p.created_at DESC
    `

    // If no projects, create a test project
    if (projects.length === 0) {
      await sql`
        INSERT INTO projects (name, type, owner_id, created_at)
        VALUES ('Test Project', 'personal', 'dev-test-user', NOW())
      `

      // Get the created project
      const newProjects = await sql`
        SELECT * FROM projects WHERE owner_id = 'dev-test-user' ORDER BY created_at DESC LIMIT 1
      `

      if (newProjects[0]) {
        redirect(`/projects/${newProjects[0].id}`)
      }
    } else {
      // Redirect to first project
      redirect(`/projects/${projects[0].id}`)
    }
  } catch (error) {
    console.error('Dev test error:', error)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Development Test Mode</h1>
          <p className="text-red-600 mb-4">Error: {error instanceof Error ? error.message : 'Unknown error'}</p>
          <p className="text-sm text-muted-foreground">This page is only available in development mode.</p>
          <a href="/sign-in" className="text-blue-600 hover:underline mt-4 block">Go to Sign In</a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Redirecting...</h1>
        <p className="text-sm text-muted-foreground">Setting up test environment</p>
      </div>
    </div>
  )
}
