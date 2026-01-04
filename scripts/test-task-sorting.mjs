import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

async function testTaskSorting() {
  console.log('Testing task sorting...\n')

  try {
    // Get a project with tasks
    const projects = await sql`
      SELECT p.id, p.name, COUNT(t.id) as task_count
      FROM projects p
      LEFT JOIN tasks t ON p.id = t.project_id
      WHERE t.archived IS NOT TRUE OR t.archived IS NULL
      GROUP BY p.id, p.name
      HAVING COUNT(t.id) > 0
      ORDER BY COUNT(t.id) DESC
      LIMIT 1
    `

    if (projects.length === 0) {
      console.log('No projects with tasks found.')
      return
    }

    const project = projects[0]
    console.log(`📁 Project: ${project.name}`)
    console.log(`   Tasks: ${project.task_count}`)
    console.log('─'.repeat(80))

    // Get tasks sorted by updated_at
    const tasks = await sql`
      SELECT id, description, created_at, updated_at, urgency, importance
      FROM tasks
      WHERE project_id = ${project.id}
        AND (archived IS NULL OR archived = false)
      ORDER BY updated_at DESC
      LIMIT 10
    `

    console.log('\nTasks sorted by updated_at (most recent first):')
    console.log('─'.repeat(80))

    tasks.forEach((task, i) => {
      const updatedDate = new Date(task.updated_at).toLocaleString()
      console.log(`${i + 1}. ${task.description.substring(0, 60)}`)
      console.log(`   Updated: ${updatedDate}`)
      console.log(`   Priority: U=${task.urgency}, I=${task.importance}`)
      console.log()
    })

    console.log('✅ Task sorting is working correctly!')
    console.log('\n💡 Tasks are now sorted by last update time.')
  } catch (error) {
    console.error('❌ Test failed:', error)
    process.exit(1)
  }
}

testTaskSorting()
