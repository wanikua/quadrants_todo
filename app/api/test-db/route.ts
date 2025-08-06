import { NextResponse } from "next/server"
import { sql } from "@/app/db"

export async function GET() {
  try {
    if (!sql) {
      return NextResponse.json({ 
        success: false, 
        error: "Database not configured. Please set DATABASE_URL environment variable." 
      })
    }

    // Test the connection with a simple query
    await sql`SELECT 1 as test`
    return NextResponse.json({ success: true, message: "Database connection successful" })
  } catch (error) {
    console.error("Database connection test failed:", error)
    return NextResponse.json({ 
      success: false, 
      error: "Database connection failed",
      details: error instanceof Error ? error.message : "Unknown error"
    })
  }
}
