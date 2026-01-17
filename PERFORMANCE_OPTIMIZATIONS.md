# Performance Optimization Report

## Issues Found and Recommendations

### 1. 🔴 **Critical: Database Missing Indexes**

**Problem**: Key database columns lack indexes, causing slow queries.

**Impact**: Every sync query (1.5-3 seconds) does full table scans.

**Fix Required**: Add indexes to schema
```typescript
// app/db/schema.ts - Add these indexes:

import { index } from 'drizzle-orm/pg-core'

// Add to tasks table
export const tasks = pgTable('tasks', {
  // ... existing fields
}, (table) => ({
  projectIdIdx: index('tasks_project_id_idx').on(table.project_id),
  archivedIdx: index('tasks_archived_idx').on(table.archived),
  projectArchivedIdx: index('tasks_project_archived_idx').on(table.project_id, table.archived),
  updatedAtIdx: index('tasks_updated_at_idx').on(table.updated_at),
}))

// Add to taskAssignments table
export const taskAssignments = pgTable('task_assignments', {
  // ... existing fields
}, (table) => ({
  taskIdIdx: index('task_assignments_task_id_idx').on(table.task_id),
  playerIdIdx: index('task_assignments_player_id_idx').on(table.player_id),
}))

// Add to players table
export const players = pgTable('players', {
  // ... existing fields
}, (table) => ({
  projectIdIdx: index('players_project_id_idx').on(table.project_id),
}))

// Add to lines table
export const lines = pgTable('lines', {
  // ... existing fields
}, (table) => ({
  projectIdIdx: index('lines_project_id_idx').on(table.project_id),
  fromTaskIdIdx: index('lines_from_task_id_idx').on(table.from_task_id),
  toTaskIdIdx: index('lines_to_task_id_idx').on(table.to_task_id),
}))
```

**Migration Command**:
```bash
npx drizzle-kit generate:pg
npx drizzle-kit push:pg
```

---

### 2. 🟡 **High: Excessive Console Logging**

**Problem**: 229 console.log/console.error calls throughout the codebase.

**Impact**:
- Slows down runtime (especially in sync loops)
- Large production bundle size
- Memory leaks from retained log objects

**Files with most logs**:
- `app/client.tsx`: 47 logs
- `app/api/stripe/webhook/route.ts`: 17 logs
- `app/api/ai/organize-tasks/route.ts`: 18 logs

**Fix**: Create a debug utility
```typescript
// lib/debug.ts
const isDev = process.env.NODE_ENV === 'development'

export const debug = {
  log: (...args: any[]) => {
    if (isDev) console.log(...args)
  },
  error: (...args: any[]) => {
    if (isDev) console.error(...args)
  },
  warn: (...args: any[]) => {
    if (isDev) console.warn(...args)
  }
}

// Replace all console.log with debug.log
// Production builds will tree-shake these
```

---

### 3. 🟡 **High: Sync Performance Issues**

**Problem**: Sync runs every 1.5-3 seconds with complex merge logic.

**Current Issues**:
- Full data fetch even when nothing changed
- Complex O(n²) merge algorithm
- No ETag/If-Modified-Since headers
- No incremental updates

**Optimizations**:

#### 3.1. Add ETag Support
```typescript
// app/api/projects/[projectId]/sync/route.ts
export async function GET(request: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params

  // Get latest update timestamp
  const lastUpdate = await sql`
    SELECT MAX(updated_at) as last_update FROM (
      SELECT updated_at FROM tasks WHERE project_id = ${projectId} AND (archived = false OR archived IS NULL)
      UNION ALL
      SELECT updated_at FROM projects WHERE id = ${projectId}
    ) as updates
  `

  const etag = lastUpdate[0]?.last_update?.getTime().toString()
  const clientEtag = request.headers.get('if-none-match')

  // Return 304 Not Modified if nothing changed
  if (etag && clientEtag === etag) {
    return new NextResponse(null, {
      status: 304,
      headers: { 'ETag': etag }
    })
  }

  // ... rest of sync logic

  return NextResponse.json({ /* data */ }, {
    headers: { 'ETag': etag || '' }
  })
}
```

#### 3.2. Client-side optimization
```typescript
// app/client.tsx - Add ETag tracking
const [lastEtag, setLastEtag] = useState<string | null>(null)

const syncData = useCallback(async () => {
  const headers: HeadersInit = {}
  if (lastEtag) {
    headers['if-none-match'] = lastEtag
  }

  const response = await fetch(`/api/projects/${projectId}/sync`, { headers })

  if (response.status === 304) {
    // No changes, skip update
    return
  }

  const etag = response.headers.get('etag')
  if (etag) setLastEtag(etag)

  // ... process data
}, [projectId, lastEtag])
```

---

### 4. 🟠 **Medium: React Re-render Issues**

**Problem**: Components re-render unnecessarily.

**Issues Found**:

#### 4.1. TaskSegment Not Memoized Properly
```typescript
// components/TaskSegment.tsx
// Already has React.memo but the parent passes new objects every render

// Fix in parent components:
const TaskList = ({ tasks }: { tasks: Task[] }) => {
  return tasks.map(task => (
    <TaskSegment
      key={task.id}
      task={task}
      // ❌ BAD: Creates new function every render
      onUpdate={(id) => handleUpdate(id)}

      // ✅ GOOD: Stable reference
      onUpdate={handleUpdate}
    />
  ))
}
```

