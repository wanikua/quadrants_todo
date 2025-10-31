import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { db } from '@/app/db'
import { userTaskPreferences, taskPredictions } from '@/app/db/schema'
import { eq } from 'drizzle-orm'

interface TaskPrediction {
  description: string
  urgency: number
  importance: number
  reasoning?: string
}

/**
 * AI-powered task priority prediction
 * Uses Claude API to analyze task descriptions and predict urgency/importance
 * Learns from user's historical adjustments for personalization
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { tasks, projectId } = body as { tasks: string[]; projectId: string }

    if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
      return NextResponse.json({ error: 'Tasks array is required' }, { status: 400 })
    }

    // Get user's historical preferences if available
    let userPreferences: any = null
    if (db) {
      try {
        const [prefs] = await db
          .select()
          .from(userTaskPreferences)
          .where(eq(userTaskPreferences.user_id, user.id))
        userPreferences = prefs
      } catch (error) {
        console.log('No user preferences found, using defaults')
      }
    }

    // Call AI prediction
    const predictions = await predictTaskPriorities(tasks, userPreferences)

    return NextResponse.json(predictions)
  } catch (error) {
    console.error('Task prediction error:', error)
    return NextResponse.json(
      { error: 'Failed to predict task priorities' },
      { status: 500 }
    )
  }
}

/**
 * Predict task priorities using Qwen API (阿里云通义千问)
 * Falls back to Claude API if Qwen is not configured
 * Falls back to heuristics if no AI API is available
 */
async function predictTaskPriorities(
  tasks: string[],
  userPreferences: any | null
): Promise<TaskPrediction[]> {
  const QWEN_API_KEY = process.env.QWEN_API_KEY
  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY

  // Try Qwen first (preferred for cost and Chinese support)
  if (QWEN_API_KEY) {
    try {
      return await predictWithQwen(tasks, userPreferences, QWEN_API_KEY)
    } catch (error) {
      console.error('Qwen API error, falling back:', error)
    }
  }

  // Try Claude as fallback
  if (ANTHROPIC_API_KEY) {
    try {
      return await predictWithClaude(tasks, userPreferences, ANTHROPIC_API_KEY)
    } catch (error) {
      console.error('Claude API error, falling back:', error)
    }
  }

  // Final fallback: Use simple heuristics
  console.warn('No AI API configured, using heuristic predictions')
  return tasks.map(task => predictWithHeuristics(task, userPreferences))
}

/**
 * Predict using Qwen API (阿里云通义千问)
 */
async function predictWithQwen(
  tasks: string[],
  userPreferences: any | null,
  apiKey: string
): Promise<TaskPrediction[]> {
  const userBias = userPreferences
    ? `注意：该用户通常将紧急度调整 ${userPreferences.avg_urgency_bias?.toFixed(0) || 0}%，重要度调整 ${userPreferences.avg_importance_bias?.toFixed(0) || 0}%。`
    : ''

  const prompt = `分析这些任务并预测它们的紧急度（0-100）和重要度（0-100）。

紧急度：任务有多紧迫？是否有截止日期或时间压力？
重要度：任务对目标有多关键？长期影响如何？

${userBias}

任务列表：
${tasks.map((task, i) => `${i + 1}. ${task}`).join('\n')}

只返回有效的JSON数组，格式如下：
[{"urgency": 80, "importance": 90, "reasoning": "简短说明"}, ...]

不要包含其他文本、markdown或格式。只返回纯JSON数组。`

  const response = await fetch('https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'qwen-plus', // qwen-turbo (fastest/cheapest), qwen-plus (balanced), qwen-max (best)
      input: {
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      },
      parameters: {
        result_format: 'message',
        temperature: 0.3 // Lower temperature for more consistent predictions
      }
    })
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Qwen API error: ${response.status} - ${errorText}`)
  }

  const data = await response.json()

  // Check for API errors
  if (data.code) {
    throw new Error(`Qwen API error: ${data.code} - ${data.message}`)
  }

  const content = data.output.choices[0].message.content

  // Parse JSON response
  let predictions: TaskPrediction[]
  try {
    // Try to extract JSON if there's extra text
    const jsonMatch = content.match(/\[[\s\S]*\]/)
    const jsonStr = jsonMatch ? jsonMatch[0] : content
    predictions = JSON.parse(jsonStr)
  } catch (parseError) {
    console.error('Failed to parse Qwen response:', content)
    throw new Error('Invalid AI response format')
  }

  // Apply user bias if available
  if (userPreferences && (userPreferences.avg_urgency_bias || userPreferences.avg_importance_bias)) {
    predictions = predictions.map(pred => ({
      ...pred,
      urgency: Math.max(0, Math.min(100, pred.urgency + (userPreferences.avg_urgency_bias || 0))),
      importance: Math.max(0, Math.min(100, pred.importance + (userPreferences.avg_importance_bias || 0)))
    }))
  }

  // Ensure we have predictions for all tasks
  if (predictions.length !== tasks.length) {
    throw new Error(`Expected ${tasks.length} predictions, got ${predictions.length}`)
  }

  return predictions.map((pred, i) => ({
    description: tasks[i],
    urgency: Math.round(pred.urgency),
    importance: Math.round(pred.importance),
    reasoning: pred.reasoning
  }))
}

/**
 * Predict using Claude API (Anthropic)
 */
async function predictWithClaude(
  tasks: string[],
  userPreferences: any | null,
  apiKey: string
): Promise<TaskPrediction[]> {
  const userBias = userPreferences
    ? `Note: This user tends to adjust urgency by ${userPreferences.avg_urgency_bias?.toFixed(0) || 0}% and importance by ${userPreferences.avg_importance_bias?.toFixed(0) || 0}%.`
    : ''

  const prompt = `Analyze these tasks and predict their urgency (0-100) and importance (0-100) levels.

