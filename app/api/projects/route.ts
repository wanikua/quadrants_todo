import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getUserId } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, type = 'personal' } = body

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    // Insert with actual table columns
    const result = await sql`
      INSERT INTO projects (id, owner_id, name, type, created_at)
      VALUES (gen_random_uuid()::text, ${userId}, ${name}, ${type}, NOW())
      RETURNING *
    `

    return NextResponse.json(result[0])
  } catch (error) {
    console.error("Error creating project:", error)
    return NextResponse.json({ error: "Failed to create project" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const projects = await sql`
      SELECT * FROM projects WHERE owner_id = ${userId} ORDER BY created_at DESC
    `

    return NextResponse.json(projects)
  } catch (error) {
    console.error("Error fetching projects:", error)
    return NextResponse.json({ error: "Failed to fetch projects" }, { status: 500 })
  }
}
