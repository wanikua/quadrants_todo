import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

/**
 * Service API for Clawdbot integration
 * POST /api/service — authenticated via X-API-Key header
 * 
 * Actions: projects, tasks, priority, create, bulk-create, complete,
 *          update, delete, overview, search, quadrant, stats
 */
export async function POST(request: NextRequest) {
  try {
    const apiKey = request.headers.get('X-API-Key')
    const serviceKey = process.env.QUADRANTS_SERVICE_KEY

    if (!serviceKey || apiKey !== serviceKey) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action, userId, projectId, taskId, description, urgency, importance, 
            tasks: tasksList, updates, query, quadrant, limit: queryLimit } = body

    if (!action) {
      return NextResponse.json({ error: 'Action required' }, { status: 400 })
    }

    const uid = userId || process.env.QUADRANTS_SERVICE_USER_ID
    const lim = Math.min(queryLimit || 20, 50)

    switch (action) {
      case 'projects': {
        const projects = await sql`
          SELECT DISTINCT p.id, p.name, p.description, p.type, p.created_at,
            (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id AND (t.archived = false OR t.archived IS NULL)) as active_tasks,
            (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id AND t.archived = true) as completed_tasks
          FROM projects p
          LEFT JOIN project_members pm ON p.id = pm.project_id
          WHERE (p.owner_id = ${uid} OR pm.user_id = ${uid})
            AND (p.archived = false OR p.archived IS NULL)
          ORDER BY p.created_at DESC
        `
        return NextResponse.json({ projects })
      }

      case 'tasks': {
        if (!projectId) return NextResponse.json({ error: 'projectId required' }, { status: 400 })
        const tasks = await sql`
          SELECT t.id, t.description, t.urgency, t.importance, t.created_at,
            CASE 
              WHEN t.urgency > 50 AND t.importance > 50 THEN 'Q1_DO_FIRST'
              WHEN t.urgency <= 50 AND t.importance > 50 THEN 'Q2_SCHEDULE'
              WHEN t.urgency > 50 AND t.importance <= 50 THEN 'Q3_DELEGATE'
              ELSE 'Q4_ELIMINATE'
            END as quadrant,
            COALESCE(
              json_agg(json_build_object('id', p.id, 'name', p.name, 'color', p.color))
              FILTER (WHERE p.id IS NOT NULL), '[]'
            ) as assignees
          FROM tasks t
          LEFT JOIN task_assignments ta ON t.id = ta.task_id
          LEFT JOIN players p ON ta.player_id = p.id
          WHERE t.project_id = ${projectId}
            AND (t.archived = false OR t.archived IS NULL)
          GROUP BY t.id
          ORDER BY (t.urgency + t.importance) DESC, t.created_at DESC
          LIMIT ${lim}
        `
        return NextResponse.json({ tasks })
      }

      case 'priority': {
        const priorityTasks = await sql`
          SELECT
            t.id, t.description, t.urgency, t.importance,
            (t.urgency + t.importance) as priority_score,
            t.project_id, p.name as project_name,
            CASE 
              WHEN t.urgency > 50 AND t.importance > 50 THEN 'Q1_DO_FIRST'
              WHEN t.urgency <= 50 AND t.importance > 50 THEN 'Q2_SCHEDULE'
              WHEN t.urgency > 50 AND t.importance <= 50 THEN 'Q3_DELEGATE'
              ELSE 'Q4_ELIMINATE'
            END as quadrant
          FROM tasks t
          INNER JOIN projects p ON t.project_id = p.id
          WHERE (p.owner_id = ${uid} OR EXISTS (
            SELECT 1 FROM project_members pm WHERE pm.project_id = p.id AND pm.user_id = ${uid}
          ))
          AND (t.archived = false OR t.archived IS NULL)
          AND (p.archived = false OR p.archived IS NULL)
          ORDER BY (t.urgency + t.importance) DESC, t.created_at DESC
          LIMIT ${lim}
        `
        return NextResponse.json({ tasks: priorityTasks })
      }

      case 'quadrant': {
        // Filter tasks by quadrant: Q1, Q2, Q3, Q4
        if (!projectId) return NextResponse.json({ error: 'projectId required' }, { status: 400 })
        if (!quadrant) return NextResponse.json({ error: 'quadrant required (Q1/Q2/Q3/Q4)' }, { status: 400 })
        
        const qMap: Record<string, [string, string, string, string]> = {
          'Q1': ['>', '50', '>', '50'],
          'Q2': ['<=', '50', '>', '50'],
          'Q3': ['>', '50', '<=', '50'],
          'Q4': ['<=', '50', '<=', '50'],
        }
        const q = quadrant.toUpperCase()
        
        let tasks
        if (q === 'Q1') {
          tasks = await sql`SELECT id, description, urgency, importance FROM tasks 
            WHERE project_id = ${projectId} AND (archived = false OR archived IS NULL)
            AND urgency > 50 AND importance > 50 ORDER BY (urgency + importance) DESC`
        } else if (q === 'Q2') {
          tasks = await sql`SELECT id, description, urgency, importance FROM tasks 
            WHERE project_id = ${projectId} AND (archived = false OR archived IS NULL)
            AND urgency <= 50 AND importance > 50 ORDER BY importance DESC`
        } else if (q === 'Q3') {
          tasks = await sql`SELECT id, description, urgency, importance FROM tasks 
            WHERE project_id = ${projectId} AND (archived = false OR archived IS NULL)
            AND urgency > 50 AND importance <= 50 ORDER BY urgency DESC`
        } else if (q === 'Q4') {
          tasks = await sql`SELECT id, description, urgency, importance FROM tasks 
            WHERE project_id = ${projectId} AND (archived = false OR archived IS NULL)
            AND urgency <= 50 AND importance <= 50 ORDER BY created_at DESC`
        } else {
          return NextResponse.json({ error: 'Invalid quadrant. Use Q1/Q2/Q3/Q4' }, { status: 400 })
        }
        
        return NextResponse.json({ quadrant: q, tasks })
      }

      case 'search': {
        if (!query) return NextResponse.json({ error: 'query required' }, { status: 400 })
        const results = await sql`
          SELECT t.id, t.description, t.urgency, t.importance, t.project_id, 
            p.name as project_name, t.archived
          FROM tasks t
          INNER JOIN projects p ON t.project_id = p.id
          WHERE (p.owner_id = ${uid} OR EXISTS (
            SELECT 1 FROM project_members pm WHERE pm.project_id = p.id AND pm.user_id = ${uid}
          ))
          AND t.description ILIKE ${'%' + query + '%'}
          ORDER BY t.archived ASC, (t.urgency + t.importance) DESC
          LIMIT ${lim}
        `
        return NextResponse.json({ results })
      }

      case 'create': {
        if (!projectId || !description) {
          return NextResponse.json({ error: 'projectId and description required' }, { status: 400 })
        }
        const u = Math.max(0, Math.min(100, urgency ?? 50))
        const i = Math.max(0, Math.min(100, importance ?? 50))
        const [task] = await sql`
          INSERT INTO tasks (project_id, description, urgency, importance, created_at)
          VALUES (${projectId}, ${description}, ${u}, ${i}, NOW())
          RETURNING id, description, urgency, importance
        `
        const q = u > 50 && i > 50 ? 'Q1' : u <= 50 && i > 50 ? 'Q2' : u > 50 ? 'Q3' : 'Q4'
        return NextResponse.json({ task: { ...task, quadrant: q } })
      }

      case 'bulk-create': {
        if (!projectId || !tasksList || !Array.isArray(tasksList)) {
          return NextResponse.json({ error: 'projectId and tasks array required' }, { status: 400 })
        }
        const created = []
        for (const t of tasksList) {
          const u = Math.max(0, Math.min(100, t.urgency ?? 50))
          const i = Math.max(0, Math.min(100, t.importance ?? 50))
          const [task] = await sql`
            INSERT INTO tasks (project_id, description, urgency, importance, created_at)
            VALUES (${projectId}, ${t.description}, ${u}, ${i}, NOW())
            RETURNING id, description, urgency, importance
          `
          created.push(task)
        }
        return NextResponse.json({ created, count: created.length })
      }

      case 'complete': {
        if (!taskId) return NextResponse.json({ error: 'taskId required' }, { status: 400 })
        const [completed] = await sql`
          UPDATE tasks SET archived = true WHERE id = ${taskId}
          RETURNING id, description
        `
        if (!completed) return NextResponse.json({ error: 'Task not found' }, { status: 404 })
        return NextResponse.json({ success: true, task: completed })
      }

      case 'update': {
        if (!taskId) return NextResponse.json({ error: 'taskId required' }, { status: 400 })
        if (!updates) return NextResponse.json({ error: 'updates required' }, { status: 400 })
        
        const [updated] = await sql`
          UPDATE tasks SET 
            description = COALESCE(${updates.description ?? null}, description),
            urgency = COALESCE(${updates.urgency ?? null}, urgency),
            importance = COALESCE(${updates.importance ?? null}, importance)
          WHERE id = ${taskId}
          RETURNING id, description, urgency, importance
        `
        if (!updated) return NextResponse.json({ error: 'Task not found' }, { status: 404 })
        return NextResponse.json({ task: updated })
      }

      case 'delete': {
        if (!taskId) return NextResponse.json({ error: 'taskId required' }, { status: 400 })
        await sql`DELETE FROM task_assignments WHERE task_id = ${taskId}`
        const [deleted] = await sql`DELETE FROM tasks WHERE id = ${taskId} RETURNING id, description`
        if (!deleted) return NextResponse.json({ error: 'Task not found' }, { status: 404 })
        return NextResponse.json({ success: true, task: deleted })
      }

      case 'overview': {
        if (!projectId) return NextResponse.json({ error: 'projectId required' }, { status: 400 })
        
        const [project] = await sql`
          SELECT id, name, description, type FROM projects WHERE id = ${projectId}
        `
        if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })
        
        const [stats] = await sql`
          SELECT
            COUNT(*) FILTER (WHERE urgency > 50 AND importance > 50) as q1_do_first,
            COUNT(*) FILTER (WHERE urgency <= 50 AND importance > 50) as q2_schedule,
            COUNT(*) FILTER (WHERE urgency > 50 AND importance <= 50) as q3_delegate,
            COUNT(*) FILTER (WHERE urgency <= 50 AND importance <= 50) as q4_eliminate,
            COUNT(*) as total,
            ROUND(AVG(urgency)::numeric, 1) as avg_urgency,
            ROUND(AVG(importance)::numeric, 1) as avg_importance
          FROM tasks
          WHERE project_id = ${projectId}
            AND (archived = false OR archived IS NULL)
        `
        
        const topTasks = await sql`
          SELECT id, description, urgency, importance,
            CASE 
              WHEN urgency > 50 AND importance > 50 THEN 'Q1'
              WHEN urgency <= 50 AND importance > 50 THEN 'Q2'
              WHEN urgency > 50 AND importance <= 50 THEN 'Q3'
              ELSE 'Q4'
            END as quadrant
          FROM tasks
          WHERE project_id = ${projectId}
            AND (archived = false OR archived IS NULL)
          ORDER BY (urgency + importance) DESC
          LIMIT 5
        `
        
        const [completedStats] = await sql`
          SELECT COUNT(*) as completed_count
          FROM tasks WHERE project_id = ${projectId} AND archived = true
        `

        return NextResponse.json({
          project,
          stats: { ...stats, completed: completedStats.completed_count },
          topTasks
        })
      }

      case 'stats': {
        // Global stats across all projects
        const [globalStats] = await sql`
          SELECT
            COUNT(DISTINCT p.id) as total_projects,
            COUNT(t.id) FILTER (WHERE t.archived = false OR t.archived IS NULL) as active_tasks,
            COUNT(t.id) FILTER (WHERE t.archived = true) as completed_tasks,
            COUNT(t.id) FILTER (WHERE t.urgency > 50 AND t.importance > 50 AND (t.archived = false OR t.archived IS NULL)) as q1_count
          FROM projects p
          LEFT JOIN tasks t ON t.project_id = p.id
          WHERE p.owner_id = ${uid} OR EXISTS (
            SELECT 1 FROM project_members pm WHERE pm.project_id = p.id AND pm.user_id = ${uid}
          )
        `
        return NextResponse.json({ stats: globalStats })
      }

      default:
        return NextResponse.json({ 
          error: `Unknown action: ${action}`,
          available: ['projects', 'tasks', 'priority', 'quadrant', 'search', 'create', 'bulk-create', 'complete', 'update', 'delete', 'overview', 'stats']
        }, { status: 400 })
    }
  } catch (error) {
    console.error('Service API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 }
    )
  }
}
