# 未来Monorepo配置预览

## 📦 目标结构

```
quadrants/                              # 新的Git根目录
├── apps/
│   ├── web/                           # 🌐 Next.js网页版
│   │   ├── app/                       # 现有的app目录
│   │   ├── components/                # 现有的components
│   │   ├── lib/                       # 现有的lib
│   │   ├── package.json
│   │   ├── next.config.js
│   │   ├── tsconfig.json
│   │   └── vercel.json                # Web部署配置
│   │
│   └── mobile/                        # 📱 React Native移动端（新建）
│       ├── app/                       # Expo Router页面
│       ├── components/                # 移动端组件
│       ├── package.json
│       ├── app.json                   # Expo配置
│       └── tsconfig.json
│
├── packages/                          # 📦 共享包
│   ├── shared/                        # 共享业务逻辑
│   │   ├── types/                     # TypeScript类型
│   │   ├── utils/                     # 工具函数
│   │   ├── api/                       # API客户端
│   │   ├── constants/                 # 常量
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── database/                      # 数据库Schema
│   │   ├── schema.ts                  # Drizzle Schema
│   │   ├── migrations/                # 数据库迁移
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── ui-primitives/                 # UI逻辑（无平台依赖）
│       ├── hooks/                     # 共享Hooks
│       ├── logic/                     # 业务逻辑
│       ├── package.json
│       └── tsconfig.json
│
├── package.json                       # Workspace根配置
├── turbo.json                         # Turborepo配置 ✅已创建
├── tsconfig.json                      # 根TypeScript配置
├── .gitignore
└── README.md
```

---

## 🔧 Workspace配置（package.json）

```json
{
  "name": "quadrants-monorepo",
  "version": "1.0.0",
  "private": true,
  "workspaces": [
    "apps/*",
    "packages/*"
  ],
  "scripts": {
    "dev": "turbo run dev",
    "dev:web": "turbo run dev --filter=web",
    "dev:mobile": "turbo run dev --filter=mobile",
    "build": "turbo run build",
    "build:web": "turbo run build --filter=web",
    "build:mobile": "turbo run build --filter=mobile",
    "lint": "turbo run lint",
    "typecheck": "turbo run typecheck",
    "clean": "turbo run clean && rm -rf node_modules"
  },
  "devDependencies": {
    "turbo": "^2.0.0",
    "typescript": "^5.3.3"
  }
}
```

---

## 📝 共享包示例

### packages/shared/types/index.ts

```typescript
// ✅ 100%代码复用
export interface Task {
  id: number
  description: string
  urgency: number
  importance: number
  assignees: Player[]
  comments: Comment[]
  created_at: Date
  updated_at: Date
}

export interface Player {
  id: number
  name: string
  color: string
  project_id: string
}

export interface Comment {
  id: number
  task_id: number
  content: string
  author_name: string
  created_at: Date
}

// ... 所有类型定义
```

### packages/shared/utils/priority.ts

```typescript
// ✅ 100%代码复用
export function calculatePriorityScore(
  urgency: number,
  importance: number
): number {
  return urgency * 0.5 + importance * 0.5
}

export function getQuadrantLabel(
  urgency: number,
  importance: number
): string {
  if (urgency >= 50 && importance >= 50) return "Important & Urgent"
  if (urgency < 50 && importance >= 50) return "Important & Not Urgent"
  if (urgency >= 50 && importance < 50) return "Urgent & Not Important"
  return "Neither Important nor Urgent"
}

export function getQuadrantColor(
  urgency: number,
  importance: number
): string {
  if (urgency >= 50 && importance >= 50) return "#ef4444"
  if (urgency < 50 && importance >= 50) return "#3b82f6"
  if (urgency >= 50 && importance < 50) return "#f59e0b"
  return "#6b7280"
}
```

### packages/shared/api/tasks.ts

```typescript
// ✅ 100%代码复用
import { Task } from '../types'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://quadrants.vercel.app'

export async function getTasks(projectId: string): Promise<Task[]> {
  const response = await fetch(`${API_URL}/api/projects/${projectId}/tasks`)
  return response.json()
}

export async function createTask(
  projectId: string,
  data: {
    description: string
    urgency: number
    importance: number
    assigneeIds: number[]
  }
): Promise<Task> {
  const response = await fetch(`${API_URL}/api/projects/${projectId}/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  return response.json()
}

