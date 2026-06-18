/**
 * Split text into overlapping chunks for embedding.
 * Splits on paragraph/sentence boundaries where possible, accumulating up to
 * ~maxChars per chunk with a trailing overlap carried into the next chunk so
 * context isn't lost at boundaries.
 */
export function chunkText(
  text: string,
  { maxChars = 1000, overlap = 150 }: { maxChars?: number; overlap?: number } = {}
): string[] {
  const clean = text.replace(/\r\n/g, "\n").trim()
  if (!clean) return []
  if (clean.length <= maxChars) return [clean]

  // Prefer paragraph boundaries, then sentence/line, then hard slices.
  const paragraphs = clean.split(/\n\s*\n/).flatMap((p) => {
    const trimmed = p.trim()
    if (!trimmed) return []
    if (trimmed.length <= maxChars) return [trimmed]
    // Long paragraph — break on sentence enders / newlines.
    return splitLong(trimmed, maxChars)
  })

  const chunks: string[] = []
  let current = ""

  for (const part of paragraphs) {
    if (!current) {
      current = part
    } else if (current.length + 2 + part.length <= maxChars) {
      current += "\n\n" + part
    } else {
      chunks.push(current)
      const tail = overlap > 0 ? current.slice(-overlap) : ""
      current = tail ? tail + "\n\n" + part : part
    }
  }
  if (current.trim()) chunks.push(current)

  return chunks
}

/** Break an over-long block on sentence/line boundaries, hard-slicing as a last resort. */
function splitLong(block: string, maxChars: number): string[] {
  const pieces = block.split(/(?<=[.!?。！？\n])\s+/)
  const out: string[] = []
  let buf = ""
  for (const piece of pieces) {
    if (piece.length > maxChars) {
      if (buf) {
        out.push(buf)
        buf = ""
      }
      for (let i = 0; i < piece.length; i += maxChars) {
        out.push(piece.slice(i, i + maxChars))
      }
      continue
    }
    if (!buf) buf = piece
    else if (buf.length + 1 + piece.length <= maxChars) buf += " " + piece
    else {
      out.push(buf)
      buf = piece
    }
  }
  if (buf) out.push(buf)
  return out
}
