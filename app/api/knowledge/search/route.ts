import { NextRequest, NextResponse } from "next/server"
export const dynamic = "force-dynamic"
import { requireAuth } from "@/lib/auth"
import { getUserProjectAccess } from "@/app/db/actions"
import { db } from "@/app/db"
import { knowledgeChunks, knowledgeDocuments } from "@/app/db/schema"
import { and, eq, desc, gt, sql, cosineDistance } from "drizzle-orm"
import { embedQuery, embeddingsConfigured } from "@/lib/embeddings"

interface SourceChunk {
  documentId: number
  title: string
  chunkIndex: number
  content: string
  similarity: number
}

/**
 * POST /api/knowledge/search
 * Semantic retrieval over a project's knowledge base, with an optional
 * AI-synthesized answer that cites the retrieved chunks.
 * Body: { projectId, query, topK?, answer? }
 */
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
    const { projectId, query, topK = 6, answer = true } = body as {
      projectId: string
      query: string
      topK?: number
      answer?: boolean
    }

    if (!projectId || !query?.trim()) {
      return NextResponse.json({ error: "projectId and query are required" }, { status: 400 })
    }
    if (!(await getUserProjectAccess(user.id, projectId))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const queryEmbedding = await embedQuery(query.trim())
    const similarity = sql<number>`1 - (${cosineDistance(knowledgeChunks.embedding, queryEmbedding)})`

    const rows = await db
      .select({
        documentId: knowledgeChunks.document_id,
        title: knowledgeDocuments.title,
        chunkIndex: knowledgeChunks.chunk_index,
        content: knowledgeChunks.content,
        similarity,
      })
      .from(knowledgeChunks)
      .innerJoin(knowledgeDocuments, eq(knowledgeChunks.document_id, knowledgeDocuments.id))
      .where(and(eq(knowledgeChunks.project_id, projectId), gt(similarity, 0.15)))
      .orderBy(desc(similarity))
      .limit(Math.min(Math.max(topK, 1), 12))

    const sources: SourceChunk[] = rows.map((r: any) => ({
      documentId: r.documentId,
      title: r.title,
      chunkIndex: r.chunkIndex,
      content: r.content,
      similarity: Number(r.similarity),
    }))

    let synthesizedAnswer: string | null = null
    if (answer && sources.length > 0) {
      synthesizedAnswer = await synthesizeAnswer(query.trim(), sources)
    }

    return NextResponse.json({ answer: synthesizedAnswer, sources })
  } catch (error) {
    console.error("Knowledge search error:", error)
    return NextResponse.json({ error: "Search failed" }, { status: 500 })
  }
}

/** Answer the query grounded in retrieved chunks, citing them as [1], [2], … */
async function synthesizeAnswer(query: string, sources: SourceChunk[]): Promise<string | null> {
  const context = sources
    .map((s, i) => `[${i + 1}] (${s.title})\n${s.content}`)
    .join("\n\n")

  const prompt = `You are a project assistant. Answer the question using ONLY the context below. Cite sources inline as [1], [2], etc. If the answer isn't in the context, say you don't have that information.

Context:
${context}

Question: ${query}

Answer:`

  const QWEN = process.env.QWEN_API_KEY
  const ANTHROPIC = process.env.ANTHROPIC_API_KEY

  try {
    if (QWEN) {
      const res = await fetch("https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${QWEN}` },
        body: JSON.stringify({
          model: "qwen-plus",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.3,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        return data.choices?.[0]?.message?.content ?? null
      }
    }
    if (ANTHROPIC) {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": ANTHROPIC,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1024,
          messages: [{ role: "user", content: prompt }],
        }),
      })
      if (res.ok) {
        const data = await res.json()
        return data.content?.[0]?.text ?? null
      }
    }
  } catch (error) {
    console.error("Answer synthesis error:", error)
  }
  // No chat model available — return null; the caller still shows the sources.
  return null
}
