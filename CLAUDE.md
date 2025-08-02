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
