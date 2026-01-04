import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

async function testSorting() {
  console.log('Testing project sorting...\n')

  try {
    // Get all projects with updated_at
    const projects = await sql`
      SELECT id, name, created_at, updated_at
      FROM projects
      ORDER BY updated_at DESC NULLS LAST, created_at DESC
      LIMIT 10
    `

    console.log('Projects sorted by updated_at (most recent first):')
    console.log('─'.repeat(80))
    projects.forEach((p, i) => {
      console.log(`${i + 1}. ${p.name}`)
      console.log(`   ID: ${p.id}`)
      console.log(`   Created: ${p.created_at}`)
      console.log(`   Updated: ${p.updated_at}`)
      console.log()
    })

    if (projects.length === 0) {
      console.log('No projects found.')
    } else {
      console.log('✅ Sorting is working correctly!')
    }
  } catch (error) {
    console.error('❌ Test failed:', error)
    process.exit(1)
  }
}

testSorting()
