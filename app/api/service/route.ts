import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

/**
 * Service API for Clawdbot integration
 * Authenticated via X-API-Key header (QUADRANTS_SERVICE_KEY env var)
 * 
 * Actions:
 * - projects: List all projects for a user
 * - tasks: Get tasks for a project
 * - priority: Get top priority tasks across all projects
 * - create: Create a task
 * - bulk-create: Create multiple tasks
 * - complete: Complete (archive) a task
 * - update: Update a task
 * - delete: Delete a task
 * - overview: Get project overview with quadrant stats
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate via API key
    const apiKey = request.headers.get('X-API-Key')
    const serviceKey = process.env.QUADRANTS_SERVICE_KEY

    if (!serviceKey || apiKey !== serviceKey) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action, userId, projectId, taskId, description, urgency, importance, tasks: tasksList, updates } = body

    if (!action) {
      return NextResponse.json({ error: 'Action required' }, { status: 400 })
    }

    // Default userId - use the configured service user
    const uid = userId || process.env.QUADRANTS_SERVICE_USER_ID

    switch (action) {
      case 'projects': {
        const projects = await sql`
          SELECT DISTINCT p.id, p.name, p.description, p.type, p.created_at,
            (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id AND (t.archived = false OR t.archived IS NULL)) as task_count
          FROM projects p
          LEFT JOIN project_members pm ON p.id = pm.project_id
          WHERE p.owner_id = ${uid} OR pm.user_id = ${uid}
          ORDER BY p.created_at DESC
        `
        return NextResponse.json({ projects })
      }

      case 'tasks': {
        if (!projectId) {
          return NextResponse.json({ error: 'projectId required' }, { status: 400 })
        }
        const tasks = await sql`
          SELECT t.id, t.description, t.urgency, t.importance, t.created_at,
            COALESCE(
              json_agg(
                json_build_object('id', p.id, 'name', p.name, 'color', p.color)
              ) FILTER (WHERE p.id IS NOT NULL),
              '[]'
            ) as assignees
          FROM tasks t
          LEFT JOIN task_assignments ta ON t.id = ta.task_id
          LEFT JOIN players p ON ta.player_id = p.id
          WHERE t.project_id = ${projectId}
            AND (t.archived = false OR t.archived IS NULL)
          GROUP BY t.id
          ORDER BY (t.urgency + t.importance) DESC, t.created_at DESC
        `
        return NextResponse.json({ tasks })
      }

      case 'priority': {
        const priorityTasks = await sql`
          SELECT
            t.id, t.description, t.urgency, t.importance,
            (t.urgency + t.importance) as priority_score,
            t.project_id, p.name as project_name
          FROM tasks t
          INNER JOIN projects p ON t.project_id = p.id
          WHERE (p.owner_id = ${uid} OR EXISTS (
            SELECT 1 FROM project_members pm WHERE pm.project_id = p.id AND pm.user_id = ${uid}
          ))
          AND (t.archived = false OR t.archived IS NULL)
          AND (p.archived = false OR p.archived IS NULL)
          ORDER BY (t.urgency + t.importance) DESC, t.created_at DESC
          LIMIT 10
        `
        return NextResponse.json({ tasks: priorityTasks })
      }

      case 'create': {
        if (!projectId || !description) {
          return NextResponse.json({ error: 'projectId and description required' }, { status: 400 })
        }
        const [task] = await sql`
          INSERT INTO tasks (project_id, description, urgency, importance, created_at)
          VALUES (${projectId}, ${description}, ${urgency || 50}, ${importance || 50}, NOW())
          RETURNING id, description, urgency, importance
        `
        return NextResponse.json({ task })
      }

      case 'bulk-create': {
        if (!projectId || !tasksList || !Array.isArray(tasksList)) {
          return NextResponse.json({ error: 'projectId and tasks array required' }, { status: 400 })
        }
        const created = []
        for (const t of tasksList) {
          const [task] = await sql`
            INSERT INTO tasks (project_id, description, urgency, importance, created_at)
            VALUES (${projectId}, ${t.description}, ${t.urgency || 50}, ${t.importance || 50}, NOW())
            RETURNING id, description, urgency, importance
          `
          created.push(task)
        }
        return NextResponse.json({ created, count: created.length })
      }

      case 'complete': {
        if (!taskId) {
          return NextResponse.json({ error: 'taskId required' }, { status: 400 })
        }
        await sql`
          UPDATE tasks SET archived = true WHERE id = ${taskId}
        `
        return NextResponse.json({ success: true })
      }

      case 'update': {
        if (!taskId || !updates) {
          return NextResponse.json({ error: 'taskId and updates required' }, { status: 400 })
        }
        const setClauses = []
        const values: any[] = []
        
        if (updates.description !== undefined) {
          const [updated] = await sql`
            UPDATE tasks SET 
              description = COALESCE(${updates.description}, description),
              urgency = COALESCE(${updates.urgency}, urgency),
              importance = COALESCE(${updates.importance}, importance)
            WHERE id = ${taskId}
            RETURNING id, description, urgency, importance
          `
          return NextResponse.json({ task: updated })
        }
        
        const [updated] = await sql`
          UPDATE tasks SET 
            urgency = COALESCE(${updates.urgency}, urgency),
            importance = COALESCE(${updates.importance}, importance)
          WHERE id = ${taskId}
          RETURNING id, description, urgency, importance
        `
        return NextResponse.json({ task: updated })
      }

      case 'delete': {
        if (!taskId) {
          return NextResponse.json({ error: 'taskId required' }, { status: 400 })
        }
        await sql`DELETE FROM task_assignments WHERE task_id = ${taskId}`
        await sql`DELETE FROM tasks WHERE id = ${taskId}`
        return NextResponse.json({ success: true })
      }

      case 'overview': {
        if (!projectId) {
          return NextResponse.json({ error: 'projectId required' }, { status: 400 })
        }
        
        const [project] = await sql`
          SELECT id, name, description, type FROM projects WHERE id = ${projectId}
        `
        
        const stats = await sql`
          SELECT
            COUNT(*) FILTER (WHERE urgency > 50 AND importance > 50) as q1_do_first,
            COUNT(*) FILTER (WHERE urgency <= 50 AND importance > 50) as q2_schedule,
            COUNT(*) FILTER (WHERE urgency > 50 AND importance <= 50) as q3_delegate,
            COUNT(*) FILTER (WHERE urgency <= 50 AND importance <= 50) as q4_eliminate,
            COUNT(*) as total
          FROM tasks
          WHERE project_id = ${projectId}
            AND (archived = false OR archived IS NULL)
        `
        
        const topTasks = await sql`
          SELECT id, description, urgency, importance
          FROM tasks
          WHERE project_id = ${projectId}
            AND (archived = false OR archived IS NULL)
          ORDER BY (urgency + importance) DESC
          LIMIT 5
        `

        return NextResponse.json({
          project,
          stats: stats[0],
          topTasks
        })
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (error) {
    console.error('Service API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 }
    )
  }
}
