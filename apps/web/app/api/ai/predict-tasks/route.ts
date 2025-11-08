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
        // Silently use defaults
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

  // Silently check for API keys

  // Try Qwen first (preferred for cost and Chinese support)
  if (QWEN_API_KEY) {
    try {
      const result = await predictWithQwen(tasks, userPreferences, QWEN_API_KEY)
      console.log('✅ Qwen API 调用成功')
      return result
    } catch (error) {
      console.log('❌ Qwen API 失败，使用 fallback')
    }
  }

  // Try Claude as fallback
  if (ANTHROPIC_API_KEY) {
    try {
      return await predictWithClaude(tasks, userPreferences, ANTHROPIC_API_KEY)
    } catch (error) {
      // Silently fallback to heuristics
    }
  }

  // Final fallback: Use simple heuristics
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
    ? `\n注意：该用户历史偏好显示，他们通常将紧急度调整 ${userPreferences.avg_urgency_bias?.toFixed(0) || 0}%，重要度调整 ${userPreferences.avg_importance_bias?.toFixed(0) || 0}%。请参考这个偏好进行预测。`
    : ''

  const prompt = `你是一个专业的任务优先级分析助手，基于艾森豪威尔矩阵（Eisenhower Matrix）为用户分析任务的紧急度和重要度。

评分标准：
- 紧急度（0-100）：评估任务的时间敏感性
  * 90-100：立即处理，有明确的紧迫截止日期
  * 70-89：短期内需要完成，有时间压力
  * 50-69：中等时间敏感性
  * 30-49：可以稍后处理
  * 0-29：没有明确时间限制

- 重要度（0-100）：评估任务的战略价值和长期影响
  * 90-100：核心目标，对成功至关重要
  * 70-89：重要任务，有显著影响
  * 50-69：有价值但非关键
  * 30-49：次要任务
  * 0-29：可选或低价值任务

关键词识别：
- 高紧急度：紧急、立即、今天、现在、ASAP、马上、bug、故障、宕机
- 高重要度：关键、核心、必须、发布、上线、战略、重要
- 低紧急度：考虑、未来、有空、someday
- 低重要度：优化、美化、微调、可选
${userBias}

请分析以下任务列表，为每个任务预测紧急度和重要度（0-100），并提供简短的reasoning说明。

任务列表：
${tasks.map((task, i) => `${i + 1}. ${task}`).join('\n')}

只返回严格的JSON数组格式，不要添加任何解释文字：
[{"urgency": 80, "importance": 90, "reasoning": "简短说明"}, ...]`

  // Use international endpoint for better global access
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
      temperature: 0.9,
      top_p: 0.8
    })
  })

  if (!response.ok) {
    throw new Error(`Qwen API error: ${response.status}`)
  }

  const data = await response.json()

  // Check for API errors (compatible mode uses OpenAI format)
  if (data.error) {
    throw new Error('Qwen API error')
  }

  const content = data.choices[0].message.content

  // Parse JSON response
  let predictions: TaskPrediction[]
  try {
    // Try to extract JSON if there's extra text
    const jsonMatch = content.match(/\[[\s\S]*\]/)
    const jsonStr = jsonMatch ? jsonMatch[0] : content
    predictions = JSON.parse(jsonStr)
  } catch (parseError) {
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

  // Parse JSON response
  let predictions: TaskPrediction[]
  try {
    predictions = JSON.parse(content)
  } catch (parseError) {
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
