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
