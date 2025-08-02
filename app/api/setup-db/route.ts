import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

// Check if DATABASE_URL is available
const DATABASE_URL = process.env.DATABASE_URL

let sql: any = null

if (DATABASE_URL) {
  try {
    sql = neon(DATABASE_URL)
  } catch (error) {
    console.error("Failed to initialize database connection:", error)
  }
}

export async function POST(request: NextRequest) {
  if (!sql) {
    return NextResponse.json({ success: false, error: "Database not configured" }, { status: 500 })
  }

  try {
    console.log("Setting up database tables...")

    // Create players table
    await sql`
      CREATE TABLE IF NOT EXISTS players (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        color VARCHAR(7) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    // Create tasks table
    await sql`
      CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        description TEXT NOT NULL,
        urgency INTEGER NOT NULL CHECK (urgency >= 0 AND urgency <= 100),
        importance INTEGER NOT NULL CHECK (importance >= 0 AND importance <= 100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    // Create task_assignments table
    await sql`
      CREATE TABLE IF NOT EXISTS task_assignments (
        id SERIAL PRIMARY KEY,
        task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
        player_id INTEGER REFERENCES players(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(task_id, player_id)
      )
    `

    // Create task_comments table
    await sql`
      CREATE TABLE IF NOT EXISTS task_comments (
        id SERIAL PRIMARY KEY,
        task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        author_name VARCHAR(255) NOT NULL DEFAULT 'Anonymous',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    // Create indexes for better performance
    await sql`CREATE INDEX IF NOT EXISTS idx_task_assignments_task_id ON task_assignments(task_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_task_assignments_player_id ON task_assignments(player_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_task_comments_task_id ON task_comments(task_id)`

    console.log("Database tables created successfully")

    return NextResponse.json({ success: true, message: "Database setup completed" })
  } catch (error) {
    console.error("Database setup error:", error)
    return NextResponse.json({ success: false, error: "Failed to setup database" }, { status: 500 })
  }
}
