/**
 * 数据库查询辅助函数
 *
 * 这个文件包含了所有需要访问控制的数据库查询
 * 配合优化的RLS PERMISSIVE策略使用
 *
 * RLS策略模式：
 * - RLS启用但使用PERMISSIVE策略（允许所有操作）
 * - 应用层负责主要的访问控制（WHERE子句）
 * - RLS作为安全防护层，防止SQL注入等攻击
 */

import { sql } from './db';

// ========================================
// Projects查询
// ========================================

/**
 * 获取用户可访问的所有项目
 * 包括：自己创建的项目 + 作为成员的项目
 */
export async function getUserProjects(userId: string) {
  return await sql`
    SELECT DISTINCT p.*
    FROM projects p
    LEFT JOIN project_members pm ON p.id = pm.project_id
    WHERE p.owner_id = ${userId}
       OR pm.user_id = ${userId}
    ORDER BY p.created_at DESC
  `;
}

/**
 * 获取单个项目（需验证访问权限）
 */
export async function getProject(projectId: number, userId: string) {
  const result = await sql`
    SELECT p.*
    FROM projects p
    LEFT JOIN project_members pm ON p.id = pm.project_id AND pm.user_id = ${userId}
    WHERE p.id = ${projectId}
      AND (p.owner_id = ${userId} OR pm.user_id = ${userId})
    LIMIT 1
  `;
  return result[0] || null;
}

/**
 * 创建项目
 */
export async function createProject(data: {
  id: number;
  name: string;
  type: string;
  owner_id: string;
  invite_code?: string;
}) {
  return await sql`
    INSERT INTO projects (id, name, type, owner_id, invite_code)
    VALUES (${data.id}, ${data.name}, ${data.type}, ${data.owner_id}, ${data.invite_code || null})
    RETURNING *
  `;
}

/**
 * 更新项目（仅所有者）
 */
export async function updateProject(
  projectId: number,
  userId: string,
  updates: { name?: string; type?: string }
) {
  // 验证所有权
  const project = await sql`
    SELECT * FROM projects WHERE id = ${projectId} AND owner_id = ${userId}
  `;

  if (project.length === 0) {
    throw new Error('Unauthorized: Only project owner can update');
  }

  const setClauses = [];
  const values = [];

  if (updates.name !== undefined) {
    setClauses.push('name = $' + (values.length + 1));
    values.push(updates.name);
  }
  if (updates.type !== undefined) {
    setClauses.push('type = $' + (values.length + 1));
    values.push(updates.type);
  }

  if (setClauses.length === 0) return project[0];

  const query = `
    UPDATE projects
    SET ${setClauses.join(', ')}
    WHERE id = $${values.length + 1}
    RETURNING *
  `;
  values.push(projectId);

  return await sql(query, values);
}

/**
 * 删除项目（仅所有者）
 */
export async function deleteProject(projectId: number, userId: string) {
  return await sql`
    DELETE FROM projects
    WHERE id = ${projectId} AND owner_id = ${userId}
    RETURNING *
  `;
}

// ========================================
// Tasks查询
// ========================================

/**
 * 获取项目的所有任务（需验证项目访问权限）
 */
export async function getProjectTasks(projectId: number, userId: string) {
  // 先验证项目访问权限
  const project = await getProject(projectId, userId);
  if (!project) {
    throw new Error('Unauthorized: No access to this project');
  }

  return await sql`
    SELECT * FROM tasks
    WHERE project_id = ${projectId}
    ORDER BY created_at DESC
  `;
}

/**
 * 创建任务
 */
export async function createTask(data: {
  id: number;
  project_id: number;
  description: string;
  urgency: number;
  importance: number;
  created_by: string;
}) {
  // 验证项目访问权限
  const project = await getProject(data.project_id, data.created_by);
  if (!project) {
    throw new Error('Unauthorized: No access to this project');
  }

  return await sql`
    INSERT INTO tasks (id, project_id, description, urgency, importance)
    VALUES (${data.id}, ${data.project_id}, ${data.description}, ${data.urgency}, ${data.importance})
    RETURNING *
  `;
}

