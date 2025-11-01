import { sql } from "../lib/database"

async function main() {
  if (!sql) {
    console.error("❌ Database not configured")
    process.exit(1)
  }

  // Get example projects
  const exampleProjects = await sql`
    SELECT id, name, owner_id
    FROM projects
    WHERE name = 'Welcome to Quadrant Manager! 👋'
    LIMIT 1
  `

  if (exampleProjects.length === 0) {
    console.log("No example projects found")
    process.exit(0)
  }

  const project = exampleProjects[0]
  console.log(`\n📋 Checking project: ${project.name}`)
  console.log(`   Project ID: ${project.id}`)

  // Check tasks
  const tasks = await sql`
    SELECT id, description, urgency, importance
    FROM tasks
    WHERE project_id = ${project.id}
  `

  console.log(`\n✅ Tasks found: ${tasks.length}`)
  tasks.forEach((task, i) => {
    console.log(`   ${i + 1}. ${task.description}`)
    console.log(`      U: ${task.urgency}, I: ${task.importance}`)
  })

  // Check players
  const players = await sql`
    SELECT id, name, color, user_id
    FROM players
    WHERE project_id = ${project.id}
  `

  console.log(`\n👥 Players found: ${players.length}`)
  players.forEach((player, i) => {
    console.log(`   ${i + 1}. ${player.name} (${player.color}) - User: ${player.user_id || 'N/A'}`)
  })

  // Check task assignments
  const assignments = await sql`
    SELECT ta.task_id, ta.player_id, t.description, p.name
    FROM task_assignments ta
    JOIN tasks t ON ta.task_id = t.id
    JOIN players p ON ta.player_id = p.id
    WHERE t.project_id = ${project.id}
  `

  console.log(`\n🔗 Task assignments found: ${assignments.length}`)
  assignments.forEach((a, i) => {
    console.log(`   ${i + 1}. ${a.name} assigned to: ${a.description.substring(0, 50)}...`)
  })

  process.exit(0)
}

main()