#### 4.2. Expensive Quadrant Calculations
```typescript
// components/QuadrantMatrix.tsx
// Move expensive calculations outside render

const QuadrantMatrix = ({ tasks }: Props) => {
  // ❌ BAD: Recalculates every render
  const quadrants = {
    'urgent-important': tasks.filter(task =>
      getQuadrant(task.urgency, task.importance) === 'urgent-important'
    ),
    // ...
  }

  // ✅ GOOD: Use useMemo
  const quadrants = useMemo(() => ({
    'urgent-important': tasks.filter(task =>
      getQuadrant(task.urgency, task.importance) === 'urgent-important'
    ),
    'not-urgent-important': tasks.filter(task =>
      getQuadrant(task.urgency, task.importance) === 'not-urgent-important'
    ),
    'urgent-not-important': tasks.filter(task =>
      getQuadrant(task.urgency, task.importance) === 'urgent-not-important'
    ),
    'not-urgent-not-important': tasks.filter(task =>
      getQuadrant(task.urgency, task.importance) === 'not-urgent-not-important'
    ),
  }), [tasks])
}
```

---

### 5. 🟠 **Medium: Bundle Size Optimization**

**Recommendations**:

#### 5.1. Dynamic Imports for Heavy Components
```typescript
// app/projects/[projectId]/page.tsx
import dynamic from 'next/dynamic'

// Lazy load heavy components
const QuadrantMatrixMap = dynamic(
  () => import('@/components/QuadrantMatrixMap'),
  {
    loading: () => <div>Loading...</div>,
    ssr: false // Map doesn't need SSR
  }
)

const TaskDetailDialog = dynamic(
  () => import('@/components/TaskDetailDialog'),
  { ssr: false }
)
```

#### 5.2. Remove Unused Dependencies
```bash
# Check for unused dependencies
npx depcheck

# Potentially remove:
- @stackframe/stack (if not used)
- @upstash/redis (if not used)
- @react-email/render (if not used)
- @vercel/postgres (you're using @neondatabase/serverless)
```

---

### 6. 🟢 **Low: Memory Leaks**

**Potential Issues**:

#### 6.1. Sync Intervals Not Cleared Properly
```typescript
// app/client.tsx - Line 331
useEffect(() => {
  // ⚠️ Multiple cleanup issues possible
  let interval: NodeJS.Timeout | null = null

  // Make sure ALL paths clear the interval
  const cleanup = () => {
    if (interval) {
      clearInterval(interval)
      interval = null
    }
  }

  // ... sync logic

  return cleanup // ✅ Single cleanup point
}, [deps])
```

#### 6.2. Event Listeners Not Removed
```typescript
// app/client.tsx - visibilitychange listener
useEffect(() => {
  const handler = () => { /* ... */ }
  document.addEventListener('visibilitychange', handler)

  return () => {
    document.removeEventListener('visibilitychange', handler)
    // ✅ Add cleanup for intervals too
  }
}, [])
```

---

### 7. 🟢 **Low: Image Optimization**

**Current Issue**: Using `unoptimized` prop on images
```typescript
// app/page.tsx:383
<Image
  src={`https://api.dicebear.com/9.x/avataaars/png?seed=${user.seed}`}
  unoptimized  // ❌ Bypasses Next.js optimization
/>
```

**Better Approach**:
1. Pre-generate common avatars at build time
2. Store in `/public/avatars/`
3. Use optimized Next.js images

---

## Implementation Priority

### Phase 1 (Critical - Do First)
1. ✅ Add database indexes
2. ✅ Implement ETag caching for sync
3. ✅ Replace console.log with debug utility

### Phase 2 (High Priority)
4. Add React.memo and useMemo where needed
5. Optimize sync merge algorithm
6. Fix memory leaks in intervals

### Phase 3 (Nice to Have)
7. Dynamic imports for code splitting
8. Remove unused dependencies
9. Pre-generate avatar images

---

## Expected Performance Improvements

| Optimization | Expected Improvement |
|-------------|---------------------|
| Database indexes | 50-80% faster queries |
| ETag caching | 90% reduction in data transfer |
| Remove console logs | 10-20% faster runtime |
| React memoization | 30-50% fewer re-renders |
| Dynamic imports | 30% smaller initial bundle |

---

## Monitoring Recommendations

Add performance monitoring:
```typescript
// lib/performance.ts
export const measureSync = async (fn: () => Promise<void>) => {
  const start = performance.now()
  await fn()
  const duration = performance.now() - start

  if (duration > 100) {
    console.warn(`Slow sync: ${duration}ms`)
  }

  return duration
}
```

---

## Testing Checklist

Before deploying optimizations:
- [ ] Test sync with 0, 1, 10, 100, 1000 tasks
- [ ] Verify archived tasks don't reappear
- [ ] Check memory usage over 5 minutes
- [ ] Test with slow 3G network
- [ ] Verify multi-user real-time sync still works
- [ ] Check bundle size: `next build`
- [ ] Run Lighthouse audit

---

*Generated: 2026-01-17*
