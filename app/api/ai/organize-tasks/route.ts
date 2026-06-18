import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { requireAuth } from '@/lib/auth'

interface Task {
  id: number
  description: string
  urgency: number
  importance: number
}

interface OrganizedTask {
  id: number
  urgency: number
  importance: number
  reasoning?: string
}

/**
 * AI Re-prioritize
 * Re-reads every task's description and re-predicts its urgency & importance,
 * so the whole board re-sorts into the correct Eisenhower quadrants.
 * Provider order: Qwen (preferred) → Claude (fallback) → keyword heuristics.
 * The client keeps the same { organizedTasks } contract and shows a preview
 * (Accept / Revert) before persisting.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { tasks } = body as { tasks: Task[] }

    if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
      return NextResponse.json({ error: 'Tasks array is required' }, { status: 400 })
    }

    const organizedTasks = await reprioritizeTasks(tasks)

    return NextResponse.json({ organizedTasks })
  } catch (error) {
    console.error('❌ Task re-prioritization error:', error)
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Authentication failed. Please refresh the page and try again.' },
        { status: 401 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to re-prioritize tasks. Please try again.' },
      { status: 500 }
    )
  }
}

async function reprioritizeTasks(tasks: Task[]): Promise<OrganizedTask[]> {
  const QWEN_API_KEY = process.env.QWEN_API_KEY
  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY

  if (QWEN_API_KEY) {
    try {
      return await reprioritizeWithQwen(tasks, QWEN_API_KEY)
    } catch (error) {
      console.log('❌ Qwen re-prioritize failed, falling back', error)
    }
  }

  if (ANTHROPIC_API_KEY) {
    try {
      return await reprioritizeWithClaude(tasks, ANTHROPIC_API_KEY)
    } catch (error) {
      console.log('❌ Claude re-prioritize failed, falling back to heuristics', error)
    }
  }

  return tasks.map(reprioritizeWithHeuristics)
}

const SCORING_RUBRIC_ZH = `评分标准：
- 紧急度（0-100）：时间敏感性。90-100 立即处理/有紧迫截止日期；70-89 短期内需完成；50-69 中等；30-49 可稍后；0-29 无明确时间限制。
- 重要度（0-100）：战略价值与长期影响。90-100 核心目标；70-89 重要；50-69 有价值但非关键；30-49 次要；0-29 可选/低价值。
关键词：紧急/立即/今天/ASAP/bug/故障→高紧急；关键/核心/必须/发布/上线→高重要；考虑/未来/有空/someday→低紧急；优化/美化/微调→低重要。`

/** Re-predict urgency/importance for each task, returning results keyed by id. */
async function reprioritizeWithQwen(tasks: Task[], apiKey: string): Promise<OrganizedTask[]> {
  const prompt = `你是一个任务优先级分析助手，基于艾森豪威尔矩阵重新评估下列任务的紧急度和重要度。仅根据任务描述本身判断，不要被它当前的数值影响。

${SCORING_RUBRIC_ZH}

任务列表（含 id）：
${tasks.map((t) => `id=${t.id}: "${t.description}"`).join('\n')}

只返回严格的 JSON 数组，每项包含 id、urgency、importance 和简短 reasoning，不要输出其它文字：
[{"id": 1, "urgency": 80, "importance": 90, "reasoning": "简短说明"}, ...]`

  const response = await fetch('https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'qwen-plus',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      top_p: 0.8,
    }),
  })

  if (!response.ok) throw new Error(`Qwen API error: ${response.status}`)

  const data = await response.json()
  if (data.error) throw new Error('Qwen API error')
  return parseAndReconcile(data.choices[0].message.content, tasks)
}

async function reprioritizeWithClaude(tasks: Task[], apiKey: string): Promise<OrganizedTask[]> {
  const prompt = `Re-assess these tasks on an Eisenhower Matrix. Judge urgency (0-100) and importance (0-100) from each task's description alone — ignore its current values.

Urgency: how time-sensitive / deadline-driven the task is.
Importance: how critical it is to goals and long-term impact.

Tasks (with id):
${tasks.map((t) => `id=${t.id}: "${t.description}"`).join('\n')}

Respond ONLY with a raw JSON array, no markdown:
[{"id": 1, "urgency": 80, "importance": 90, "reasoning": "brief"}, ...]`

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!response.ok) throw new Error(`Claude API error: ${response.status}`)

  const data = await response.json()
  return parseAndReconcile(data.content[0].text, tasks)
}

/** Parse the model's JSON and guarantee one clamped result per input task. */
function parseAndReconcile(content: string, tasks: Task[]): OrganizedTask[] {
  let parsed: OrganizedTask[]
  try {
    const jsonMatch = content.match(/\[[\s\S]*\]/)
    parsed = JSON.parse(jsonMatch ? jsonMatch[0] : content)
  } catch {
    throw new Error('Invalid AI response format')
  }

  const byId = new Map<number, OrganizedTask>()
  for (const p of parsed) {
    if (typeof p?.id === 'number') byId.set(p.id, p)
  }

  // Always return exactly one entry per task; fall back to heuristics if the
  // model skipped one.
  return tasks.map((task) => {
    const p = byId.get(task.id)
    if (!p || typeof p.urgency !== 'number' || typeof p.importance !== 'number') {
      return reprioritizeWithHeuristics(task)
    }
    return {
      id: task.id,
      urgency: clamp(p.urgency),
      importance: clamp(p.importance),
      reasoning: p.reasoning,
    }
  })
}

function clamp(n: number) {
  return Math.max(0, Math.min(100, Math.round(n)))
}

/** Keyword-based fallback when no AI provider is configured/available. */
function reprioritizeWithHeuristics(task: Task): OrganizedTask {
  const lower = task.description.toLowerCase()
  let urgency = 50
  let importance = 50

  const urgent = ['urgent', 'asap', 'immediately', 'today', 'now', 'emergency', 'critical', 'deadline', 'tomorrow', '紧急', '立即', '今天', '马上']
  const highUrgency = ['bug', 'fix', 'broken', 'error', 'issue', 'crash', 'down', '故障', '修复', '宕机']
  const lowUrgency = ['someday', 'eventually', 'consider', 'maybe', 'nice to have', '考虑', '未来', '有空']

  const highImportance = ['important', 'critical', 'essential', 'must', 'required', 'key', 'vital', 'crucial', 'deploy', 'release', 'launch', '关键', '核心', '必须', '发布', '上线']
  const mediumImportance = ['review', 'update', 'improve', 'optimize', 'refactor', '审查', '更新', '优化']
  const lowImportance = ['minor', 'trivial', 'cosmetic', 'cleanup', 'typo', '微调', '美化', '清理']

  if (urgent.some((k) => lower.includes(k))) urgency = 85
  else if (highUrgency.some((k) => lower.includes(k))) urgency = 70
  else if (lowUrgency.some((k) => lower.includes(k))) urgency = 25

  if (highImportance.some((k) => lower.includes(k))) importance = 85
  else if (mediumImportance.some((k) => lower.includes(k))) importance = 60
  else if (lowImportance.some((k) => lower.includes(k))) importance = 30

  return {
    id: task.id,
    urgency,
    importance,
    reasoning: 'Re-prioritized using keyword heuristics',
  }
}
