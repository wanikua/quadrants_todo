/**
 * Text embeddings for the project knowledge base (RAG).
 * All vectors are 1024-dim so they fit the `vector(1024)` column in schema.ts.
 *
 * Provider order:
 *   1. DashScope `text-embedding-v3` (QWEN_API_KEY) — native 1024 dims
 *   2. OpenAI `text-embedding-3-small` (OPENAI_API_KEY) — reduced to 1024 dims
 */

export const EMBEDDING_DIMENSIONS = 1024

const DASHSCOPE_URL = "https://dashscope-intl.aliyuncs.com/compatible-mode/v1/embeddings"
const OPENAI_URL = "https://api.openai.com/v1/embeddings"

// DashScope text-embedding-v3 accepts up to 10 inputs per request.
const BATCH_SIZE = 10

export function embeddingsConfigured(): boolean {
  return Boolean(process.env.QWEN_API_KEY || process.env.OPENAI_API_KEY)
}

/** Embed many texts, preserving input order. Returns one 1024-dim vector each. */
export async function embedTexts(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return []

  const QWEN = process.env.QWEN_API_KEY
  const OPENAI = process.env.OPENAI_API_KEY

  if (QWEN) {
    return batched(texts, (batch) => embedWithDashScope(batch, QWEN))
  }
  if (OPENAI) {
    return batched(texts, (batch) => embedWithOpenAI(batch, OPENAI))
  }
  throw new Error("No embedding provider configured. Set QWEN_API_KEY or OPENAI_API_KEY.")
}

/** Embed a single query string. */
export async function embedQuery(text: string): Promise<number[]> {
  const [vec] = await embedTexts([text])
  return vec
}

async function batched(
  texts: string[],
  fn: (batch: string[]) => Promise<number[][]>
): Promise<number[][]> {
  const out: number[][] = []
  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE)
    const vectors = await fn(batch)
    out.push(...vectors)
  }
  return out
}

async function embedWithDashScope(texts: string[], apiKey: string): Promise<number[][]> {
  const res = await fetch(DASHSCOPE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "text-embedding-v3",
      input: texts,
      dimensions: EMBEDDING_DIMENSIONS,
      encoding_format: "float",
    }),
  })
  if (!res.ok) {
    throw new Error(`DashScope embeddings error: ${res.status} ${await res.text()}`)
  }
  const data = await res.json()
  return orderEmbeddings(data, texts.length)
}

async function embedWithOpenAI(texts: string[], apiKey: string): Promise<number[][]> {
  const res = await fetch(OPENAI_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "text-embedding-3-small",
      input: texts,
      dimensions: EMBEDDING_DIMENSIONS,
    }),
  })
  if (!res.ok) {
    throw new Error(`OpenAI embeddings error: ${res.status} ${await res.text()}`)
  }
  const data = await res.json()
  return orderEmbeddings(data, texts.length)
}

/** Both providers use the OpenAI response shape: { data: [{ index, embedding }] }. */
function orderEmbeddings(data: any, expected: number): number[][] {
  const items: Array<{ index: number; embedding: number[] }> = data?.data ?? []
  if (items.length !== expected) {
    throw new Error(`Embedding count mismatch: expected ${expected}, got ${items.length}`)
  }
  return items
    .slice()
    .sort((a, b) => a.index - b.index)
    .map((it) => it.embedding)
}
