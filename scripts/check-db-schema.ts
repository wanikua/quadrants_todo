import { neon } from '@neondatabase/serverless'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.join(process.cwd(), '.env.local') })

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL not found')
  process.exit(1)
}

const sql = neon(process.env.DATABASE_URL)

async function checkSchema() {
  console.log('\n📊 Checking Database Schema...\n')

  try {
    // Check all tables
    const tables = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `
    console.log('📋 Tables:', tables.map(t => t.table_name).join(', '))

    // Check users table
    console.log('\n👤 Users Table:')
    const usersColumns = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'users'
      ORDER BY ordinal_position
    `
    if (usersColumns.length > 0) {
      usersColumns.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'} ${col.column_default || ''}`)
      })
    } else {
      console.log('  ⚠️  Users table not found')
    }

    // Check projects table
    console.log('\n📁 Projects Table:')
    const projectsColumns = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'projects'
      ORDER BY ordinal_position
    `
    projectsColumns.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type}`)
    })

    // Check players table
    console.log('\n🎮 Players Table:')
    const playersColumns = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'players'
      ORDER BY ordinal_position
    `
    playersColumns.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type}`)
    })

    // Check project_members table
    console.log('\n👥 Project Members Table:')
    const membersColumns = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'project_members'
      ORDER BY ordinal_position
    `
    membersColumns.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type}`)
    })

    // Check sample data
    console.log('\n📊 Sample Data:')
    const projectCount = await sql`SELECT COUNT(*) as count FROM projects`
    const playerCount = await sql`SELECT COUNT(*) as count FROM players`
    const memberCount = await sql`SELECT COUNT(*) as count FROM project_members`

    console.log(`  - Projects: ${projectCount[0].count}`)
    console.log(`  - Players: ${playerCount[0].count}`)
    console.log(`  - Project Members: ${memberCount[0].count}`)

    // Check for orphaned players (players without matching project members)
    console.log('\n🔍 Data Integrity Check:')
    const orphanedPlayers = await sql`
      SELECT p.id, p.user_id, p.project_id, p.name
      FROM players p
      LEFT JOIN project_members pm ON p.project_id = pm.project_id AND p.user_id = pm.user_id
      WHERE pm.id IS NULL
      LIMIT 5
    `
    if (orphanedPlayers.length > 0) {
      console.log('  ⚠️  Found orphaned players (not in project_members):')
      orphanedPlayers.forEach(p => {
        console.log(`    - Player ${p.id}: user_id=${p.user_id}, project=${p.project_id}`)
      })
    } else {
      console.log('  ✅ All players have matching project members')
    }

    console.log('\n✅ Schema check complete!\n')
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

checkSchema()
