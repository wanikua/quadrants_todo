# Quadrant Task Manager - 完整功能参考文档

> 本文档详细记录了网页版的所有功能特性，作为移动端和平板应用开发的参考

## 目录
- [技术架构](#技术架构)
- [核心功能](#核心功能)
- [AI智能功能](#ai智能功能)
- [数据库设计](#数据库设计)
- [实时协作](#实时协作)
- [移动端适配](#移动端适配)

---

## 技术架构

### 技术栈
- **前端框架**: Next.js 15 + React 19 + TypeScript
- **后端**: Next.js Server Actions + API Routes
- **数据库**: PostgreSQL (Neon) + Drizzle ORM
- **认证**: Clerk (OAuth) + JWT (备用)
- **UI组件**: Tailwind CSS + Shadcn/ui
- **AI服务**: Qwen API (阿里云) + Claude API (备用)

### 项目结构
\`\`\`
app/
├── actions.ts              # Server actions
├── api/                    # API路由
│   ├── ai/                 # AI相关API
│   │   ├── predict-tasks/  # 任务优先级预测
│   │   ├── organize-tasks/ # 智能任务组织
│   │   └── learn-from-adjustment/ # 学习系统
│   └── projects/[id]/sync/ # 实时同步
├── client.tsx             # 主客户端组件
├── db/
│   ├── actions.ts         # 数据库操作
│   ├── schema.ts          # 数据模型
│   └── index.ts           # 数据库连接
└── projects/[id]/page.tsx # 项目页面

components/
├── QuadrantMatrixMap.tsx  # 四象限矩阵
├── TaskDetailDialog.tsx   # 任务详情对话框
├── BulkTaskInput.tsx      # 批量任务输入（AI）
└── projects-page.tsx      # 项目管理页面
\`\`\`

---

## 核心功能

### 1. 艾森豪威尔矩阵视图（Map View）

**功能描述**：
- 2D可视化矩阵，X轴=紧急度(0-100)，Y轴=重要度(0-100)
- 四象限自动分类和颜色标识
- 任务以圆形气泡显示，颜色代表团队成员

**交互功能**：
- ✅ **拖拽移动**：拖动任务改变优先级坐标
- ✅ **长按创建**：空白处长按0.8秒创建新任务
- ✅ **悬停提示**：显示任务描述、分配人员、坐标
- ✅ **拖拽删除**：拖到右下角垃圾桶区域删除
- ✅ **拖拽完成**：拖到左下角完成区域归档
- ✅ **最高优先级高亮**：自动标注最紧急重要的任务（黄色边框）
- ✅ **全屏模式**：F键或按钮进入全屏，ESC退出

**实现位置**: `components/QuadrantMatrixMap.tsx`

**关键代码逻辑**：
\`\`\`typescript
// 计算任务优先级分数
const priorityScore = urgency * 0.5 + importance * 0.5

// 象限分类
if (urgency >= 50 && importance >= 50) return "重要且紧急"
if (urgency < 50 && importance >= 50) return "重要不紧急"
if (urgency >= 50 && importance < 50) return "紧急不重要"
return "不紧急不重要"
\`\`\`

---

### 2. 列表视图（List View）

**功能描述**：
- 按优先级排序的任务列表
- 适合移动端操作
- 显示任务描述、分配人员、优先级标签

**排序规则**：
\`\`\`typescript
// 优先级分数 = (紧急度 + 重要度) / 2
tasks.sort((a, b) =>
  (b.urgency + b.importance) - (a.urgency + a.importance)
)
\`\`\`

**交互功能**：
- 点击任务查看详情
- 滑动操作（完成/删除）
- 筛选功能（按成员、象限）

**实现位置**: `app/client.tsx` (Tabs: list)

---

### 3. 任务详情与编辑

**功能描述**：
- 查看任务完整信息
- 实时编辑（描述、优先级、分配人员）
- 评论讨论系统

**编辑功能**：
- ✅ 修改任务描述
- ✅ 调整紧急度滑块（0-100）
- ✅ 调整重要度滑块（0-100）
- ✅ 选择/移除团队成员分配
- ✅ 添加评论（支持作者名称）
- ✅ 删除评论
- ✅ 删除任务（带确认）

**优化策略**：
- **乐观更新**：UI立即响应，后台同步数据库
- **失败回滚**：保存失败时自动恢复原始状态
- **错误提示**：保存失败保持编辑模式，显示错误信息

**实现位置**: `components/TaskDetailDialog.tsx`

---

### 4. 批量任务创建（Quick Add / Bulk Add）⭐核心功能

**功能描述**：
这是整个系统的**核心AI功能**，允许用户快速输入多个任务，由AI自动分析并预测优先级。

**工作流程**：
1. **输入阶段**：
   - 用户粘贴或输入多行文本
   - 支持多种分隔符：换行、逗号、句号、分号
   - 支持@mention语法：`@alice 完成报告` 或 `写代码 @bob, @charlie`
   - 支持@all分配给所有人

2. **解析阶段**：
   \`\`\`typescript
   // 文本分割
   const tasks = text.split(/[\n,;。；]+/).filter(t => t.trim())

   // @mention提取
   const mentionRegex = /@(\w+)/g
   const mentions = task.match(mentionRegex)

   // 模糊匹配成员
   const matchPlayer = (mention) => {
     return players.find(p =>
       p.name.toLowerCase().includes(mention.toLowerCase())
     )
   }
   \`\`\`

3. **AI预测阶段**：
   - 调用 `POST /api/ai/predict-tasks`
   - 输入：任务描述数组 + 用户历史偏好
   - 输出：每个任务的 `{ urgency: 0-100, importance: 0-100 }`

4. **预览和调整**：
   - 显示预测结果的可视化预览
   - 用户可手动调整任何任务的优先级
   - 确认后批量创建

5. **批量创建优化**：
   \`\`\`typescript
   // 单次API调用创建所有任务
   const results = await Promise.all(
     tasks.map(task => createTask(
       projectId,
       task.description,
       task.urgency,
       task.importance,
       task.assigneeIds
     ))
   )
   \`\`\`

**实现位置**: `components/BulkTaskInput.tsx`

**API端点**: `app/api/ai/predict-tasks/route.ts`

---

### 5. 智能任务组织（AI Organize）

**功能描述**：
一键整理重叠或混乱的任务布局，使用物理斥力算法自动扩散。

**算法原理**：
\`\`\`typescript
// 1. 归一化：移动所有任务使中心点=(50, 50)
const avgUrgency = tasks.reduce((s, t) => s + t.urgency, 0) / tasks.length
const avgImportance = tasks.reduce((s, t) => s + t.importance, 0) / tasks.length
const offsetX = 50 - avgUrgency
const offsetY = 50 - avgImportance

// 2. 斥力模拟（8次迭代）
const minDistance = 18
for (let iter = 0; iter < 8; iter++) {
  tasks.forEach((task, i) => {
    let forceX = 0, forceY = 0

    tasks.forEach((other, j) => {
      if (i === j) return
      const dx = task.urgency - other.urgency
      const dy = task.importance - other.importance
      const distance = Math.sqrt(dx*dx + dy*dy)

      if (distance < minDistance) {
        const force = (minDistance - distance) / minDistance * 0.5
        forceX += (dx / distance) * force
        forceY += (dy / distance) * force
      }
    })

    task.urgency += forceX
    task.importance += forceY
  })
}

// 3. 重新归一化
// 4. 边界检查（0-100）
\`\`\`

**用户体验**：
- 点击"Organize"按钮预览效果
- 接受/拒绝更改
- 拒绝后恢复原始位置

**实现位置**: `app/api/ai/organize-tasks/route.ts`

---

## AI智能功能

### 1. 任务优先级预测

**目标**: 根据任务描述自动预测紧急度和重要度

**AI调用链**（按优先级）：

#### 方案A：Qwen API（首选）
\`\`\`typescript
// 配置
model: "qwen-plus"
endpoint: "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions"
apiKey: process.env.QWEN_API_KEY

// 提示词（中文优化）
你是一个任务优先级专家。
为每个任务分配：
- urgency（紧急度）：0-100，表示时间敏感性
- importance（重要度）：0-100，表示战略重要性

规则：
- Bug修复/紧急问题 → urgency高
- 战略规划/重要决策 → importance高
- 日常琐事 → 两者都低
\`\`\`

#### 方案B：Claude API（备用）
\`\`\`typescript
// 配置
model: "claude-sonnet-4-20250514"
endpoint: "https://api.anthropic.com/v1/messages"
\`\`\`

#### 方案C：关键词启发式（最终备用）
\`\`\`typescript
const highUrgencyKeywords = [
  'urgent', 'asap', 'immediately', 'today', 'now',
  'bug', 'error', 'broken', 'fix', 'critical'
]

const highImportanceKeywords = [
  'important', 'critical', 'must', 'essential',
  'strategic', 'release', 'launch', 'deploy'
]

// 基础分数
let urgency = 50, importance = 50

// 关键词匹配加分
highUrgencyKeywords.forEach(kw => {
  if (description.toLowerCase().includes(kw)) {
    urgency += 10
  }
})

// 限制范围0-100
urgency = Math.max(0, Math.min(100, urgency))
\`\`\`

**用户偏好学习**：
- 记录用户对AI预测的手动调整
- 计算平均偏差（bias）
- 未来预测时自动应用：
  \`\`\`typescript
  predicted_urgency += user_urgency_bias
  predicted_importance += user_importance_bias
  \`\`\`

**实现位置**: `app/api/ai/predict-tasks/route.ts`

---

### 2. 学习系统

**目标**: 从用户调整中学习，改进预测准确性

**触发条件**：
用户调整任务优先级 ≥5% 时记录

**学习逻辑**：
\`\`\`typescript
// 1. 记录调整
await db.insert(taskPredictions).values({
  user_id: userId,
  project_id: projectId,
  task_description: task.description,
  predicted_urgency: task.predicted_urgency,
  predicted_importance: task.predicted_importance,
  final_urgency: newUrgency,
  final_importance: newImportance,
  adjustment_delta: {
    urgency_delta: newUrgency - task.predicted_urgency,
    importance_delta: newImportance - task.predicted_importance
  }
})

// 2. 更新用户偏好
const adjustments = await db.select().from(taskPredictions)
  .where(eq(taskPredictions.user_id, userId))

const avgUrgencyBias = adjustments.reduce(
  (sum, adj) => sum + adj.adjustment_delta.urgency_delta, 0
) / adjustments.length

const avgImportanceBias = adjustments.reduce(
  (sum, adj) => sum + adj.adjustment_delta.importance_delta, 0
) / adjustments.length

await db.update(userTaskPreferences)
  .set({ avg_urgency_bias: avgUrgencyBias, avg_importance_bias: avgImportanceBias })
  .where(eq(userTaskPreferences.user_id, userId))
\`\`\`

**实现位置**: `app/api/ai/learn-from-adjustment/route.ts`

---

## 数据库设计

### 核心表结构

#### 1. users（用户表）
\`\`\`sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  name TEXT NOT NULL,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  subscription_status TEXT,
  subscription_plan TEXT,
  subscription_period_end TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
\`\`\`

#### 2. projects（项目表）
\`\`\`sql
CREATE TABLE projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL, -- 'personal' | 'team'
  owner_id TEXT NOT NULL REFERENCES users(id),
  invite_code TEXT, -- 8位邀请码（仅团队项目）
  created_at TIMESTAMP DEFAULT NOW()
);
\`\`\`

#### 3. project_members（项目成员表）
\`\`\`sql
CREATE TABLE project_members (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id),
  role TEXT NOT NULL, -- 'owner' | 'admin' | 'member'
  joined_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);
\`\`\`

#### 4. tasks（任务表）⭐核心表
\`\`\`sql
CREATE TABLE tasks (
  id SERIAL PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  urgency INTEGER NOT NULL CHECK (urgency >= 0 AND urgency <= 100),
  importance INTEGER NOT NULL CHECK (importance >= 0 AND importance <= 100),
  predicted_urgency INTEGER, -- AI预测值（用于学习）
  predicted_importance INTEGER,
  archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_tasks_project_id ON tasks(project_id);
CREATE INDEX idx_tasks_updated_at ON tasks(updated_at);
\`\`\`

#### 5. players（成员显示名称表）
\`\`\`sql
CREATE TABLE players (
  id SERIAL PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  color TEXT NOT NULL, -- 颜色代码（#3b82f6）
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);
\`\`\`

#### 6. task_assignments（任务分配表）
\`\`\`sql
CREATE TABLE task_assignments (
  id SERIAL PRIMARY KEY,
  task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(task_id, player_id)
);
\`\`\`

#### 7. comments（评论表）
\`\`\`sql
CREATE TABLE comments (
  id SERIAL PRIMARY KEY,
  task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  author_name TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
\`\`\`

#### 8. lines（任务连线表）
\`\`\`sql
CREATE TABLE lines (
  id SERIAL PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  from_task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  to_task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  style VARCHAR(10) DEFAULT 'filled',
  size INTEGER DEFAULT 8,
  color VARCHAR(7) DEFAULT '#374151',
  created_at TIMESTAMP DEFAULT NOW()
);
\`\`\`

#### 9. user_activity（用户活动表）
用于实时协作的在线状态追踪
\`\`\`sql
CREATE TABLE user_activity (
  id SERIAL PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  last_seen TIMESTAMP DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);
\`\`\`

#### 10. task_predictions（AI学习数据表）
\`\`\`sql
CREATE TABLE task_predictions (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  task_description TEXT NOT NULL,
  predicted_urgency INTEGER NOT NULL,
  predicted_importance INTEGER NOT NULL,
  final_urgency INTEGER NOT NULL,
  final_importance INTEGER NOT NULL,
  adjustment_delta JSONB, -- { urgency_delta: -10, importance_delta: 15 }
  created_at TIMESTAMP DEFAULT NOW()
);
\`\`\`

#### 11. user_task_preferences（用户偏好表）
\`\`\`sql
CREATE TABLE user_task_preferences (
  user_id TEXT PRIMARY KEY,
  avg_urgency_bias REAL DEFAULT 0,
  avg_importance_bias REAL DEFAULT 0,
  keyword_patterns JSONB, -- { "urgent": { urgency: 85 }, ... }
  updated_at TIMESTAMP DEFAULT NOW()
);
\`\`\`

---

### 数据库访问策略

#### 连接配置
\`\`\`typescript
// app/db/index.ts
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'

const sql = neon(process.env.DATABASE_URL!)
const db = drizzle(sql, { schema })
\`\`\`

#### 权限检查
\`\`\`typescript
// 所有数据库操作前必须验证
export async function getUserProjectAccess(
  userId: string,
  projectId: string
): Promise<boolean> {
  // 检查用户是否是owner
  const owned = await db.select()
    .from(projects)
    .where(and(
      eq(projects.id, projectId),
      eq(projects.owner_id, userId)
    ))

  if (owned.length > 0) return true

  // 检查用户是否是member
  const member = await db.select()
    .from(projectMembers)
    .where(and(
      eq(projectMembers.project_id, projectId),
      eq(projectMembers.user_id, userId)
    ))

  return member.length > 0
}
\`\`\`

#### 查询优化
\`\`\`typescript
// 获取项目完整数据（单次查询）
const tasksWithAssignments = await db
  .select({
    id: tasks.id,
    description: tasks.description,
    urgency: tasks.urgency,
    importance: tasks.importance,
    created_at: tasks.created_at,
    updated_at: tasks.updated_at,
    player: {
      id: players.id,
      name: players.name,
      color: players.color,
    },
  })
  .from(tasks)
  .leftJoin(taskAssignments, eq(tasks.id, taskAssignments.task_id))
  .leftJoin(players, eq(taskAssignments.player_id, players.id))
  .where(and(
    eq(tasks.project_id, projectId),
    or(eq(tasks.archived, false), isNull(tasks.archived))
  ))

// 分组聚合assignees
const tasksMap = new Map()
for (const row of tasksWithAssignments) {
  if (!tasksMap.has(row.id)) {
    tasksMap.set(row.id, {
      ...row,
      assignees: []
    })
  }
  if (row.player?.id) {
    tasksMap.get(row.id).assignees.push(row.player)
  }
}
\`\`\`

---

## 实时协作

### 同步机制

#### 1. 心跳检测
\`\`\`typescript
// 每2秒更新用户活动状态
useEffect(() => {
  if (projectType === 'team' && !isOfflineMode) {
    updateUserActivity(projectId)

    const interval = setInterval(() => {
      updateUserActivity(projectId)
    }, 2000)

    return () => clearInterval(interval)
  }
}, [projectType, projectId])
\`\`\`

#### 2. 动态同步频率
\`\`\`typescript
// 根据在线用户数调整同步间隔
const syncInterval = activeUserCount > 1 ? 1500 : 3000

useEffect(() => {
  const interval = setInterval(() => {
    syncData()
  }, syncInterval)

  return () => clearInterval(interval)
}, [activeUserCount])
\`\`\`

#### 3. 智能暂停策略
\`\`\`typescript
// 暂停同步的条件
if (isOrganizing) {
  // 预览organize结果时暂停
  return
}

if (isUserActive && Date.now() - lastUserActivity < 2000) {
  // 用户正在交互时暂停（2秒内有活动）
  return
}

if (pendingUpdateTaskIds.size > 0) {
  // 有待保存的更新时跳过相关任务
  serverTasks.forEach(serverTask => {
    if (pendingUpdateTaskIds.has(serverTask.id)) {
      return // 跳过
    }
    // ...合并逻辑
  })
}
\`\`\`

#### 4. 冲突解决
\`\`\`typescript
// 基于时间戳的乐观并发控制
const mergeTask = (localTask, serverTask) => {
  const serverTime = new Date(serverTask.updated_at).getTime()
  const localTime = new Date(localTask.updated_at).getTime()

  if (serverTime >= localTime) {
    return serverTask // 使用服务器版本
  } else {
    return localTask // 保留本地版本
  }
}
\`\`\`

---

## 移动端适配

### 响应式布局

#### 断点检测
\`\`\`typescript
// hooks/use-mobile.tsx
export function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const media = window.matchMedia(query)
    setMatches(media.matches)

    const listener = () => setMatches(media.matches)
    media.addEventListener('change', listener)
    return () => media.removeEventListener('change', listener)
  }, [query])

  return matches
}

// 使用
const isMobile = useMediaQuery("(max-width: 768px)")
\`\`\`

#### UI组件适配
\`\`\`typescript
// 移动端使用Sheet，桌面端使用Dialog
{isMobile ? (
  <Sheet open={isOpen} onOpenChange={setIsOpen}>
    <SheetContent side="bottom" className="h-[90vh]">
      {content}
    </SheetContent>
  </Sheet>
) : (
  <Dialog open={isOpen} onOpenChange={setIsOpen}>
    <DialogContent className="max-w-2xl">
      {content}
    </DialogContent>
  </Dialog>
)}
\`\`\`

#### 触摸优化
\`\`\`typescript
// 长按手势（移动端友好）
const handleTouchStart = (e: React.TouchEvent) => {
  const touch = e.touches[0]
  longPressTimer = setTimeout(() => {
    handleLongPress(touch.clientX, touch.clientY)
  }, 800) // 移动端0.8秒触发
}

const handleTouchEnd = () => {
  if (longPressTimer) {
    clearTimeout(longPressTimer)
  }
}

// 防止意外缩放
<div
  style={{
    touchAction: 'none',
    userSelect: 'none',
    WebkitUserSelect: 'none'
  }}
>
\`\`\`

---

## API路由总览

### 认证相关
- `POST /api/auth/signup` - 用户注册
- `POST /api/auth/signin` - 用户登录
- `POST /api/auth/signout` - 退出登录

### 项目管理
- `GET /api/projects` - 获取用户所有项目
- `POST /api/projects` - 创建新项目
- `GET /api/projects/[id]` - 获取项目详情
- `PATCH /api/projects/[id]` - 更新项目信息
- `DELETE /api/projects/[id]` - 删除项目
- `POST /api/projects/[id]/leave` - 离开项目
- `GET /api/projects/[id]/sync` - 实时同步数据⭐
- `POST /api/projects/join` - 通过邀请码加入项目

### AI功能⭐核心API
- `POST /api/ai/predict-tasks` - 批量预测任务优先级
  \`\`\`typescript
  // 请求
  {
    "tasks": ["完成报告", "修复bug", "计划会议"],
    "projectId": "proj_xxx"
  }

  // 响应
  {
    "predictions": [
      { "description": "完成报告", "urgency": 85, "importance": 90 },
      { "description": "修复bug", "urgency": 95, "importance": 80 },
      { "description": "计划会议", "urgency": 60, "importance": 70 }
    ]
  }
  \`\`\`

- `POST /api/ai/organize-tasks` - 智能整理任务布局
  \`\`\`typescript
  // 请求
  {
    "tasks": [
      { "id": 1, "urgency": 80, "importance": 90 },
      { "id": 2, "urgency": 81, "importance": 89 }, // 重叠
      ...
    ],
    "projectId": "proj_xxx"
  }

  // 响应
  {
    "organizedTasks": [
      { "id": 1, "urgency": 75, "importance": 92 }, // 已调整
      { "id": 2, "urgency": 85, "importance": 88 },
      ...
    ]
  }
  \`\`\`

- `POST /api/ai/learn-from-adjustment` - 学习用户调整
  \`\`\`typescript
  // 请求
  {
    "taskId": 123,
    "newUrgency": 95,
    "newImportance": 85
  }

  // 响应（后台异步处理）
  { "success": true }
  \`\`\`

### 任务操作（Server Actions）
所有任务操作使用Server Actions而非REST API：
\`\`\`typescript
// app/db/actions.ts
export async function createTask(projectId, description, urgency, importance, assigneeIds)
export async function updateTask(taskId, urgency, importance, description?, assigneeIds?)
export async function deleteTask(taskId)
export async function completeTask(taskId) // 归档
export async function restoreTask(taskId) // 恢复
\`\`\`

---

## 关键配置

### 环境变量
\`\`\`bash
# 数据库
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require

# 认证（二选一）
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# JWT（备用）
JWT_SECRET=your-secret-key-at-least-32-chars

# AI服务
QWEN_API_KEY=sk-...              # 阿里云通义千问（首选）
ANTHROPIC_API_KEY=sk-ant-...     # Claude API（备用）

# Stripe（可选）
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
\`\`\`

### Next.js配置
\`\`\`typescript
// next.config.js
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
}
\`\`\`

---

## 性能优化策略

### 前端优化
1. **React优化**：
   - `React.memo()` 包裹大型组件
   - `useMemo()` 缓存计算结果
   - `useCallback()` 稳定函数引用
   - `useTransition()` 非阻塞更新

2. **渲染优化**：
   - 虚拟化长列表（评论、任务列表）
   - 懒加载图片和组件
   - 防抖/节流用户输入

3. **网络优化**：
   - 乐观更新减少等待时间
   - 批量API调用
   - 智能同步间隔

### 数据库优化
1. **查询优化**：
   - 使用索引（project_id, user_id, updated_at）
   - LEFT JOIN减少查询次数
   - 批量插入/更新

2. **连接池**：
   - Neon Serverless自动管理连接
   - 边缘网络加速

---

## 安全性

### 认证安全
- bcrypt密码哈希（10轮）
- JWT签名验证（HS256）
- HTTP-only Cookie防XSS
- CSRF保护（SameSite: lax）

### 授权检查
\`\`\`typescript
// 每个操作前验证
const userId = await getUserId()
if (!userId) return { error: 'Not authenticated' }

const hasAccess = await getUserProjectAccess(userId, projectId)
if (!hasAccess) return { error: 'Access denied' }
\`\`\`

### 数据验证
- Drizzle ORM自动参数化查询（防SQL注入）
- Zod schema验证输入
- React自动转义输出（防XSS）

---

## 移动端开发建议

### 功能差异

#### 平板版（与网页版基本一致）
✅ Map View（四象限矩阵）
✅ List View（列表视图）
✅ Quick Add（批量任务创建）⭐
✅ Task Detail（任务详情）
✅ Real-time Sync（实时同步）
✅ Comments（评论系统）
✅ Organize（智能整理）

#### 手机版（简化版）
❌ Map View（移除，屏幕太小）
✅ List View（主界面）
✅ Quick Add（批量任务创建）⭐核心功能
✅ Task Detail（任务详情）
✅ Real-time Sync（实时同步）
✅ Comments（评论系统）
❌ Organize（移除，无map view不需要）
✅ Swipe Actions（滑动操作：完成/删除）

---

## 技术债务和改进方向

### 已知问题
1. ✅ **已修复**：任务更新失败时编辑框意外关闭
2. ✅ **已修复**：评论添加失败时无错误提示
3. ⚠️ **待优化**：同步冲突处理（当前基于时间戳，可能丢失并发更新）
4. ⚠️ **待优化**：大量任务时性能下降（考虑虚拟化）

### 未实现功能
1. 推送通知（任务分配、评论提醒）
2. 离线模式完整支持（PWA Service Worker）
3. 任务依赖约束（前置任务完成才能开始）
4. 重复任务（每日/每周/每月）
5. 时间跟踪（番茄钟集成）
6. 甘特图/看板视图
7. 数据导出（CSV/JSON）
8. 任务模板库

---

## 总结

Quadrant Task Manager是一个功能完善的任务管理系统，核心优势：

1. **AI驱动**：智能任务优先级预测和学习系统
2. **实时协作**：多用户同时在线编辑
3. **可视化**：艾森豪威尔矩阵直观展示优先级
4. **灵活性**：支持个人和团队项目
5. **响应式**：适配桌面、平板、移动设备

**Quick Add功能**是整个系统的核心，结合AI预测和实时同步，为用户提供极致的任务创建体验。

---

**文档版本**: 1.0
**最后更新**: 2025-11-09
**作者**: Claude Code
**用途**: 移动端/平板应用开发参考
