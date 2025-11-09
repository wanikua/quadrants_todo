import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET() {
  if (!sql) {
    return NextResponse.json({
      success: false,
      message: "DATABASE_URL not configured",
      error: "Missing DATABASE_URL environment variable",
    })
  }

  try {
    // Test basic connection
    const result = await sql`SELECT NOW() as current_time, version() as pg_version`

    return NextResponse.json({
      success: true,
      message: "Connected to Neon PostgreSQL",
      timestamp: result[0].current_time,
      version: result[0].pg_version,
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: "Database connection failed",
      error: error instanceof Error ? error.message : String(error),
    })
  }
}