// ========================================
// Project Members查询
// ========================================

/**
 * 获取项目成员列表
 */
export async function getProjectMembers(projectId: number, userId: string) {
  // 验证项目访问权限
  const project = await getProject(projectId, userId);
  if (!project) {
    throw new Error('Unauthorized: No access to this project');
  }

  return await sql`
    SELECT pm.*, u.email, u.display_name
    FROM project_members pm
    JOIN users u ON pm.user_id = u.id
    WHERE pm.project_id = ${projectId}
    ORDER BY pm.created_at ASC
  `;
}

/**
 * 添加项目成员（仅所有者）
 */
export async function addProjectMember(
  projectId: number,
  memberUserId: string,
  role: string,
  ownerUserId: string
) {
  // 验证所有权
  const project = await sql`
    SELECT * FROM projects WHERE id = ${projectId} AND owner_id = ${ownerUserId}
  `;

  if (project.length === 0) {
    throw new Error('Unauthorized: Only project owner can add members');
  }

  const memberId = Math.floor(Math.random() * 1000000);

  return await sql`
    INSERT INTO project_members (id, project_id, user_id, role)
    VALUES (${memberId}, ${projectId}, ${memberUserId}, ${role})
    RETURNING *
  `;
}

/**
 * 移除项目成员（仅所有者）
 */
export async function removeProjectMember(
  projectId: number,
  memberUserId: string,
  ownerUserId: string
) {
  // 验证所有权
  const project = await sql`
    SELECT * FROM projects WHERE id = ${projectId} AND owner_id = ${ownerUserId}
  `;

  if (project.length === 0) {
    throw new Error('Unauthorized: Only project owner can remove members');
  }

  return await sql`
    DELETE FROM project_members
    WHERE project_id = ${projectId} AND user_id = ${memberUserId}
    RETURNING *
  `;
}

// ========================================
// Users查询
// ========================================

/**
 * 获取用户信息（仅自己）
 */
export async function getUserById(userId: string) {
  const result = await sql`
    SELECT id, email, display_name, subscription_status, created_at
    FROM users
    WHERE id = ${userId}
    LIMIT 1
  `;
  return result[0] || null;
}

/**
 * 更新用户信息（仅自己）
 */
export async function updateUser(
  userId: string,
  updates: { display_name?: string; email?: string }
) {
  const setClauses = [];
  const values: any[] = [];

  if (updates.display_name !== undefined) {
    setClauses.push(`display_name = $${values.length + 1}`);
    values.push(updates.display_name);
  }
  if (updates.email !== undefined) {
    setClauses.push(`email = $${values.length + 1}`);
    values.push(updates.email);
  }

  if (setClauses.length === 0) {
    return await getUserById(userId);
  }

  values.push(userId);

  const query = `
    UPDATE users
    SET ${setClauses.join(', ')}, updated_at = NOW()
    WHERE id = $${values.length}
    RETURNING id, email, display_name, subscription_status, created_at, updated_at
  `;

  const result = await sql(query, values);
  return result[0];
}

// ========================================
// 辅助函数
// ========================================

/**
 * 生成随机ID（用于不支持自增的表）
 */
export function generateId(): number {
  return Math.floor(Math.random() * 1000000000);
}

/**
 * 检查用户是否是项目所有者
 */
export async function isProjectOwner(projectId: number, userId: string): Promise<boolean> {
  const result = await sql`
    SELECT 1 FROM projects WHERE id = ${projectId} AND owner_id = ${userId}
  `;
  return result.length > 0;
}

/**
 * 检查用户是否是项目成员（包括所有者）
 */
export async function isProjectMember(projectId: number, userId: string): Promise<boolean> {
  const result = await sql`
    SELECT 1 FROM projects p
    LEFT JOIN project_members pm ON p.id = pm.project_id
    WHERE p.id = ${projectId}
      AND (p.owner_id = ${userId} OR pm.user_id = ${userId})
    LIMIT 1
  `;
  return result.length > 0;
}
