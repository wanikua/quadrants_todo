import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export async function GET() {
  try {
    // Check if users table exists
    const tableCheck = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'users'
      )
    `

    const tableExists = tableCheck[0]?.exists

    if (!tableExists) {
      return NextResponse.json({
        success: false,
        message: 'Users table does not exist',
        tableExists: false
      })
    }

    // Check table structure
    const columns = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'users'
      ORDER BY ordinal_position
    `

    // Try to get count of users
    const countResult = await sql`SELECT COUNT(*) as count FROM users`
    const userCount = countResult[0]?.count

    return NextResponse.json({
      success: true,
      tableExists: true,
      columns,
      userCount
    })
  } catch (error) {
    console.error('Error checking users table:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
