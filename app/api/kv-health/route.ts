// app/api/kv-health/route.ts
import { NextResponse } from "next/server"
import { getKV, kvPing } from "@/lib/kv"

export async function GET() {
  const kv = getKV()
  if (!kv) {
    return NextResponse.json(
      {
        success: false,
        configured: false,
        message: "Upstash KV not configured. Set KV_REST_API_URL and KV_REST_API_TOKEN.",
      },
      { status: 500 },
    )
  }

  try {
    const { ok, pong, error } = await kvPing()
    if (!ok) {
      return NextResponse.json({ success: false, ping: pong, error: error ?? "Unknown KV error" }, { status: 500 })
    }

    // Simple R/W smoke test with short TTL
    const key = "kv:healthcheck"
    const ts = Date.now()
    await kv.set(key, ts, { ex: 30 })
    const value = await kv.get<number>(key)

    return NextResponse.json({
      success: true,
      ping: pong,
      wrote: ts,
      read: value ?? null,
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: "KV health check failed" }, { status: 500 })
  }
}
