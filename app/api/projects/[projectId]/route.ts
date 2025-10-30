import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { getCurrentUser } from "@/lib/auth"

const sql = process.env.DATABASE_URL ? neon(process.env.DATABASE_URL) : null as any

export async function PATCH(request: Request, { params }: { params: Promise<{ projectId: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { projectId } = await params
    const body = await request.json()
    const { name, description, archived } = body

    // Update project using template literals
    let result

    if (name !== undefined && description !== undefined && archived !== undefined) {
      result = await sql`
        UPDATE projects
        SET name = ${name}, description = ${description}, archived = ${archived}, updated_at = NOW()
        WHERE id = ${projectId} AND owner_id = ${user.id}
        RETURNING *
      `
    } else if (name !== undefined && description !== undefined) {
      result = await sql`
        UPDATE projects
        SET name = ${name}, description = ${description}, updated_at = NOW()
        WHERE id = ${projectId} AND owner_id = ${user.id}
        RETURNING *
      `
    } else if (name !== undefined && archived !== undefined) {
      result = await sql`
        UPDATE projects
        SET name = ${name}, archived = ${archived}, updated_at = NOW()
        WHERE id = ${projectId} AND owner_id = ${user.id}
        RETURNING *
      `
    } else if (description !== undefined && archived !== undefined) {
      result = await sql`
        UPDATE projects
        SET description = ${description}, archived = ${archived}, updated_at = NOW()
        WHERE id = ${projectId} AND owner_id = ${user.id}
        RETURNING *
      `
    } else if (name !== undefined) {
      result = await sql`
        UPDATE projects
        SET name = ${name}, updated_at = NOW()
        WHERE id = ${projectId} AND owner_id = ${user.id}
        RETURNING *
      `
    } else if (description !== undefined) {
      result = await sql`
        UPDATE projects
        SET description = ${description}, updated_at = NOW()
        WHERE id = ${projectId} AND owner_id = ${user.id}
        RETURNING *
      `
    } else if (archived !== undefined) {
      result = await sql`
        UPDATE projects
        SET archived = ${archived}, updated_at = NOW()
        WHERE id = ${projectId} AND owner_id = ${user.id}
        RETURNING *
      `
    } else {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 })
    }

    if (result.length === 0) {
      return NextResponse.json({ error: "Project not found or unauthorized" }, { status: 404 })
    }

    return NextResponse.json(result[0])
  } catch (error) {
    console.error("Error updating project:", error)
    return NextResponse.json({ error: "Failed to update project" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ projectId: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { projectId } = await params

    await sql`
      DELETE FROM projects
      WHERE id = ${projectId} AND owner_id = ${user.id}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting project:", error)
    return NextResponse.json({ error: "Failed to delete project" }, { status: 500 })
  }
}
