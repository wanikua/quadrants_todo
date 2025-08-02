# Claude Configuration

This file contains configuration and context for Claude Code to better understand and work with this project.

## Project Overview

**ItsNotAI Task Manager** is a modern web application built with Next.js that implements the Eisenhower Matrix (Importance-Urgency quadrant system) for task prioritization and management. The application provides both online database-backed functionality and offline local storage mode.

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

3. **Player/Team Management** 
   - Create and manage team members with unique colors
   - Assign multiple players to tasks
   - Visual color-coding throughout the interface
   - Player deletion with automatic task reassignment handling

4. **Task Relationships**
   - Draw connecting lines between related tasks
   - Toggle drawing mode to visually map task dependencies
   - Click-based line creation with automatic arrow styling
   - Line deletion capabilities

5. **Comments System**
   - Add threaded comments to tasks
   - Author attribution with timestamps
   - Comment deletion functionality
   - Integrated into task detail views

6. **Database Integration**
   - PostgreSQL database via Neon for persistent storage
   - Automatic database initialization and schema setup
   - Graceful fallback to offline mode when database unavailable
   - Real-time data synchronization

7. **Offline Mode**
   - Local storage persistence when database is unavailable
   - Full functionality maintained without server connection
   - Data import/export capabilities via localStorage
   - Seamless mode switching

8. **Responsive Design**
   - Mobile-first responsive layout
   - Touch-optimized interactions for mobile devices
   - Adaptive UI components (Sheet vs Dialog based on screen size)
   - Optimized performance for various device types

9. **Access Control**
   - Simple access code authentication system
   - Session persistence via localStorage
   - Logout functionality with data cleanup

## Development Commands

```bash
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
```

## Project Structure

```
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
```

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

### Common Issues and Solutions

#### 1. Clerk Not Connecting Despite .env.local

**Problem**: Clerk fails to initialize even with correct environment variables in `.env.local`

**Solutions**:

1. **Verify Environment Variables**:
   ```bash
   # Check if variables are loaded
   npm run dev
   # Visit http://localhost:3000/api/test-clerk
   ```

2. **Check Variable Format**:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` should start with `pk_`
   - `CLERK_SECRET_KEY` should start with `sk_`
   - No quotes around values in `.env.local`
   - No trailing spaces

3. **Clear Next.js Cache**:
   ```bash
   rm -rf .next
   npm run dev
   ```

4. **Verify Clerk Dashboard Settings**:
   - Allowed origins include `http://localhost:3000`
   - Development instance is active
   - API keys match dashboard

#### 2. Version Compatibility Issues

**Problem**: Using `"latest"` version can cause breaking changes

**Solution**: Pin to specific version in `package.json`:
```json
{
  "dependencies": {
    "@clerk/nextjs": "^4.29.0"
  }
}
```

Then reinstall:
```bash
npm install
```

#### 3. Missing ClerkProvider Configuration

**Problem**: ClerkProvider not receiving publishable key

**Solution**: Update `app/layout.tsx`:
```tsx
<ClerkProvider 
  publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
  appearance={{
    variables: { colorPrimary: "#000000" }
  }}
>
```

#### 4. Network/Firewall Issues

**Problem**: Corporate networks or firewalls blocking Clerk API

**Solutions**:
1. Check if `clerk.com` and `*.clerk.accounts.dev` are accessible
2. Try different network
3. Add proxy configuration if needed

#### 5. Development vs Production Keys

**Problem**: Using wrong environment keys

**Solution**: Ensure using development keys for local development:
- Development keys from Clerk Dashboard → Development
- Production keys only for deployed app

### Debug Checklist

1. [ ] Environment variables are correctly formatted
2. [ ] `.env.local` is in root directory
3. [ ] No syntax errors in `.env.local`
4. [ ] Clerk version is pinned in `package.json`
5. [ ] Next.js cache is cleared
6. [ ] Browser console shows no errors
7. [ ] Network tab shows successful Clerk API calls
8. [ ] Clerk Dashboard shows correct configuration

### Emergency Fallback

If Clerk continues to fail, the app has built-in offline mode:
1. Authentication will be bypassed
2. Data stored in localStorage
3. Full functionality maintained locally

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