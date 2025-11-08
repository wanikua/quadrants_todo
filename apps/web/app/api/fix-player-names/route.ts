import { type NextRequest, NextResponse } from "next/server"
import { fixPlayerNames } from "@/app/db/actions"

export async function POST(request: NextRequest) {
  try {
    const result = await fixPlayerNames()

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: `Updated ${result.updatedCount} player name(s)`,
      updatedCount: result.updatedCount
    })
  } catch (error) {
    console.error("Error fixing player names:", error)
    return NextResponse.json({ error: "Failed to fix player names" }, { status: 500 })
  }
}