Urgency: How time-sensitive is this task? Does it have a deadline or time pressure?
Importance: How critical is this task to goals and success? What's its long-term impact?

${userBias}

Tasks:
${tasks.map((task, i) => `${i + 1}. ${task}`).join('\n')}

Respond ONLY with a valid JSON array in this exact format:
[{"urgency": 80, "importance": 90, "reasoning": "brief explanation"}, ...]

Do not include any other text, markdown, or formatting. Just the raw JSON array.`

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
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

  // Parse JSON response
  let predictions: TaskPrediction[]
  try {
    predictions = JSON.parse(content)
  } catch (parseError) {
    console.error('Failed to parse Claude response:', content)
    throw new Error('Invalid AI response format')
  }

  // Apply user bias if available
  if (userPreferences && (userPreferences.avg_urgency_bias || userPreferences.avg_importance_bias)) {
    predictions = predictions.map(pred => ({
      ...pred,
      urgency: Math.max(0, Math.min(100, pred.urgency + (userPreferences.avg_urgency_bias || 0))),
      importance: Math.max(0, Math.min(100, pred.importance + (userPreferences.avg_importance_bias || 0)))
    }))
  }

  // Ensure we have predictions for all tasks
  if (predictions.length !== tasks.length) {
    throw new Error(`Expected ${tasks.length} predictions, got ${predictions.length}`)
  }

  return predictions.map((pred, i) => ({
    description: tasks[i],
    urgency: Math.round(pred.urgency),
    importance: Math.round(pred.importance),
    reasoning: pred.reasoning
  }))
}

/**
 * Fallback heuristic-based prediction
 * Uses keyword matching when AI is not available
 */
function predictWithHeuristics(task: string, userPreferences: any | null): TaskPrediction {
  const lowerTask = task.toLowerCase()

  // Default values
  let urgency = 50
  let importance = 50

  // Urgency keywords
  const urgentKeywords = ['urgent', 'asap', 'immediately', 'today', 'now', 'emergency', 'critical', 'deadline', 'tomorrow']
  const highUrgencyKeywords = ['bug', 'fix', 'broken', 'error', 'issue', 'crash', 'down']
  const lowUrgencyKeywords = ['someday', 'eventually', 'consider', 'maybe', 'nice to have']

  // Importance keywords
  const highImportanceKeywords = ['important', 'critical', 'essential', 'must', 'required', 'key', 'vital', 'crucial', 'deploy', 'release', 'launch']
  const mediumImportanceKeywords = ['review', 'update', 'improve', 'optimize', 'refactor']
  const lowImportanceKeywords = ['minor', 'trivial', 'cosmetic', 'cleanup', 'typo']

  // Calculate urgency
  if (urgentKeywords.some(kw => lowerTask.includes(kw))) {
    urgency = 85
  } else if (highUrgencyKeywords.some(kw => lowerTask.includes(kw))) {
    urgency = 70
  } else if (lowUrgencyKeywords.some(kw => lowerTask.includes(kw))) {
    urgency = 25
  }

  // Calculate importance
  if (highImportanceKeywords.some(kw => lowerTask.includes(kw))) {
    importance = 85
  } else if (mediumImportanceKeywords.some(kw => lowerTask.includes(kw))) {
    importance = 60
  } else if (lowImportanceKeywords.some(kw => lowerTask.includes(kw))) {
    importance = 30
  }

  // Apply user bias
  if (userPreferences) {
    urgency = Math.max(0, Math.min(100, urgency + (userPreferences.avg_urgency_bias || 0)))
    importance = Math.max(0, Math.min(100, importance + (userPreferences.avg_importance_bias || 0)))
  }

  return {
    description: task,
    urgency: Math.round(urgency),
    importance: Math.round(importance),
    reasoning: 'Predicted using keyword heuristics'
  }
}
