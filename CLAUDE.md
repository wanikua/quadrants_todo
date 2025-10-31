# Claude Configuration

This file contains configuration and context for Claude Code to better understand and work with this project.

## Project Overview

**Quadrant Task Manager** is a modern web application built with Next.js that implements the Eisenhower Matrix (Importance-Urgency quadrant system) for task prioritization and management. The application provides both online database-backed functionality and offline local storage mode.

### Core Features

1. **Quadrant Matrix Visualization**
   - Interactive 2D grid where tasks are positioned based on urgency (X-axis) and importance (Y-axis)
   - Real-time visual representation of task priorities using the Eisenhower Matrix
   - Long-press functionality to create tasks directly on the matrix at specific coordinates
   - Hover tooltips showing task details and coordinates

2. **Task Management**
   - Create, read, update, delete (CRUD) operations for tasks
   - Each task has: description, urgency (0-100), importance (0-100), assignees, comments, timestamps
   - Automatic quadrant classification: Important & Urgent, Important & Not Urgent, etc.
   - Task detail dialog with comprehensive editing capabilities
   - Batch operations and optimized state management
   - AI-powered bulk add and task organization features

3. **Bulk Add Tasks (AI-Powered)**
   - Paste multiple tasks at once (line-separated text input)
   - AI automatically assigns urgency and importance values for each task
   - Smart positioning to avoid overlaps from the start
   - Instant task creation with optimized database operations
   - Perfect for quickly migrating task lists or brainstorming sessions

4. **AI-Powered Task Organization**
   - Intelligent task repositioning using physics-based repulsion algorithm
   - Automatically spreads overlapping tasks for better visual clarity
   - Maintains center point at matrix origin (50, 50) through normalization
   - Preserves relative priority order of tasks
   - Preview mode to review changes before applying
   - One-click accept or revert functionality
   - Optimized for instant UI feedback with background database saves

5. **Player/Team Management** 
   - Create and manage team members with unique colors
   - Assign multiple players to tasks
   - Visual color-coding throughout the interface
   - Player deletion with automatic task reassignment handling

6. **Task Relationships**
   - Draw connecting lines between related tasks
   - Toggle drawing mode to visually map task dependencies
   - Click-based line creation with automatic arrow styling
   - Line deletion capabilities

7. **Comments System**
   - Add threaded comments to tasks
   - Author attribution with timestamps
   - Comment deletion functionality
   - Integrated into task detail views

8. **Database Integration**
   - PostgreSQL database via Neon for persistent storage
   - Automatic database initialization and schema setup
   - Graceful fallback to offline mode when database unavailable
   - Real-time data synchronization

9. **Offline Mode**
   - Local storage persistence when database is unavailable
   - Full functionality maintained without server connection
   - Data import/export capabilities via localStorage
   - Seamless mode switching

10. **Responsive Design**
   - Mobile-first responsive layout
   - Touch-optimized interactions for mobile devices
   - Adaptive UI components (Sheet vs Dialog based on screen size)
   - Optimized performance for various device types

11. **Access Control**
   - Simple access code authentication system
   - Session persistence via localStorage
   - Logout functionality with data cleanup

## Development Commands

