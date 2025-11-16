import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/app/db'
import { players } from '@/app/db/schema'
import { getUserId } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId()
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await request.json()
    const { projectId, name, color } = body

    if (!projectId || !name || !color) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Create player
    const [player] = await db.insert(players).values({
      project_id: projectId,
      user_id: userId,
      name,
      color,
    }).returning()

    return NextResponse.json(player)
  } catch (error) {
    console.error('Create player error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create player' },
      { status: 500 }
    )
  }
}
