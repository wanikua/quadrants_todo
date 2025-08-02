-- Complete database initialization script
-- This script creates all necessary tables for the quadrants app

-- Create players table
CREATE TABLE IF NOT EXISTS players (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    color VARCHAR(7) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
    id SERIAL PRIMARY KEY,
    description TEXT NOT NULL,
    urgency INTEGER NOT NULL CHECK (urgency >= 0 AND urgency <= 100),
    importance INTEGER NOT NULL CHECK (importance >= 0 AND importance <= 100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create task_assignments table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS task_assignments (
    id SERIAL PRIMARY KEY,
    task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(task_id, player_id)
);

-- Create task_comments table
CREATE TABLE IF NOT EXISTS task_comments (
    id SERIAL PRIMARY KEY,
    task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    author_name VARCHAR(255) NOT NULL DEFAULT 'Anonymous',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create task_lines table for drawing connections between tasks
CREATE TABLE IF NOT EXISTS task_lines (
    id SERIAL PRIMARY KEY,
    from_task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    to_task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    style VARCHAR(10) NOT NULL DEFAULT 'filled' CHECK (style IN ('filled', 'open')),
    size INTEGER NOT NULL DEFAULT 8 CHECK (size > 0),
    color VARCHAR(7) NOT NULL DEFAULT '#374151',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(from_task_id, to_task_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_task_assignments_task_id ON task_assignments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_assignments_player_id ON task_assignments(player_id);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at);
CREATE INDEX IF NOT EXISTS idx_players_created_at ON players(created_at);
CREATE INDEX IF NOT EXISTS idx_task_comments_task_id ON task_comments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_created_at ON task_comments(created_at);
CREATE INDEX IF NOT EXISTS idx_task_lines_from_task_id ON task_lines(from_task_id);
CREATE INDEX IF NOT EXISTS idx_task_lines_to_task_id ON task_lines(to_task_id);

-- Insert default players if they don't exist
INSERT INTO players (name, color) 
SELECT 'Alice', '#ef4444'
WHERE NOT EXISTS (SELECT 1 FROM players WHERE name = 'Alice');

INSERT INTO players (name, color) 
SELECT 'Bob', '#f97316'
WHERE NOT EXISTS (SELECT 1 FROM players WHERE name = 'Bob');

INSERT INTO players (name, color) 
SELECT 'Charlie', '#eab308'
WHERE NOT EXISTS (SELECT 1 FROM players WHERE name = 'Charlie');
