import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

/**
 * AI Chat endpoint for the embedded Quadrants chat widget
 * Authenticated via Clerk (user must be signed in)
 * Takes natural language → calls Quadrants Service API internally
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Please sign in to use the chat' }, { status: 401 })
    }

    const { message, projectId } = await request.json()
    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message required' }, { status: 400 })
    }

    // Get user's projects for context
    const projects = await sql`
      SELECT DISTINCT p.id, p.name, p.type
      FROM projects p
      LEFT JOIN project_members pm ON p.id = pm.project_id
      WHERE (p.owner_id = ${userId} OR pm.user_id = ${userId})
        AND (p.archived = false OR p.archived IS NULL)
      ORDER BY p.created_at DESC
      LIMIT 5
    `

    // Get priority tasks for context
    const topTasks = await sql`
      SELECT t.id, t.description, t.urgency, t.importance, p.name as project_name
      FROM tasks t
      INNER JOIN projects p ON t.project_id = p.id
      WHERE (p.owner_id = ${userId} OR EXISTS (
        SELECT 1 FROM project_members pm WHERE pm.project_id = p.id AND pm.user_id = ${userId}
      ))
      AND (t.archived = false OR t.archived IS NULL)
      ORDER BY (t.urgency + t.importance) DESC
      LIMIT 10
    `

    // Determine target project
    const targetProject = projectId 
      ? projects.find((p: any) => p.id === projectId) || projects[0]
      : projects[0]

    // Build AI prompt
    const systemPrompt = `You are Quadrants AI, a task management assistant. You help users manage tasks on the Eisenhower Matrix (urgency × importance, both 0-100).

User's projects: ${projects.map((p: any) => `${p.name} (${p.id})`).join(', ')}
Current project: ${targetProject?.name || 'None'} (${targetProject?.id || 'N/A'})

Current top tasks:
${topTasks.map((t: any, i: number) => `${i+1}. [${t.id}] "${t.description}" (U:${t.urgency} I:${t.importance}) - ${t.project_name}`).join('\n')}

IMPORTANT: You can execute actions by including a JSON block in your response. The system will parse and execute it.

Available actions (include in \`\`\`json block):
- {"action":"create","projectId":"...","description":"...","urgency":80,"importance":70}
- {"action":"complete","taskId":123}
- {"action":"delete","taskId":123}
- {"action":"update","taskId":123,"updates":{"urgency":90}}

For queries (listing tasks, overview), just answer naturally based on the context above.

Rules:
- Be concise. Use Chinese if the user writes in Chinese.
- When creating tasks, infer urgency/importance from context.
- Always confirm what you did.`

    const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY
    const QWEN_API_KEY = process.env.QWEN_API_KEY

    let reply = ''

    // Try Qwen first (cheaper)
    if (QWEN_API_KEY) {
      try {
        const res = await fetch('https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${QWEN_API_KEY}` },
          body: JSON.stringify({
            model: 'qwen-plus',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: message }
            ],
            temperature: 0.7,
            max_tokens: 1024
          })
        })
        if (res.ok) {
          const data = await res.json()
          reply = data.choices?.[0]?.message?.content || ''
        }
      } catch { /* fallback */ }
    }

    // Fallback to Claude
    if (!reply && ANTHROPIC_API_KEY) {
      try {
        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 1024,
            system: systemPrompt,
            messages: [{ role: 'user', content: message }]
          })
        })
        if (res.ok) {
          const data = await res.json()
          reply = data.content?.[0]?.text || ''
        }
      } catch { /* fallback */ }
    }

    if (!reply) {
      reply = '抱歉，AI 服务暂时不可用。请稍后再试。'
    }

    // Parse and execute any action blocks in the reply
    const actionMatch = reply.match(/```json\s*(\{[\s\S]*?\})\s*```/)
    let actionResult = null

    if (actionMatch) {
      try {
        const action = JSON.parse(actionMatch[1])
        
        if (action.action === 'create' && action.projectId && action.description) {
          const [task] = await sql`
            INSERT INTO tasks (project_id, description, urgency, importance, created_at)
            VALUES (${action.projectId}, ${action.description}, ${action.urgency || 50}, ${action.importance || 50}, NOW())
            RETURNING id, description, urgency, importance
          `
          actionResult = { type: 'created', task }
        } else if (action.action === 'complete' && action.taskId) {
          await sql`UPDATE tasks SET archived = true WHERE id = ${action.taskId}`
          actionResult = { type: 'completed', taskId: action.taskId }
        } else if (action.action === 'delete' && action.taskId) {
          await sql`DELETE FROM task_assignments WHERE task_id = ${action.taskId}`
          await sql`DELETE FROM tasks WHERE id = ${action.taskId}`
          actionResult = { type: 'deleted', taskId: action.taskId }
        } else if (action.action === 'update' && action.taskId && action.updates) {
          await sql`
            UPDATE tasks SET
              description = COALESCE(${action.updates.description ?? null}, description),
              urgency = COALESCE(${action.updates.urgency ?? null}, urgency),
              importance = COALESCE(${action.updates.importance ?? null}, importance)
            WHERE id = ${action.taskId}
          `
          actionResult = { type: 'updated', taskId: action.taskId }
        }
      } catch { /* action parsing failed, ignore */ }

      // Clean the JSON block from the reply shown to user
      reply = reply.replace(/```json\s*\{[\s\S]*?\}\s*```/g, '').trim()
    }

    return NextResponse.json({ 
      reply, 
      action: actionResult,
      projectId: targetProject?.id 
    })
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json({ error: 'Chat service error' }, { status: 500 })
  }
}
