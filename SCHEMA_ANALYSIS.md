# 数据库Schema与TypeScript类型一致性分析

## 执行时间
2025-01-29

## 分析目的
验证database schema (app/db/schema.ts) 与 TypeScript types (app/types.ts) 的一致性，确保类型安全。

---

## 📊 Schema vs Types 对比

### 1. Projects Table

#### Database Schema (schema.ts)
\`\`\`typescript
export const projects = pgTable('projects', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),           // ✅ 新增
  type: text('type').notNull(),               // 'personal' | 'team'
  owner_id: text('owner_id').notNull(),
  invite_code: text('invite_code'),
  created_at: timestamp('created_at').defaultNow().notNull(),
})
\`\`\`

#### TypeScript Types (types.ts)
\`\`\`typescript
export interface Project {
  id: string
  name: string
  description?: string                         // ✅ 已添加
  type?: 'personal' | 'team'                  // ✅ 已添加
  owner_id: string
  access_code?: string                        // ⚠️ 名称不一致: invite_code vs access_code
  created_at?: string
  updated_at?: string                         // ⚠️ Schema中不存在
}
\`\`\`

#### 问题
1. **字段名不一致**: `invite_code` (schema) vs `access_code` (types)
2. **Schema缺少字段**: `updated_at` 在types中存在但schema中不存在
3. **类型可选性**: schema中`type`是notNull，但types中是optional

---

### 2. Tasks Table

#### Database Schema
\`\`\`typescript
export const tasks = pgTable('tasks', {
  id: serial('id').primaryKey(),
  project_id: text('project_id').notNull().references(() => projects.id),
  description: text('description').notNull(),
  urgency: integer('urgency').notNull(),
  importance: integer('importance').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
})
\`\`\`

#### TypeScript Types
\`\`\`typescript
export interface Task {
  id: number
  description: string
  urgency: number
  importance: number
  completed?: boolean                         // ⚠️ Schema中不存在
  created_at?: string | Date
  updated_at?: string | Date
  assignees?: Player[]                        // ✅ 通过join获取
  comments?: Comment[]                        // ✅ 通过join获取
}
\`\`\`

#### 问题
1. **缺少字段**: `project_id` 在schema中存在但types中缺失
2. **额外字段**: `completed` 在types中存在但schema中不存在

---

### 3. Players Table

#### Database Schema
\`\`\`typescript
export const players = pgTable('players', {
  id: serial('id').primaryKey(),
  project_id: text('project_id').notNull().references(() => projects.id),
  user_id: text('user_id').notNull(),         // ⚠️ Types中缺失
  name: text('name').notNull(),
  color: text('color').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
})
\`\`\`

#### TypeScript Types
\`\`\`typescript
export interface Player {
  id: number
  name: string
  color: string
  created_at?: string
}
\`\`\`

#### 问题
1. **缺少字段**: `project_id` 和 `user_id` 在types中缺失

---

### 4. User Activity Table (新增)

#### Database Schema
\`\`\`typescript
export const userActivity = pgTable('user_activity', {
  id: serial('id').primaryKey(),
  project_id: text('project_id').notNull().references(() => projects.id),
  user_id: text('user_id').notNull(),
  last_seen: timestamp('last_seen').defaultNow().notNull(),
})
\`\`\`

#### TypeScript Types
\`\`\`typescript
// ❌ 完全缺失
\`\`\`

#### 问题
1. **缺少类型定义**: types.ts中完全没有UserActivity接口

---

## 🔍 数据库设计合理性分析

### ✅ 优点

1. **正确使用外键约束**
   - 所有关联表都使用了`references()`和`onDelete: 'cascade'`
   - 保证数据完整性

2. **合理的索引设计**
   - user_activity表有适当的索引
   - 支持快速查询

3. **时间戳跟踪**
   - 大部分表都有`created_at`
   - tasks表有`updated_at`

### ⚠️ 问题和建议

#### 1. 类型一致性问题
\`\`\`
Schema          |  Types          |  建议
----------------|-----------------|------------------
invite_code     |  access_code    |  统一为invite_code
type (notNull)  |  type?          |  types应该required
-               |  completed      |  从types移除或添加到schema
-               |  updated_at     |  projects表添加此字段
\`\`\`

#### 2. 缺少必要字段

**Tasks表缺少project_id字段在types中**
\`\`\`typescript
// 应该添加
export interface Task {
  id: number
  project_id: string  // ← 添加这个
  description: string
  // ...
}
\`\`\`

**Players表缺少project_id和user_id**
\`\`\`typescript
export interface Player {
  id: number
  project_id: string  // ← 添加
  user_id: string     // ← 添加
  name: string
  color: string
  created_at?: string
}
\`\`\`

#### 3. 缺少UserActivity类型定义
\`\`\`typescript
// 需要添加
export interface UserActivity {
  id: number
  project_id: string
  user_id: string
  last_seen: Date | string
}
\`\`\`

#### 4. projects表建议添加updated_at
\`\`\`typescript
export const projects = pgTable('projects', {
  // ... 现有字段
  updated_at: timestamp('updated_at').defaultNow().notNull(),  // ← 添加
})
\`\`\`

---

## 🔧 推荐修复清单

### 高优先级 (影响功能)
1. ✅ **已修复**: Project.type 字段
2. ⚠️ **待修复**: Project.access_code → invite_code 统一命名
3. ⚠️ **待修复**: Task.project_id 添加到types
4. ⚠️ **待修复**: Player.project_id 和 user_id 添加到types
5. ⚠️ **待修复**: 添加 UserActivity 接口

### 中优先级 (改善一致性)
6. 移除 Task.completed 字段或添加到schema
7. 统一 type 字段的可选性
8. projects表添加 updated_at 字段

### 低优先级 (优化)
9. 考虑为所有表添加 updated_at
10. 添加更多索引以优化查询性能

---

## 📈 影响评估

### 当前问题影响
- **Pro Plan状态**: 可能因Project.type字段问题 (已修复)
- **Drag功能**: 可能因缺少project_id导致权限检查失败
- **实时同步**: UserActivity类型缺失可能影响类型安全

### 修复后收益
- ✅ 完整的类型安全
- ✅ 更好的IDE自动补全
- ✅ 减少运行时错误
- ✅ 更容易维护代码
