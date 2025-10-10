import { neon } from '@neondatabase/serverless'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.join(process.cwd(), '.env.local') })

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL not found')
  process.exit(1)
}

const sql = neon(process.env.DATABASE_URL)

async function fixMissingData() {
  console.log('\n🔧 Fixing missing members and players...\n')

  try {
    // Find projects without members
    const projectsWithoutMembers = await sql`
      SELECT p.id, p.owner_id, p.name, p.type
      FROM projects p
      LEFT JOIN project_members pm ON p.id = pm.project_id
      WHERE pm.id IS NULL
    `

    console.log(`Found ${projectsWithoutMembers.length} projects without members`)

    const colors = [
      '#ef4444', '#f97316', '#eab308', '#22c55e',
      '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'
    ]

    for (const project of projectsWithoutMembers) {
      console.log(`\nFixing project: ${project.name} (${project.id})`)

      // Add owner as member
      await sql`
        INSERT INTO project_members (id, project_id, user_id, role, joined_at)
        VALUES (
          gen_random_uuid()::text,
          ${project.id},
          ${project.owner_id},
          'owner',
          NOW()
        )
        ON CONFLICT DO NOTHING
      `
      console.log(`  ✅ Added owner as member`)

      // Add player for owner
      await sql`
        INSERT INTO players (project_id, user_id, name, color, created_at)
        VALUES (
          ${project.id},
          ${project.owner_id},
          'User ' || SUBSTRING(${project.owner_id}, 1, 8),
          ${colors[0]},
          NOW()
        )
        ON CONFLICT DO NOTHING
      `
      console.log(`  ✅ Added player for owner`)
    }

    console.log('\n✅ All projects fixed!\n')

    // Verify
    const stats = await sql`
      SELECT
        COUNT(*) as total_projects,
        COUNT(DISTINCT pm.project_id) as projects_with_members,
        COUNT(DISTINCT pl.project_id) as projects_with_players
      FROM projects p
      LEFT JOIN project_members pm ON p.id = pm.project_id
      LEFT JOIN players pl ON p.id = pl.project_id
    `

    console.log('📊 Final Stats:')
    console.log(`  Total projects: ${stats[0].total_projects}`)
    console.log(`  Projects with members: ${stats[0].projects_with_members}`)
    console.log(`  Projects with players: ${stats[0].projects_with_players}`)

  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

fixMissingData()
