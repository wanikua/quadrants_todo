import { neon, Pool } from '@neondatabase/serverless'
import { auth } from '@clerk/nextjs/server'

// 创建连接池以优化性能
const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
  // 连接池配置
  max: 10, // 最大连接数
})

// 简单的内存缓存实现
class SimpleCache {
  private cache = new Map<string, { data: any; expires: number }>()
  private cleanupInterval: NodeJS.Timeout | null = null

  constructor() {
    // 每5分钟清理过期缓存
    this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000)
  }

  set(key: string, value: any, ttlSeconds = 300) {
    this.cache.set(key, {
      data: value,
      expires: Date.now() + ttlSeconds * 1000
    })
  }

  get(key: string): any | null {
    const item = this.cache.get(key)
    if (!item) return null
    
    if (Date.now() > item.expires) {
      this.cache.delete(key)
      return null
    }
    
    return item.data
  }

  delete(pattern: string) {
    const keys = Array.from(this.cache.keys())
    keys.forEach(key => {
      if (key.includes(pattern)) {
        this.cache.delete(key)
      }
    })
  }

  private cleanup() {
    const now = Date.now()
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expires) {
        this.cache.delete(key)
      }
    }
  }

  clear() {
    this.cache.clear()
  }

  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
    this.clear()
  }
}

// 单例缓存实例
const cache = new SimpleCache()

// 缓存key前缀
const CACHE_PREFIX = {
  PROJECT_ACCESS: 'pa:',
  USER_PROJECTS: 'up:',
  PROJECT_DATA: 'pd:',
}

// 获取认证的数据库连接
export async function getAuthenticatedDb() {
  const { userId } = await auth()
  
  if (!userId) {
    throw new Error('Unauthorized: No user ID found')
  }

  const sql = process.env.DATABASE_URL ? neon(process.env.DATABASE_URL) : null as any
  
  // 返回设置了用户上下文的查询函数
  return {
    sql: async (query: TemplateStringsArray | string, ...params: any[]) => {
      // 设置RLS用户上下文
      await sql`SELECT set_config('app.current_user_id', ${userId}, false)`
      
      // 执行实际查询
      return sql(query as TemplateStringsArray, ...params)
    },
    userId,
  }
}

// 检查项目访问权限（带缓存）
export async function checkProjectAccess(
  projectId: string, 
  userId: string
): Promise<boolean> {
  const cacheKey = `${CACHE_PREFIX.PROJECT_ACCESS}${userId}:${projectId}`
  
  // 检查缓存
  const cached = cache.get(cacheKey)
  if (cached !== null) {
    return cached
  }

  // 查询数据库
  const sql = process.env.DATABASE_URL ? neon(process.env.DATABASE_URL) : null as any
  const result = await sql`
    SELECT 1 
    FROM project_members 
    WHERE project_id = ${projectId} 
    AND user_id = ${userId}
    LIMIT 1
  `

  const hasAccess = result.length > 0
  
  // 缓存结果（5分钟）
  cache.set(cacheKey, hasAccess, 300)
  
  return hasAccess
}

// 获取用户的所有项目（带缓存）
export async function getUserProjects(userId: string) {
  const cacheKey = `${CACHE_PREFIX.USER_PROJECTS}${userId}`
  
  // 检查缓存
  const cached = cache.get(cacheKey)
  if (cached) {
    return cached
  }

  // 查询数据库
  const sql = process.env.DATABASE_URL ? neon(process.env.DATABASE_URL) : null as any
  const projects = await sql`
    SELECT 
      p.*,
      pm.role,
      (SELECT COUNT(*) FROM project_members WHERE project_id = p.id) as member_count
    FROM projects p
    JOIN project_members pm ON p.id = pm.project_id
    WHERE pm.user_id = ${userId}
    ORDER BY p.created_at DESC
  `
  
  // 缓存结果（2分钟）
  cache.set(cacheKey, projects, 120)
  
  return projects
}

// 使缓存失效
export function invalidateProjectCache(projectId: string) {
  cache.delete(projectId)
}

export function invalidateUserCache(userId: string) {
  cache.delete(userId)
}

// 初始化项目数据库表
export async function initializeProjectDatabase(
  projectId: string, 
  userId: string
) {
  const sql = process.env.DATABASE_URL ? neon(process.env.DATABASE_URL) : null as any
  
  try {
    // 设置用户上下文
    await sql`SELECT set_config('app.current_user_id', ${userId}, false)`
    
    // 确保所有表都有project_id字段
    // 这应该在数据库迁移中处理，这里只是确保
    await sql`
      DO $$
      BEGIN
        -- Add project_id to tasks if not exists
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'tasks' AND column_name = 'project_id'
        ) THEN
          ALTER TABLE tasks ADD COLUMN project_id UUID REFERENCES projects(id) ON DELETE CASCADE;
          CREATE INDEX idx_tasks_project_id ON tasks(project_id);
        END IF;

        -- Add project_id to players if not exists
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'players' AND column_name = 'project_id'
        ) THEN
          ALTER TABLE players ADD COLUMN project_id UUID REFERENCES projects(id) ON DELETE CASCADE;
          CREATE INDEX idx_players_project_id ON players(project_id);
        END IF;

        -- Add project_id to lines if not exists
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'lines' AND column_name = 'project_id'
        ) THEN
          ALTER TABLE lines ADD COLUMN project_id UUID REFERENCES projects(id) ON DELETE CASCADE;
          CREATE INDEX idx_lines_project_id ON lines(project_id);
        END IF;
      END $$;
    `
    
    // 清除相关缓存
    invalidateProjectCache(projectId)
    invalidateUserCache(userId)
    
    return { success: true }
  } catch (error) {
    console.error('Failed to initialize project database:', error)
    return { success: false, error }
  }
}

// 优化的批量查询示例
export async function getProjectWithAllData(projectId: string, userId: string) {
  const cacheKey = `${CACHE_PREFIX.PROJECT_DATA}${projectId}`
  
  // 检查缓存
  const cached = cache.get(cacheKey)
  if (cached) {
    return cached
  }

  // 使用单个连接执行多个查询
  const client = await pool.connect()
  
  try {
    // 设置用户上下文
    await client.query('SELECT set_config($1, $2, false)', ['app.current_user_id', userId])
    
    // 并行执行多个查询
    const [project, tasks, players, lines] = await Promise.all([
      client.query('SELECT * FROM projects WHERE id = $1', [projectId]),
      client.query('SELECT * FROM tasks WHERE project_id = $1', [projectId]),
      client.query('SELECT * FROM players WHERE project_id = $1', [projectId]),
      client.query('SELECT * FROM lines WHERE project_id = $1', [projectId]),
    ])
    
    const result = {
      project: project.rows[0],
      tasks: tasks.rows,
      players: players.rows,
      lines: lines.rows,
    }
    
    // 缓存结果（1分钟）
    cache.set(cacheKey, result, 60)
    
    return result
  } finally {
    client.release()
  }
}

// 导出缓存实例以供测试
export { cache }