\`\`\`bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Build project
npm run build

# Lint code
npm run lint

# Type check
npm run typecheck
\`\`\`

## Project Structure

\`\`\`
app/
├── actions.ts              # Server actions for database operations
├── api/                    # API routes
│   ├── setup-db/          # Database initialization endpoint
│   ├── test-clerk/        # Authentication testing
│   └── test-db/           # Database connection testing
├── client.tsx             # Main client component with state management
├── globals.css            # Global styles
├── layout.tsx             # Root layout component
├── page.tsx               # Main page component
├── setup/                 # Database setup page
└── test/                  # Testing utilities

components/
├── OptimizedInput.tsx     # Performance-optimized input component
├── QuadrantMatrix.tsx     # Main matrix visualization component
├── TaskDetailDialog.tsx   # Task detail/edit dialog component
├── TaskDialogs.tsx        # Task and player creation dialogs
├── TaskSegment.tsx        # Individual task visualization component
├── access-code-form.tsx   # Authentication form component
├── theme-provider.tsx     # Theme context provider
└── ui/                    # Shadcn/ui component library

lib/
├── database.ts            # Database connection and query functions
└── utils.ts               # Utility functions

scripts/
└── *.sql                  # Database schema and initialization scripts
\`\`\`

### Key Technologies

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS, Shadcn/ui components
- **Database**: PostgreSQL (Neon), SQL queries
- **State Management**: React hooks, useReducer, localStorage
- **Performance**: React.memo, useMemo, useCallback, useTransition
- **Mobile**: Responsive design, touch events, PWA-ready

### Data Models

- **Task**: id, description, urgency, importance, created_at, assignees[], comments[]
- **Player**: id, name, color, created_at  
- **Line**: id, from_task_id, to_task_id, style, size, color, created_at
- **Comment**: id, task_id, content, author_name, created_at

## Clerk Authentication Troubleshooting

### Critical Issues in Your Current Implementation

Based on analysis of your codebase, here are the specific issues preventing Clerk from connecting:

#### 1. Missing .env.local File

**Problem**: The `.env.local` file doesn't exist in your project root

**Solution**: Create `.env.local` in your project root:
\`\`\`bash
# Create the file
touch .env.local

# Add your Clerk keys (get these from https://dashboard.clerk.com)
echo "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your-actual-key-here" >> .env.local
echo "CLERK_SECRET_KEY=sk_test_your-actual-key-here" >> .env.local
\`\`\`

#### 2. Environment Variables Default to Empty Strings

**Problem**: Your `lib/env.ts` defaults to empty strings when env vars are missing:
\`\`\`typescript
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || "",
\`\`\`

**Solution**: Add validation to fail fast when keys are missing:
\`\`\`typescript
// lib/env.ts
export const env = {
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || "",
  CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY || "",
  DATABASE_URL: process.env.DATABASE_URL || "",
}

// Add this validation
if (!env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || !env.CLERK_SECRET_KEY) {
  console.error("❌ Clerk environment variables are missing!")
  console.error("Please create a .env.local file with:")
  console.error("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...")
  console.error("CLERK_SECRET_KEY=sk_test_...")
}
\`\`\`

#### 3. ClerkProvider Missing Explicit Configuration

**Problem**: Your `app/layout.tsx` doesn't pass the publishable key to ClerkProvider

**Current code**:
\`\`\`tsx
<ClerkProvider>
\`\`\`

**Solution**: Update to explicitly pass the key:
\`\`\`tsx
<ClerkProvider 
  publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
  afterSignInUrl="/projects"
  afterSignUpUrl="/projects"
>
\`\`\`

#### 4. Version Stability Issues

**Problem**: Using `"@clerk/nextjs": "latest"` can introduce breaking changes

**Solution**: Pin to a stable version:
\`\`\`bash
npm uninstall @clerk/nextjs
npm install @clerk/nextjs@^5.7.1
\`\`\`

### Step-by-Step Fix Guide

1. **Create .env.local**:
   \`\`\`bash
   # In your project root
   cat > .env.local << 'EOF'
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your-key-here
   CLERK_SECRET_KEY=sk_test_your-key-here
   DATABASE_URL=your-database-url-here
   EOF
   \`\`\`

2. **Get Your Clerk Keys**:
   - Go to https://dashboard.clerk.com
   - Select your application (or create one)
   - Copy the **Development** keys
   - Replace the placeholder values in `.env.local`

3. **Test Your Configuration**:
   \`\`\`bash
   # Clear cache and restart
   rm -rf .next
   npm run dev
   
   # Visit this URL to verify
   # http://localhost:3000/api/test-clerk
   \`\`\`

4. **Update ClerkProvider** in `app/layout.tsx`:
   \`\`\`tsx
   <ClerkProvider 
     publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
     appearance={{
       variables: { colorPrimary: "#6c47ff" }
     }}
   >
   \`\`\`

5. **Check Browser Console**:
   - Open Developer Tools (F12)
   - Look for Clerk-related errors
   - Common errors:
     - "Clerk: publishableKey not found" → Missing env vars
     - "Network error" → Check firewall/proxy
     - "Invalid key format" → Wrong key type (dev vs prod)

### Quick Diagnostic Commands

\`\`\`bash
# 1. Check if .env.local exists
ls -la .env.local

# 2. Verify environment variables are loaded
node -e "console.log(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY)"

# 3. Test Clerk configuration
curl http://localhost:3000/api/test-clerk

# 4. Check for TypeScript errors
npm run typecheck
\`\`\`

### Common Mistakes to Avoid

1. **Wrong Key Format**:
   - ❌ `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."` (with quotes)
   - ✅ `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...` (no quotes)

2. **Wrong Key Type**:
   - ❌ Using production keys for development
   - ✅ Using development keys locally

3. **File Location**:
   - ❌ `.env.local` in `/app` or `/src`
   - ✅ `.env.local` in project root

