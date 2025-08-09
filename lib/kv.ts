// lib/kv.ts
// Upstash Redis KV singleton client with safe initialization.

import { Redis } from "@upstash/redis"
import { isKvConfigured, env } from "@/lib/env"

let client: Redis | null = null

export function getKV(): Redis | null {
  if (!isKvConfigured()) return null
  if (!client) {
    client = new Redis({
      url: env.KV_REST_API_URL!,
      token: env.KV_REST_API_TOKEN!,
    })
  }
  return client
}

export async function kvPing(): Promise<{ ok: boolean; pong?: string; error?: string }> {
  const kv = getKV()
  if (!kv) return { ok: false, error: "Upstash KV not configured" }
  try {
    const pong = await kv.ping()
    return { ok: pong === "PONG", pong }
  } catch (err: any) {
    return { ok: false, error: err?.message || "KV ping failed" }
  }
}
