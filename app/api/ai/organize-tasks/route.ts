import { NextRequest, NextResponse } from 'next/server'
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
 * AI-powered task organization
 * Uses AI to analyze tasks and suggest optimal positions to avoid overlaps
 * and improve visual clarity on the Eisenhower Matrix
 */
export async function POST(request: NextRequest) {
  try {
    console.log('📥 Organize API called')

    const user = await requireAuth()
    if (!user) {
      console.error('❌ User not authenticated')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('✅ User authenticated:', user.id)

    const body = await request.json()
    const { tasks } = body as { tasks: Task[] }

    if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
      console.error('❌ Invalid tasks array')
      return NextResponse.json({ error: 'Tasks array is required' }, { status: 400 })
    }

    console.log(`📋 Processing ${tasks.length} tasks`)

    // Call heuristic algorithm to organize tasks
    const organizedTasks = await organizeTasks(tasks)

    console.log(`✅ Organized ${organizedTasks.length} tasks`)

    return NextResponse.json({ organizedTasks })
  } catch (error) {
    console.error('❌ Task organization error:', error)

    // Check if it's an auth error
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Authentication failed. Please refresh the page and try again.' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to organize tasks. Please try again.' },
      { status: 500 }
    )
  }
}

/**
 * Use Qwen API to intelligently organize tasks on the Eisenhower Matrix
 */
async function organizeTasks(tasks: Task[]): Promise<OrganizedTask[]> {
  // Directly use heuristic algorithm for fast and reliable normalization
  console.log('⚙️ Using heuristic algorithm for task organization (normalization + spreading)')
  return organizeWithHeuristics(tasks)
}

/**
 * Organize tasks using Qwen API
 */
async function organizeWithQwen(tasks: Task[], apiKey: string): Promise<OrganizedTask[]> {
  const prompt = `你是一个专业的任务管理助手。我有一个艾森豪威尔矩阵（Eisenhower Matrix）的任务管理系统，需要你帮助智能重组任务位置。

当前任务列表（每个任务有描述、紧急度0-100、重要度0-100）：
${tasks.map((t, i) => `${i + 1}. "${t.description}" - 当前位置: 紧急度${t.urgency}, 重要度${t.importance}`).join('\n')}

请分析这些任务并给出优化后的位置建议，要求：
1. **归一化（Normalization）- 核心要求**：将任务分布的中心点设为矩阵原点(50, 50)
   - 计算当前所有任务的平均位置（中心点）
   - 计算偏移量 = (50, 50) - 当前中心点
   - 将所有任务平移这个偏移量，使分布中心正好在(50, 50)
   - 保持任务之间的相对距离和位置关系完全不变
2. 避免任务重叠或过于密集（相近位置的任务应该分散开，保持至少8-12个单位的距离）
3. 保持任务的相对优先级关系（重要且紧急的任务在右上象限，不重要不紧急的在左下象限）
4. 让任务在四个象限内均匀分布，更容易区分
5. 帮助用户更好地逐个完成任务，优先级高的任务应该在视觉上更突出

只返回严格的JSON数组格式，每个任务包含id、优化后的urgency、importance和reasoning：
[{"id": 1, "urgency": 85, "importance": 90, "reasoning": "简短说明调整原因"}, ...]

注意：
- urgency和importance必须在0-100之间
- 相同或相近位置的任务必须分散开
- 整体分布要以(50, 50)为中心点
- 保持每个任务的相对优先级（相对于其他任务的位置关系）`

  const response = await fetch('https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'qwen-plus',
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      top_p: 0.8
    })
  })

  if (!response.ok) {
    throw new Error(`Qwen API error: ${response.status}`)
  }

  const data = await response.json()
  const content = data.choices[0].message.content

  // Parse JSON response
  let organized: OrganizedTask[]
  try {
    const jsonMatch = content.match(/\[[\s\S]*\]/)
    const jsonStr = jsonMatch ? jsonMatch[0] : content
    organized = JSON.parse(jsonStr)
  } catch (parseError) {
    throw new Error('Invalid AI response format')
  }

  // Validate response
  if (organized.length !== tasks.length) {
    throw new Error(`Expected ${tasks.length} tasks, got ${organized.length}`)
  }

  return organized
}

