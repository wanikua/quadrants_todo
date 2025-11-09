import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET() {
  if (!sql) {
    return NextResponse.json({
      success: false,
      message: "Database not configured",
    })
  }

  try {
    // Check for required tables
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `

    const tableNames = tables.map((t: { table_name: string }) => t.table_name)
    const requiredTables = ["users", "projects", "project_members", "tasks", "players"]
    const missingTables = requiredTables.filter((t) => !tableNames.includes(t))

    // Check users table structure
    const usersColumns = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users'
      ORDER BY ordinal_position
    `

    const hasPasswordHash = usersColumns.some((c: { column_name: string; data_type: string }) => c.column_name === "password_hash")
    const hasName = usersColumns.some((c: { column_name: string; data_type: string }) => c.column_name === "name")

    if (missingTables.length > 0) {
      return NextResponse.json({
        success: false,
        message: `Missing tables: ${missingTables.join(", ")}`,
        tables: tableNames,
        missingTables,
      })
    }

    if (!hasPasswordHash || !hasName) {
      return NextResponse.json({
        success: false,
        message: "Users table needs migration",
        tables: tableNames,
        details: `Missing columns: ${!hasPasswordHash ? "password_hash " : ""}${!hasName ? "name" : ""}`,
      })
    }

    return NextResponse.json({
      success: true,
      message: `Found ${tableNames.length} tables`,
      tables: tableNames,
      usersColumns: usersColumns.map((c: { column_name: string; data_type: string }) => c.column_name),
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: "Schema check failed",
      error: error instanceof Error ? error.message : String(error),
    })
  }
}
