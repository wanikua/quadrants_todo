import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/app/db'
import { comments } from '@/app/db/schema'
import { getUserId } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId()
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await request.json()
    const { taskId, content, authorName } = body

    if (!taskId || !content || !authorName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Create comment
    const [comment] = await db.insert(comments).values({
      task_id: taskId,
      content,
      author_name: authorName,
    }).returning()

    return NextResponse.json(comment)
  } catch (error) {
    console.error('Create comment error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create comment' },
      { status: 500 }
    )
  }
}
