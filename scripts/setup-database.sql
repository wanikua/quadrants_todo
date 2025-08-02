-- Run this script in your Neon database console to set up the tables
-- You can also run it by executing the script in the app

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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_task_assignments_task_id ON task_assignments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_assignments_player_id ON task_assignments(player_id);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at);
CREATE INDEX IF NOT EXISTS idx_players_created_at ON players(created_at);

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