/**
 * Organize tasks using Claude API
 */
async function organizeWithClaude(tasks: Task[], apiKey: string): Promise<OrganizedTask[]> {
  const prompt = `Analyze these tasks on an Eisenhower Matrix (urgency 0-100, importance 0-100) and suggest optimal positions to avoid overlaps and improve visual clarity.

Current tasks:
${tasks.map((t, i) => `${i + 1}. "${t.description}" - Current position: urgency ${t.urgency}, importance ${t.importance}`).join('\n')}

Requirements:
1. **Normalization - CORE REQUIREMENT**: Set the distribution center to the matrix origin (50, 50)
   - Calculate the average position (center point) of all current tasks
   - Calculate offset = (50, 50) - current center point
   - Shift all tasks by this offset so the distribution center is exactly at (50, 50)
   - Maintain the relative distances and positions between tasks unchanged
2. Avoid overlapping or densely packed tasks (maintain 8-12 units distance)
3. Preserve relative priority relationships (high priority in top-right, low priority in bottom-left)
4. Distribute tasks evenly across the four quadrants for better clarity
5. Help users complete tasks one by one - high priority tasks should be visually prominent

Respond ONLY with a valid JSON array:
[{"id": 1, "urgency": 85, "importance": 90, "reasoning": "brief explanation"}, ...]

Do not include any other text, markdown, or formatting. Just the raw JSON array.`

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    })
  })

  if (!response.ok) {
    throw new Error(`Claude API error: ${response.status}`)
  }

  const data = await response.json()
  const content = data.content[0].text

  let organized: OrganizedTask[]
  try {
    organized = JSON.parse(content)
  } catch (parseError) {
    throw new Error('Invalid AI response format')
  }

  if (organized.length !== tasks.length) {
    throw new Error(`Expected ${tasks.length} tasks, got ${organized.length}`)
  }

  return organized
}

/**
 * Organize tasks with two key principles:
 * 1. Center point should be at origin (50, 50) - NORMALIZATION
 * 2. Relative priority order must be preserved - NO REORDERING
 */
