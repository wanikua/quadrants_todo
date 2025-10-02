import { NextResponse } from "next/server"
import { sql } from "@/lib/database"

export async function POST() {
  try {
    if (!sql) {
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 500 }
      )
    }

    // Add password_hash column if it doesn't exist
    await sql`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS password_hash TEXT
    `

    return NextResponse.json({
      success: true,
      message: "Password column migration completed successfully"
    })
  } catch (error: any) {
    console.error("Migration error:", error)
    return NextResponse.json(
      { error: error.message || "Migration failed" },
      { status: 500 }
    )
  }
}
