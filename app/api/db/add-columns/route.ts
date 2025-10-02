import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function POST() {
  try {
    // Add missing columns to projects table (one at a time for compatibility)
    try {
      await sql`ALTER TABLE projects ADD COLUMN IF NOT EXISTS description TEXT`
    } catch (e) {
      console.log("Description column might already exist")
    }

    try {
      await sql`ALTER TABLE projects ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()`
    } catch (e) {
      console.log("Updated_at column might already exist")
    }

    return NextResponse.json({
      success: true,
      message: "Columns added successfully"
    })
  } catch (error) {
    console.error("Error adding columns:", error)
    return NextResponse.json({
      error: "Failed to add columns",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
