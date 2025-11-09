import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET() {
  if (!sql) {
    return NextResponse.json(
      {
        success: false,
        error: "Database not configured. Add DATABASE_URL to environment variables.",
      },
      { status: 500 },
    )
  }

  try {
    // Check if column already exists
    const columnCheck = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'password_hash'
    `

    if (columnCheck.length > 0) {
      return NextResponse.json({
        success: true,
        message: "password_hash column already exists",
        alreadyExists: true,
      })
    }

    // Add password_hash column
    await sql`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS password_hash TEXT
    `

    // Check if name column exists
    const nameCheck = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'name'
    `

    if (nameCheck.length === 0) {
      // Add name column
      await sql`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS name TEXT
      `

      // Populate name from email for existing users
      await sql`
        UPDATE users 
        SET name = SPLIT_PART(email, '@', 1) 
        WHERE name IS NULL
      `
    }

    return NextResponse.json({
      success: true,
      message: "Migration completed successfully",
      columns: ["password_hash", "name"],
    })
  } catch (error) {
    console.error("Migration error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