// ... 所有API方法
```

### packages/shared/api/ai.ts

```typescript
// ✅ 100%代码复用 - AI功能核心
export interface TaskPrediction {
  description: string
  urgency: number
  importance: number
}

export async function predictTaskPriorities(
  tasks: string[],
  projectId: string
): Promise<TaskPrediction[]> {
  const response = await fetch(`${API_URL}/api/ai/predict-tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tasks, projectId })
  })

  const result = await response.json()
  return result.predictions
}
```

---

## 🌐 Web应用（apps/web）

### apps/web/package.json

```json
{
  "name": "web",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "15.2.4",
    "react": "19.0.0",
    "@quadrants/shared": "workspace:*",
    "@quadrants/database": "workspace:*"
  }
}
```

### apps/web/components/TaskList.tsx

```typescript
// 使用共享类型和工具
import { Task } from '@quadrants/shared/types'
import { calculatePriorityScore } from '@quadrants/shared/utils/priority'

export function TaskList({ tasks }: { tasks: Task[] }) {
  return (
    <div>
      {tasks.map(task => (
        <div key={task.id}>
          {task.description}
          <span>Score: {calculatePriorityScore(task.urgency, task.importance)}</span>
        </div>
      ))}
    </div>
  )
}
```

---

## 📱 移动应用（apps/mobile）

### apps/mobile/package.json

```json
{
  "name": "mobile",
  "version": "1.0.0",
  "main": "expo-router",
  "scripts": {
    "dev": "expo start",
    "build:ios": "eas build --platform ios",
    "build:android": "eas build --platform android"
  },
  "dependencies": {
    "expo": "~52.0.0",
    "expo-router": "~4.0.0",
    "react-native": "0.76.3",
    "@quadrants/shared": "workspace:*"
  }
}
```

### apps/mobile/components/TaskList.tsx

```typescript
// 使用相同的共享代码，但UI层用React Native
import { View, Text, FlatList } from 'react-native'
import { Task } from '@quadrants/shared/types'
import { calculatePriorityScore } from '@quadrants/shared/utils/priority'

export function TaskList({ tasks }: { tasks: Task[] }) {
  return (
    <FlatList
      data={tasks}
      renderItem={({ item: task }) => (
        <View>
          <Text>{task.description}</Text>
          <Text>Score: {calculatePriorityScore(task.urgency, task.importance)}</Text>
        </View>
      )}
    />
  )
}
```

---

## 🔄 代码复用示例

### Quick Add功能（⭐核心功能）

#### 共享逻辑（packages/shared/api/ai.ts）

```typescript
// ✅ 100%复用
export async function bulkAddTasks(
  descriptions: string[],
  projectId: string
) {
  // 1. AI预测优先级
  const predictions = await predictTaskPriorities(descriptions, projectId)

  // 2. 批量创建任务
  const tasks = await Promise.all(
    predictions.map(pred =>
      createTask(projectId, {
        description: pred.description,
        urgency: pred.urgency,
        importance: pred.importance,
        assigneeIds: []
      })
    )
  )

  return tasks
}
```

#### Web UI（apps/web/components/BulkTaskInput.tsx）

```typescript
import { useState } from 'react'
import { bulkAddTasks } from '@quadrants/shared/api/ai'

export function BulkTaskInput() {
  const [input, setInput] = useState('')

  const handleSubmit = async () => {
    const tasks = input.split('\n').filter(t => t.trim())
    await bulkAddTasks(tasks, projectId)
  }

  return (
    <div>
      <textarea value={input} onChange={e => setInput(e.target.value)} />
      <button onClick={handleSubmit}>Add Tasks</button>
    </div>
  )
}
```

#### Mobile UI（apps/mobile/components/QuickAdd.tsx）

```typescript
import { useState } from 'react'
import { View, TextInput, Button } from 'react-native'
import { bulkAddTasks } from '@quadrants/shared/api/ai'

export function QuickAdd() {
  const [input, setInput] = useState('')

  const handleSubmit = async () => {
    const tasks = input.split('\n').filter(t => t.trim())
    await bulkAddTasks(tasks, projectId)
  }

  return (
    <View>
      <TextInput value={input} onChangeText={setInput} multiline />
      <Button title="Add Tasks" onPress={handleSubmit} />
    </View>
  )
}
```

**关键**: AI预测逻辑完全相同，只有UI不同！

---

## 🚀 Vercel部署（Monorepo）

### 根目录vercel.json

```json
{
  "version": 2,
  "builds": [
    {
      "src": "apps/web/package.json",
      "use": "@vercel/next",
      "config": {
        "buildCommand": "cd ../.. && npx turbo run build --filter=web"
      }
    }
  ]
}
```

### apps/web/vercel.json

```json
{
  "buildCommand": "cd ../.. && npx turbo run build --filter=web",
  "outputDirectory": ".next",
  "installCommand": "npm install --prefix ../..",
  "framework": "nextjs"
}
```

### 部署流程

```bash
# 1. 改动Web代码
git add apps/web/
git commit -m "feat: update web UI"
git push

# 2. Vercel检测变更
↓ 检测到apps/web变更
↓ 只构建web应用（~2分钟）
↓ 部署成功

# 3. 改动shared包
git add packages/shared/
git commit -m "refactor: update priority logic"
git push

# 4. Vercel智能处理
↓ 检测到shared变更
↓ 识别web依赖shared
↓ 重新构建web（~2分钟）
↓ 部署成功

# 5. 改动mobile代码
git add apps/mobile/
git commit -m "feat: add mobile UI"
git push

# 6. Vercel跳过构建
↓ 只有mobile变更
↓ Web无需重新构建
↓ 不触发部署（节省时间）
```

---

## 📊 性能对比

| 场景 | 当前单一项目 | Monorepo (缓存命中) | Monorepo (需构建) |
|------|-------------|---------------------|------------------|
| 只改Web UI | 2分钟 | 30秒 | 2分钟 |
| 只改Mobile | N/A | 0秒 | 0秒 |
| 改Shared | N/A | 30秒 | 2分钟 |
| 全部改动 | 2分钟 | N/A | 2分钟 |

---

## 🎯 迁移计划

### 阶段1: 准备（已完成✅）
- ✅ 创建turbo.json
- ✅ 创建vercel.json
- ✅ 配置文档

### 阶段2: 创建Monorepo结构（1天）
```bash
1. 创建新目录quadrants/
2. 移动现有项目到apps/web/
3. 创建packages/shared/
4. 提取共享代码
5. 配置workspace
```

### 阶段3: 创建React Native应用（2周）
```bash
1. 创建apps/mobile/
2. 配置Expo
3. 实现List View
4. 实现Quick Add
5. 集成共享API
```

### 阶段4: 完善和优化（1周）
```bash
1. 优化构建配置
2. 添加测试
3. 完善文档
4. 性能优化
```

---

## 💡 关键优势

### 代码复用率

| 功能模块 | 复用率 | 说明 |
|---------|--------|------|
| **类型定义** | 100% | Task, Player, Comment等 |
| **业务逻辑** | 100% | 优先级计算、象限分类 |
| **API调用** | 100% | 所有HTTP请求 |
| **AI功能** | 100% | Quick Add核心逻辑 |
| **工具函数** | 100% | 日期、格式化等 |
| **UI组件** | 0% | 平台特定 |
| **路由** | 0% | 平台特定 |
| **总计** | 60-80% | **极高复用率** |

### 一次修改，多端同步

```typescript
// 场景：修改优先级计算公式
// 位置：packages/shared/utils/priority.ts

// 修改前
export function calculatePriorityScore(u: number, i: number) {
  return u * 0.5 + i * 0.5  // 平均值
}

// 修改后
export function calculatePriorityScore(u: number, i: number) {
  return u * 0.4 + i * 0.6  // 重要度权重更高
}

// 结果：
✅ Web应用自动使用新公式
✅ Mobile应用自动使用新公式
✅ 无需任何额外代码
```

---

**准备完成**: ✅
**配置文件**: turbo.json, vercel.json
**下一步**: 开始创建Monorepo还是继续完善现有网页版？
