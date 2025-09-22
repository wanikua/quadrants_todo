import { neon } from '@neondatabase/serverless'
import { auth } from '@clerk/nextjs/server'

// 注意：已迁移到 db-optimized.ts 使用内存缓存
// 此文件保留用于向后兼容，但建议使用 db-optimized.ts

// Cache configuration
const CACHE_TTL = 60 * 5 // 5 minutes
const CACHE_PREFIX = {
  PROJECT: 'project:',
  PROJECT_ACCESS: 'project_access:',
  PROJECT_DATA: 'project_data:',
  USER_PROJECTS: 'user_projects:',
}

// Create a connection with user context
export async function getAuthenticatedDb() {
  const { userId } = await auth()
  
  if (!userId) {
    throw new Error('Unauthorized: No user ID found')
  }

  const sql = neon(process.env.DATABASE_URL!)
  
  // Create a wrapper that sets the user context for each query
  return {
    sql: async (query: TemplateStringsArray | string, ...params: any[]) => {
      // Set the current user context for RLS
      await sql`SELECT set_config('app.current_user_id', ${userId}, false)`
      
      // Execute the actual query
      return sql(query as TemplateStringsArray, ...params)
    },
    userId,
  }
}

// Cache helper functions
export async function getCachedProjectAccess(projectId: string, userId: string): Promise<boolean | null> {
  try {
    const cached = await redis.get(`${CACHE_PREFIX.PROJECT_ACCESS}${userId}:${projectId}`)
    return cached as boolean | null
  } catch (error) {
    console.error('Redis cache error:', error)
    return null
  }
}

export async function setCachedProjectAccess(projectId: string, userId: string, hasAccess: boolean) {
  try {
    await redis.setex(
      `${CACHE_PREFIX.PROJECT_ACCESS}${userId}:${projectId}`,
      CACHE_TTL,
      hasAccess
    )
  } catch (error) {
    console.error('Redis cache error:', error)
  }
}

export async function getCachedUserProjects(userId: string) {
  try {
    const cached = await redis.get(`${CACHE_PREFIX.USER_PROJECTS}${userId}`)
    return cached as any[] | null
  } catch (error) {
    console.error('Redis cache error:', error)
    return null
  }
}

export async function setCachedUserProjects(userId: string, projects: any[]) {
  try {
    await redis.setex(
      `${CACHE_PREFIX.USER_PROJECTS}${userId}`,
      CACHE_TTL,
      JSON.stringify(projects)
    )
  } catch (error) {
    console.error('Redis cache error:', error)
  }
}

export async function invalidateProjectCache(projectId: string) {
  try {
    const keys = await redis.keys(`${CACHE_PREFIX.PROJECT}*${projectId}*`)
    if (keys.length > 0) {
      await redis.del(...keys)
    }
  } catch (error) {
    console.error('Redis cache error:', error)
  }
}

export async function invalidateUserCache(userId: string) {
  try {
    const keys = await redis.keys(`*${userId}*`)
    if (keys.length > 0) {
      await redis.del(...keys)
    }
  } catch (error) {
    console.error('Redis cache error:', error)
  }
}

// Enhanced project access check with caching
export async function checkProjectAccess(projectId: string, userId: string): Promise<boolean> {
  // Check cache first
  const cached = await getCachedProjectAccess(projectId, userId)
  if (cached !== null) {
    return cached
  }

  // Query database
  const sql = neon(process.env.DATABASE_URL!)
  const result = await sql`
    SELECT 1 
    FROM project_members 
    WHERE project_id = ${projectId} 
    AND user_id = ${userId}
    LIMIT 1
  `

  const hasAccess = result.length > 0
  
  // Cache the result
  await setCachedProjectAccess(projectId, userId, hasAccess)
  
  return hasAccess
}

// Initialize project with proper tables and permissions
export async function initializeProjectDatabase(projectId: string, userId: string) {
  const sql = neon(process.env.DATABASE_URL!)
  
  try {
    // Set user context
    await sql`SELECT set_config('app.current_user_id', ${userId}, false)`
    
    // Ensure all project tables have the project_id column
    await sql`
      -- This is handled by the create_project_tables() function in setup-rls.sql
      SELECT create_project_tables()
    `
    
    // Clear any cached data for this project
    await invalidateProjectCache(projectId)
    
    return { success: true }
  } catch (error) {
    console.error('Failed to initialize project database:', error)
    return { success: false, error }
  }
}