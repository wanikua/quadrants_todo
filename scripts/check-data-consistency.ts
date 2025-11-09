import { neon } from '@neondatabase/serverless'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.join(process.cwd(), '.env.local') })

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL not found')
  process.exit(1)
}

const sql = neon(process.env.DATABASE_URL)

async function checkConsistency() {
  console.log('\n🔍 Checking Data Consistency...\n')

  try {
    // Check projects without members
    const projectsWithoutMembers = await sql`
      SELECT p.id, p.name, p.owner_id, p.created_at
      FROM projects p
      LEFT JOIN project_members pm ON p.id = pm.project_id
      WHERE pm.id IS NULL
      ORDER BY p.created_at DESC
    `

    console.log(`📁 Projects without members: ${projectsWithoutMembers.length}`)
    if (projectsWithoutMembers.length > 0) {
      console.log('  First 5:')
      projectsWithoutMembers.slice(0, 5).forEach(p => {
        console.log(`  - ${p.name} (${p.id}) owned by ${p.owner_id}`)
      })
    }

    // Check projects without players
    const projectsWithoutPlayers = await sql`
      SELECT p.id, p.name, p.owner_id, p.created_at
      FROM projects p
      LEFT JOIN players pl ON p.id = pl.project_id
      WHERE pl.id IS NULL
      ORDER BY p.created_at DESC
    `

    console.log(`\n🎮 Projects without players: ${projectsWithoutPlayers.length}`)
    if (projectsWithoutPlayers.length > 0) {
      console.log('  First 5:')
      projectsWithoutPlayers.slice(0, 5).forEach(p => {
        console.log(`  - ${p.name} (${p.id}) owned by ${p.owner_id}`)
      })
    }

    // Check all projects with their members and players count
    const projectStats = await sql`
      SELECT
        p.id,
        p.name,
        p.type,
        p.owner_id,
        COUNT(DISTINCT pm.id) as member_count,
        COUNT(DISTINCT pl.id) as player_count
      FROM projects p
      LEFT JOIN project_members pm ON p.id = pm.project_id
      LEFT JOIN players pl ON p.id = pl.project_id
      GROUP BY p.id, p.name, p.type, p.owner_id
      ORDER BY p.created_at DESC
      LIMIT 10
    `

    console.log('\n📊 Recent Projects Stats:')
    console.log('  ID | Name | Type | Members | Players')
    console.log('  ' + '-'.repeat(60))
    projectStats.forEach(p => {
      const shortId = p.id.substring(0, 8)
      const shortName = p.name.substring(0, 20).padEnd(20)
      console.log(`  ${shortId} | ${shortName} | ${p.type.padEnd(8)} | ${p.member_count} | ${p.player_count}`)
    })

    // Check user IDs format (Clerk vs UUID)
    const distinctOwners = await sql`
      SELECT DISTINCT owner_id, COUNT(*) as project_count
      FROM projects
      GROUP BY owner_id
    `

    console.log('\n👤 Owner ID Formats:')
    distinctOwners.forEach(o => {
      const format = o.owner_id.startsWith('user_') ? 'Clerk' :
                     o.owner_id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/) ? 'UUID' : 'Unknown'
      console.log(`  - ${o.owner_id.substring(0, 20)}... (${format}): ${o.project_count} projects`)
    })

    console.log('\n✅ Consistency check complete!\n')
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

checkConsistency()