4. **Template Values**:
   - ❌ `pk_test_your-actual-key-here` (keeping placeholder)
   - ✅ `pk_test_c2VjcmV0LWtleS1mb3ItY2xlcms...` (actual key)

### If Still Not Working

1. **Check Clerk Dashboard**:
   - Ensure your app exists
   - Verify localhost:3000 is in allowed origins
   - Check if keys are active

2. **Network Issues**:
   \`\`\`bash
   # Test Clerk API connectivity
   curl -I https://api.clerk.com/v1/client
   \`\`\`

3. **Clear All Caches**:
   \`\`\`bash
   rm -rf .next node_modules/.cache
   npm install
   npm run dev
   \`\`\`

4. **Enable Debug Mode**:
   Add to `.env.local`:
   \`\`\`
   CLERK_LOGGING=true
   \`\`\`

### Emergency Fallback

Your app already supports offline mode. If Clerk fails:
1. The app will automatically detect missing auth
2. Fall back to localStorage-based functionality
3. All features work without authentication

## Current Application Status (2025-09-22)

### 功能实现状态

#### ✅ 已实现功能
1. **核心功能**
   - 四象限任务管理矩阵（基于紧急度和重要度）
   - 任务CRUD操作（创建、读取、更新、删除）
   - 玩家/团队成员管理
   - 任务关系连线功能
   - 评论系统
   - 项目管理（多项目支持）

2. **数据存储**
   - PostgreSQL数据库集成（通过Neon）
   - 本地存储离线模式
   - 自动数据库/离线模式切换

3. **认证系统**
   - Clerk身份验证集成
   - 项目访问码验证
   - 用户会话管理

4. **UI/UX**
   - 响应式设计
   - 触摸优化交互
   - 暗色/亮色主题切换
   - 拖拽和长按创建任务

### 当前存在的问题

#### 🔴 严重问题
1. **TypeScript类型错误（16个）**
   - `app/actions.ts:344` - line参数缺少类型声明
   - `app/client.tsx:1` - 缺少types模块文件
   - `app/client.tsx:27` - 类型不匹配（string[]与number[]）
   - `app/layout.tsx:20` - headers异步API使用错误
   - `app/projects/[projectId]/page.tsx:42` - 组件属性不匹配
   - `components/TaskDetailDialog.tsx:169` - Task类型缺少updated_at属性
   - `components/ui/chart.tsx` - 多个类型定义问题
   - `lib/kv.ts:4` - 缺少@upstash/redis类型声明
   - `lib/project-database.ts:162` - project参数缺少类型

#### 🟡 中等问题
2. **依赖管理问题**
   - 几乎所有依赖使用"latest"版本（版本不稳定风险）
   - 安装了大量未使用的数据库驱动（pg, mysql2, sqlite3, better-sqlite3等）
   - 包体积过大，影响构建和加载性能

3. **配置缺失**
   - 缺少typecheck脚本命令
   - ESLint未完成配置
   - 缺少pre-commit hooks
   - 缺少CI/CD配置

4. **错误处理不完善**
   - catch块仅console.error输出，未向用户展示友好错误信息
   - 数据库操作失败时缺少事务回滚机制
   - 缺少全局错误边界的完整实现
   - API错误响应格式不统一

#### 🟢 优化建议
5. **性能优化**
   - 未配置生产环境构建优化
   - 数据库查询未优化（缺少索引、批量查询等）
   - 缺少数据缓存机制（Redis/内存缓存）
   - 组件重渲染优化不足

6. **安全性问题**
   - 环境变量包含敏感信息（需要.env.example文件）
   - 缺少输入验证和清理
   - SQL注入防护依赖ORM，原生查询存在风险
   - CORS配置过于宽松

7. **代码组织**
   - 业务逻辑混杂在组件中（需要提取到services层）
   - 数据库操作分散在多个文件
   - 缺少统一的API客户端
   - 类型定义分散，缺少中央types文件

8. **开发体验**
   - 缺少开发文档
   - 缺少单元测试和集成测试
   - 缺少Storybook组件文档
   - 本地开发环境搭建复杂

### 待实现功能
- 任务优先级排序算法
- 任务提醒和通知
- 数据导入导出功能
- 任务模板
- 批量操作
- 任务历史记录
- 团队协作实时同步
- 移动端APP
- 数据分析和报表

## Notes

- The application automatically detects database availability and switches between online/offline modes
- All state changes are optimized with React performance patterns
- The matrix uses percentage-based positioning for precise task placement
- Color coding is consistent throughout the interface for visual coherence
- The app is designed to be intuitive for both technical and non-technical users

# important-instruction-reminders
Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.
