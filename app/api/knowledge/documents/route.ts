import { NextRequest, NextResponse } from "next/server"
export const dynamic = "force-dynamic"
import { requireAuth } from "@/lib/auth"
import { getUserProjectAccess } from "@/app/db/actions"
import { db } from "@/app/db"
import { knowledgeDocuments, knowledgeChunks } from "@/app/db/schema"
import { eq, desc } from "drizzle-orm"
import { chunkText } from "@/lib/chunk"
import { embedTexts, embeddingsConfigured } from "@/lib/embeddings"

// GET /api/knowledge/documents?projectId=...  — list a project's documents
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if (!db) return NextResponse.json({ error: "Database not configured" }, { status: 503 })

    const projectId = request.nextUrl.searchParams.get("projectId")
    if (!projectId) return NextResponse.json({ error: "projectId is required" }, { status: 400 })

    if (!(await getUserProjectAccess(user.id, projectId))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const documents = await db
      .select({
        id: knowledgeDocuments.id,
        title: knowledgeDocuments.title,
        source_type: knowledgeDocuments.source_type,
        filename: knowledgeDocuments.filename,
        status: knowledgeDocuments.status,
        char_count: knowledgeDocuments.char_count,
        chunk_count: knowledgeDocuments.chunk_count,
        created_at: knowledgeDocuments.created_at,
      })
      .from(knowledgeDocuments)
      .where(eq(knowledgeDocuments.project_id, projectId))
      .orderBy(desc(knowledgeDocuments.created_at))

    return NextResponse.json({ documents })
  } catch (error) {
    console.error("Knowledge list error:", error)
    return NextResponse.json({ error: "Failed to load documents" }, { status: 500 })
  }
}

// POST /api/knowledge/documents — ingest a document (chunk + embed + store)
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if (!db) return NextResponse.json({ error: "Database not configured" }, { status: 503 })

    if (!embeddingsConfigured()) {
      return NextResponse.json(
        { error: "Embeddings not configured. Set QWEN_API_KEY or OPENAI_API_KEY." },
        { status: 503 }
      )
    }

    const body = await request.json()
    const { projectId, title, content, sourceType, filename } = body as {
      projectId: string
      title: string
      content: string
      sourceType?: "text" | "file"
      filename?: string
    }

    if (!projectId || !content?.trim()) {
      return NextResponse.json({ error: "projectId and content are required" }, { status: 400 })
    }
    if (!(await getUserProjectAccess(user.id, projectId))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const text = content.trim()
    const chunks = chunkText(text)
    if (chunks.length === 0) {
      return NextResponse.json({ error: "No text content to index" }, { status: 400 })
    }

    // Create the document row first (so a failure leaves a visible 'error' doc).
    const [doc] = await db
      .insert(knowledgeDocuments)
      .values({
        project_id: projectId,
        title: (title?.trim() || filename || "Untitled").slice(0, 200),
        source_type: sourceType === "file" ? "file" : "text",
        filename: filename || null,
        status: "processing",
        char_count: text.length,
        chunk_count: chunks.length,
        created_by: user.id,
      })
      .returning({ id: knowledgeDocuments.id })

    try {
      const embeddings = await embedTexts(chunks)
      await db.insert(knowledgeChunks).values(
        chunks.map((chunkContent, i) => ({
          document_id: doc.id,
          project_id: projectId,
          chunk_index: i,
          content: chunkContent,
          embedding: embeddings[i],
        }))
      )
      await db
        .update(knowledgeDocuments)
        .set({ status: "ready", updated_at: new Date() })
        .where(eq(knowledgeDocuments.id, doc.id))
    } catch (embedError) {
      console.error("Embedding/index error:", embedError)
      await db
        .update(knowledgeDocuments)
        .set({ status: "error", updated_at: new Date() })
        .where(eq(knowledgeDocuments.id, doc.id))
      return NextResponse.json({ error: "Failed to index document" }, { status: 500 })
    }

    return NextResponse.json({ id: doc.id, chunkCount: chunks.length, status: "ready" })
  } catch (error) {
    console.error("Knowledge ingest error:", error)
    return NextResponse.json({ error: "Failed to add document" }, { status: 500 })
  }
}
