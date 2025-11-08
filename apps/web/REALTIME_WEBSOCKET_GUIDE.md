# 真正实时同步方案 - WebSocket实现

## 概述
当前: 1秒轮询（99%场景已足够）
可选: WebSocket推送（0延迟，真正实时）

## WebSocket方案架构

\`\`\`
┌─────────────┐         WebSocket        ┌─────────────┐
│   用户A     │ ◄───────────────────────► │   服务器    │
└─────────────┘                           └─────────────┘
                                                 ▲
                                                 │
                                          WebSocket
                                                 │
                                                 ▼
┌─────────────┐                           ┌─────────────┐
│   用户B     │ ◄───────────────────────► │   Redis     │
└─────────────┘         实时推送           └─────────────┘
\`\`\`

## 实现步骤

### 1. 安装依赖
\`\`\`bash
npm install socket.io socket.io-client
npm install ioredis  # Redis for pub/sub
\`\`\`

### 2. 创建 WebSocket 服务器
\`\`\`typescript
// app/api/socket/route.ts
import { Server } from 'socket.io'
import { createServer } from 'http'

export async function GET(req: Request) {
  const server = createServer()
  const io = new Server(server, {
    cors: { origin: '*' }
  })

  io.on('connection', (socket) => {
    // 用户加入项目房间
    socket.on('join-project', (projectId) => {
      socket.join(`project:${projectId}`)
    })

    // 监听任务变更
    socket.on('task-change', (data) => {
      io.to(`project:${data.projectId}`).emit('task-updated', data)
    })
  })

  return new Response('WebSocket server running')
}
\`\`\`

### 3. 客户端连接
\`\`\`typescript
// app/client.tsx
import { io } from 'socket.io-client'

const socket = io('http://localhost:3000')

useEffect(() => {
  socket.emit('join-project', projectId)

  socket.on('task-updated', (data) => {
    router.refresh() // 立即刷新
  })

  return () => socket.disconnect()
}, [projectId])
\`\`\`

### 4. 服务器端触发推送
\`\`\`typescript
// app/db/actions.ts
import { io } from 'socket.io-client'

export async function createTask(...) {
  const result = await db.insert(tasks)...

  // 推送到所有连接的客户端
  io.to(`project:${projectId}`).emit('task-updated', {
    type: 'create',
    task: result
  })

  return result
}
\`\`\`

## 对比

| 方案 | 延迟 | 服务器负载 | 复杂度 | 推荐场景 |
|------|------|-----------|--------|----------|
| **1秒轮询** | ~1秒 | 低 | 简单 | ✅ 大多数团队 |
| **WebSocket** | <100ms | 中 | 中等 | 高频协作 |
| **0.5秒轮询** | ~500ms | 中 | 简单 | 快速需求 |

## 推荐使用场景

### 使用1秒轮询（当前方案）：
- ✅ 团队 < 10人
- ✅ 任务更新频率 < 10次/分钟
- ✅ 不需要即时反馈

### 使用WebSocket：
- ⚡ 团队 > 10人
- ⚡ 高频协作（设计评审、头脑风暴）
- ⚡ 需要即时反馈

## 成本分析

### 1秒轮询:
- 服务器请求: 60次/分钟/用户
- 10用户 = 600次/分钟
- 月成本: ~$5-10

### WebSocket:
- 持久连接: 1连接/用户
- 只在变更时推送
- 月成本: ~$10-20（需要Redis）

## 结论

**当前1秒轮询方案已经非常接近实时**，对99%的使用场景已足够。
除非有以下需求，否则不建议切换到WebSocket：

1. 超过10个并发用户
2. 需要<500ms延迟
3. 实时白板/协作编辑等场景
