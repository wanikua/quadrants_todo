import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET() {
  try {
    // Check projects table columns
    const columns = await sql`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'projects'
      ORDER BY ordinal_position
    `

    return NextResponse.json({
      table: 'projects',
      columns: columns
    })
  } catch (error) {
    console.error("Error checking schema:", error)
    return NextResponse.json({ error: "Failed to check schema" }, { status: 500 })
  }
}
