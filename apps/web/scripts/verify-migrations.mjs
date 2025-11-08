#!/usr/bin/env node

import { neon } from '@neondatabase/serverless'
import dotenv from 'dotenv'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: join(__dirname, '..', '.env.local') })

async function verify() {
  const sql = neon(process.env.DATABASE_URL)

  console.log('🔍 Verifying database schema...\n')

  // Check projects table for description column
  const projectsColumns = await sql`
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_name = 'projects'
    ORDER BY ordinal_position
  `

  console.log('📋 Projects table columns:')
  projectsColumns.forEach(col => {
    const indicator = col.column_name === 'description' ? '✅' : '  '
    console.log(`${indicator} ${col.column_name} (${col.data_type})`)
  })

  // Check if user_activity table exists
  const tables = await sql`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'user_activity'
  `

  console.log('\n📋 User Activity table:')
  if (tables.length > 0) {
    console.log('✅ user_activity table exists')

    const activityColumns = await sql`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'user_activity'
      ORDER BY ordinal_position
    `

    console.log('\n   Columns:')
    activityColumns.forEach(col => {
      console.log(`   - ${col.column_name} (${col.data_type})`)
    })

    // Check indexes
    const indexes = await sql`
      SELECT indexname
      FROM pg_indexes
      WHERE tablename = 'user_activity'
    `

    console.log('\n   Indexes:')
    indexes.forEach(idx => {
      console.log(`   ✅ ${idx.indexname}`)
    })
  } else {
    console.log('❌ user_activity table not found')
  }

  console.log('\n🎉 Verification complete!')
}

verify().catch(console.error)
