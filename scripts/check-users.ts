import { sql } from "../lib/database"

async function main() {
  if (!sql) {
    console.error("❌ Database not configured")
    process.exit(1)
  }

  const users = await sql`SELECT COUNT(*) as count FROM users`
  const exampleProjects = await sql`SELECT COUNT(*) as count FROM projects WHERE name = 'Welcome to Quadrant Manager! 👋'`
  const allProjects = await sql`SELECT COUNT(*) as count FROM projects`

  console.log('📊 Current Status:')
  console.log('Total users:', users[0].count)
  console.log('All projects:', allProjects[0].count)
  console.log('Example projects:', exampleProjects[0].count)

  // Get users without any projects
  const usersWithoutProjects = await sql`
    SELECT u.id, u.name, u.email
    FROM users u
    WHERE u.id NOT IN (
      SELECT DISTINCT owner_id FROM projects
    )
  `

  console.log('\n👤 Users without any projects:', usersWithoutProjects.length)
  if (usersWithoutProjects.length > 0) {
    usersWithoutProjects.forEach(u => {
      console.log(`  - ${u.name || u.email} (${u.id})`)
    })
  }

  process.exit(0)
}

main()
