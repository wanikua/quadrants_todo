import { NextRequest, NextResponse } from "next/server"
export const dynamic = "force-dynamic"
import { requireAuth } from "@/lib/auth"
import { getUserProjectAccess } from "@/app/db/actions"
import { db } from "@/app/db"
import { knowledgeDocuments } from "@/app/db/schema"
import { eq } from "drizzle-orm"

// DELETE /api/knowledge/documents/[id] — remove a document (chunks cascade)
export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if (!db) return NextResponse.json({ error: "Database not configured" }, { status: 503 })

    const { id } = await params
    const documentId = Number(id)
    if (!Number.isFinite(documentId)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 })
    }

    const [doc] = await db
      .select({ project_id: knowledgeDocuments.project_id })
      .from(knowledgeDocuments)
      .where(eq(knowledgeDocuments.id, documentId))

    if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 })
    if (!(await getUserProjectAccess(user.id, doc.project_id))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    await db.delete(knowledgeDocuments).where(eq(knowledgeDocuments.id, documentId))
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Knowledge delete error:", error)
    return NextResponse.json({ error: "Failed to delete document" }, { status: 500 })
  }
}
