import { NextRequest, NextResponse } from 'next/server'

/**
 * Webhook endpoint for Clawdbot → Quadrants events
 * Receives notifications from Clawdbot (e.g., task reminders acknowledged, 
 * natural language task creation requests)
 * 
 * Authenticated via X-API-Key header
 */
export async function POST(request: NextRequest) {
  try {
    const apiKey = request.headers.get('X-API-Key')
    const serviceKey = process.env.QUADRANTS_SERVICE_KEY

    if (!serviceKey || apiKey !== serviceKey) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { event, data } = body

    switch (event) {
      case 'reminder.acknowledged':
        // User acknowledged a task reminder via Clawdbot
        console.log(`[Webhook] Reminder acknowledged for task ${data.taskId}`)
        break

      case 'task.created_via_chat':
        // Task was created through Clawdbot chat
        console.log(`[Webhook] Task created via chat: ${data.description}`)
        break

      case 'ping':
        return NextResponse.json({ pong: true, timestamp: new Date().toISOString() })

      default:
        console.log(`[Webhook] Unknown event: ${event}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
