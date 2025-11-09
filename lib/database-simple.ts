import { neon } from '@neondatabase/serverless'

// 创建简单的数据库连接
const sql = process.env.DATABASE_URL ? neon(process.env.DATABASE_URL) : null as any

// 项目操作
export async function createProject(name: string, type: string, userId: string) {
  try {
    const projectId = `proj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const inviteCode = type === 'team' ? `invite_${Math.random().toString(36).substr(2, 8)}` : null
    
    // 创建项目
    await sql`
      INSERT INTO projects (id, name, type, owner_id, invite_code)
      VALUES (${projectId}, ${name}, ${type}, ${userId}, ${inviteCode})
    `
    
    // 添加所有者为成员
    const memberId = `member_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    await sql`
      INSERT INTO project_members (id, project_id, user_id, role)
      VALUES (${memberId}, ${projectId}, ${userId}, 'owner')
    `
    
    // 创建默认玩家
    const defaultPlayers = [
      { name: 'Alice', color: '#ef4444' },
      { name: 'Bob', color: '#f97316' },
      { name: 'Charlie', color: '#eab308' },
    ]
    
    for (const player of defaultPlayers) {
      await sql`
        INSERT INTO players (project_id, name, color)
        VALUES (${projectId}, ${player.name}, ${player.color})
      `
    }
    
    return { success: true, projectId, inviteCode }
  } catch (error) {
    console.error('Error creating project:', error)
    return { success: false, error: 'Failed to create project' }
  }
}

export async function getUserProjects(userId: string) {
  try {
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
    
    return projects.map((project: any) => ({
      id: project.id,
      name: project.name,
      type: project.type,
      role: project.role,
      created_at: project.created_at,
      member_count: parseInt(project.member_count)
    }))
  } catch (error) {
    console.error('Error fetching projects:', error)
    return []
  }
}

export async function joinProject(inviteCode: string, userId: string) {
  try {
    // 查找项目
    const projects = await sql`
      SELECT * FROM projects WHERE invite_code = ${inviteCode}
    `
    
    if (projects.length === 0) {
      return { success: false, error: 'Invalid invite code' }
    }
    
    const project = projects[0]
    
    // 检查是否已经是成员
    const existing = await sql`
      SELECT * FROM project_members 
      WHERE project_id = ${project.id} AND user_id = ${userId}
    `
    
    if (existing.length > 0) {
      return { success: false, error: 'Already a member' }
    }
    
    // 添加成员
    const memberId = `member_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    await sql`
      INSERT INTO project_members (id, project_id, user_id, role)
      VALUES (${memberId}, ${project.id}, ${userId}, 'member')
    `
    
    return { success: true, projectId: project.id }
  } catch (error) {
    console.error('Error joining project:', error)
    return { success: false, error: 'Failed to join project' }
  }
}

export async function getProjectData(projectId: string, userId: string) {
  try {
    // 检查访问权限
    const access = await sql`
      SELECT * FROM project_members 
      WHERE project_id = ${projectId} AND user_id = ${userId}
    `
    
    if (access.length === 0) {
      throw new Error('Access denied')
    }
    
    // 获取项目信息
    const projects = await sql`SELECT * FROM projects WHERE id = ${projectId}`
    const project = projects[0]
    
    // 获取任务
    const tasks = await sql`
      SELECT 
        t.*,
        COALESCE(
          json_agg(
            json_build_object('id', p.id, 'name', p.name, 'color', p.color)
          ) FILTER (WHERE ta.player_id IS NOT NULL), 
          '[]'
        ) as assignees
      FROM tasks t
      LEFT JOIN task_assignments ta ON t.id = ta.task_id
      LEFT JOIN players p ON ta.player_id = p.id
      WHERE t.project_id = ${projectId}
      GROUP BY t.id
      ORDER BY t.created_at DESC
    `
    
    // 获取玩家
    const players = await sql`
      SELECT * FROM players WHERE project_id = ${projectId} ORDER BY created_at
    `
    
    // 获取连线
    const lines = await sql`
      SELECT * FROM lines WHERE project_id = ${projectId} ORDER BY created_at
    `
    
    return {
      project,
      tasks: tasks.map((task: any) => ({
        ...task,
        assignees: typeof task.assignees === 'string' ? JSON.parse(task.assignees) : task.assignees
      })),
      players,
      lines
    }
  } catch (error) {
    console.error('Error fetching project data:', error)
    throw error
  }
}
