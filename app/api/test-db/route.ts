import { testConnection } from "@/lib/database"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const isConnected = await testConnection()
    return NextResponse.json({ success: isConnected })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Connection failed" })
  }
}