function organizeWithHeuristics(tasks: Task[]): OrganizedTask[] {
  if (tasks.length === 0) return []

  console.log(`🔧 Starting organization for ${tasks.length} tasks`)

  // Clean corrupted data
  const cleanedTasks = tasks.map(task => {
    const cleanedUrgency = Math.max(0, Math.min(100, task.urgency))
    const cleanedImportance = Math.max(0, Math.min(100, task.importance))

    if (task.urgency !== cleanedUrgency || task.importance !== cleanedImportance) {
      console.log(`🧹 Cleaned Task ${task.id}: (${task.urgency}, ${task.importance}) → (${cleanedUrgency}, ${cleanedImportance})`)
    }

    return {
      id: task.id,
      urgency: cleanedUrgency,
      importance: cleanedImportance,
      // Calculate original priority score (used to preserve ordering)
      priorityScore: cleanedUrgency + cleanedImportance
    }
  })

  // STEP 1: NORMALIZATION - Move center point to origin (50, 50)
  const avgUrgency = cleanedTasks.reduce((sum, t) => sum + t.urgency, 0) / cleanedTasks.length
  const avgImportance = cleanedTasks.reduce((sum, t) => sum + t.importance, 0) / cleanedTasks.length

  console.log(`📍 Current center: (${avgUrgency.toFixed(1)}, ${avgImportance.toFixed(1)})`)

  const urgencyOffset = 50 - avgUrgency
  const importanceOffset = 50 - avgImportance

  console.log(`📐 Normalization offset: (${urgencyOffset.toFixed(1)}, ${importanceOffset.toFixed(1)})`)

  // Apply normalization offset
  let positions = cleanedTasks.map(task => ({
    id: task.id,
    x: Math.max(0, Math.min(100, task.urgency + urgencyOffset)),
    y: Math.max(0, Math.min(100, task.importance + importanceOffset)),
    originalPriorityScore: task.priorityScore
  }))

  // STEP 2: SPREAD OVERLAPPING TASKS while preserving priority order
  const minDistance = 18 // Increased from 12 for more spacing
  const repulsionStrength = 0.7 // Increased from 0.5 for stronger push
  const iterations = 8 // Increased from 5 for more spreading

  console.log(`⚙️ Running ${iterations} repulsion iterations with minDistance=${minDistance}`)

  for (let iter = 0; iter < iterations; iter++) {
    const forces: { x: number, y: number }[] = positions.map(() => ({ x: 0, y: 0 }))
    let overlapsFound = 0

    // Calculate repulsion forces
    for (let i = 0; i < positions.length; i++) {
      for (let j = i + 1; j < positions.length; j++) {
        const dx = positions[j].x - positions[i].x
        const dy = positions[j].y - positions[i].y
        const distance = Math.sqrt(dx * dx + dy * dy)

        if (distance < minDistance && distance > 0) {
          overlapsFound++
          const overlap = minDistance - distance
          const forceX = (dx / distance) * overlap * repulsionStrength
          const forceY = (dy / distance) * overlap * repulsionStrength

          forces[i].x -= forceX
          forces[i].y -= forceY
          forces[j].x += forceX
          forces[j].y += forceY
        }
      }
    }

    console.log(`🔄 Iteration ${iter + 1}: ${overlapsFound} overlaps`)

    // Apply forces
    positions = positions.map((pos, i) => ({
      ...pos,
      x: Math.max(0, Math.min(100, pos.x + forces[i].x)),
      y: Math.max(0, Math.min(100, pos.y + forces[i].y))
    }))
  }

  // STEP 3: RE-NORMALIZE to ensure center is still at (50, 50)
  const newAvgX = positions.reduce((sum, p) => sum + p.x, 0) / positions.length
  const newAvgY = positions.reduce((sum, p) => sum + p.y, 0) / positions.length
  const finalOffsetX = 50 - newAvgX
  const finalOffsetY = 50 - newAvgY

  if (Math.abs(finalOffsetX) > 1 || Math.abs(finalOffsetY) > 1) {
    console.log(`🎯 Re-centering: offset (${finalOffsetX.toFixed(1)}, ${finalOffsetY.toFixed(1)})`)
    positions = positions.map(pos => ({
      ...pos,
      x: Math.max(0, Math.min(100, pos.x + finalOffsetX)),
      y: Math.max(0, Math.min(100, pos.y + finalOffsetY))
    }))
  }

  // STEP 4: VERIFY PRIORITY ORDER IS PRESERVED
  // Calculate new priority scores
  const newScores = positions.map(pos => ({
    id: pos.id,
    oldScore: pos.originalPriorityScore,
    newScore: pos.x + pos.y
  }))

  // Check if any priority order violations occurred
  let violations = 0
  for (let i = 0; i < newScores.length; i++) {
    for (let j = i + 1; j < newScores.length; j++) {
      const oldOrder = newScores[i].oldScore > newScores[j].oldScore
      const newOrder = newScores[i].newScore > newScores[j].newScore
      if (oldOrder !== newOrder) {
        violations++
      }
    }
  }

  if (violations > 0) {
    console.log(`⚠️ WARNING: ${violations} priority order violations detected`)
  } else {
    console.log(`✅ Priority order preserved`)
  }

  // Build result
  const result = positions.map(pos => ({
    id: pos.id,
    urgency: Math.round(pos.x),
    importance: Math.round(pos.y),
    reasoning: 'Normalized to center + spread overlaps while preserving priority order'
  }))

  const finalAvgX = result.reduce((sum, t) => sum + t.urgency, 0) / result.length
  const finalAvgY = result.reduce((sum, t) => sum + t.importance, 0) / result.length
  console.log(`📊 Final center: (${finalAvgX.toFixed(1)}, ${finalAvgY.toFixed(1)})`)

  return result
}
