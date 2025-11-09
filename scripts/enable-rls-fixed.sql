-- Enable Row-Level Security for all tables (Fixed version)
-- This script adapts to your existing table structure

-- 1. Create users table synced with Neon Auth
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    display_name TEXT,
    subscription_status TEXT DEFAULT 'free' CHECK (subscription_status IN ('free', 'pro', 'team')),
    subscription_id TEXT,
    stripe_customer_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Projects and project_members tables already exist

-- 3. Add project_id to existing tables (using correct table names)
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE;
ALTER TABLE players ADD COLUMN IF NOT EXISTS project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE;
ALTER TABLE lines ADD COLUMN IF NOT EXISTS project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE;
ALTER TABLE comments ADD COLUMN IF NOT EXISTS project_id INTEGER;

-- 4. Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE lines ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS users_select_own ON users;
DROP POLICY IF EXISTS users_update_own ON users;
DROP POLICY IF EXISTS users_insert_own ON users;
DROP POLICY IF EXISTS projects_select ON projects;
DROP POLICY IF EXISTS projects_insert ON projects;
DROP POLICY IF EXISTS projects_update ON projects;
DROP POLICY IF EXISTS projects_delete ON projects;
DROP POLICY IF EXISTS project_members_select ON project_members;
DROP POLICY IF EXISTS project_members_insert ON project_members;
DROP POLICY IF EXISTS project_members_delete ON project_members;
DROP POLICY IF EXISTS tasks_select ON tasks;
DROP POLICY IF EXISTS tasks_insert ON tasks;
DROP POLICY IF EXISTS tasks_update ON tasks;
DROP POLICY IF EXISTS tasks_delete ON tasks;
DROP POLICY IF EXISTS players_select ON players;
DROP POLICY IF EXISTS players_insert ON players;
DROP POLICY IF EXISTS players_update ON players;
DROP POLICY IF EXISTS players_delete ON players;
DROP POLICY IF EXISTS task_assignments_select ON task_assignments;
DROP POLICY IF EXISTS task_assignments_insert ON task_assignments;
DROP POLICY IF EXISTS task_assignments_delete ON task_assignments;
DROP POLICY IF EXISTS comments_select ON comments;
DROP POLICY IF EXISTS comments_insert ON comments;
DROP POLICY IF EXISTS comments_delete ON comments;
DROP POLICY IF EXISTS lines_select ON lines;
DROP POLICY IF EXISTS lines_insert ON lines;
DROP POLICY IF EXISTS lines_delete ON lines;

-- 5. Create RLS policies for users table
CREATE POLICY users_select_own ON users
    FOR SELECT
    USING (id = current_setting('app.current_user_id', true)::TEXT);

CREATE POLICY users_update_own ON users
    FOR UPDATE
    USING (id = current_setting('app.current_user_id', true)::TEXT);

CREATE POLICY users_insert_own ON users
    FOR INSERT
    WITH CHECK (id = current_setting('app.current_user_id', true)::TEXT);

-- 6. Create RLS policies for projects table
CREATE POLICY projects_select ON projects
    FOR SELECT
    USING (
        owner_id = current_setting('app.current_user_id', true)::TEXT
        OR id IN (
            SELECT project_id FROM project_members
            WHERE user_id = current_setting('app.current_user_id', true)::TEXT
        )
    );

CREATE POLICY projects_insert ON projects
    FOR INSERT
    WITH CHECK (owner_id = current_setting('app.current_user_id', true)::TEXT);

CREATE POLICY projects_update ON projects
    FOR UPDATE
    USING (owner_id = current_setting('app.current_user_id', true)::TEXT);

CREATE POLICY projects_delete ON projects
    FOR DELETE
    USING (owner_id = current_setting('app.current_user_id', true)::TEXT);

-- 7. Create RLS policies for project_members table
CREATE POLICY project_members_select ON project_members
    FOR SELECT
    USING (
        project_id IN (
            SELECT id FROM projects
            WHERE owner_id = current_setting('app.current_user_id', true)::TEXT
        )
        OR user_id = current_setting('app.current_user_id', true)::TEXT
    );

CREATE POLICY project_members_insert ON project_members
    FOR INSERT
    WITH CHECK (
        project_id IN (
            SELECT id FROM projects
            WHERE owner_id = current_setting('app.current_user_id', true)::TEXT
        )
        OR project_id IN (
            SELECT project_id FROM project_members
            WHERE user_id = current_setting('app.current_user_id', true)::TEXT
            AND role IN ('owner', 'admin')
        )
    );

CREATE POLICY project_members_delete ON project_members
    FOR DELETE
    USING (
        project_id IN (
            SELECT id FROM projects
            WHERE owner_id = current_setting('app.current_user_id', true)::TEXT
        )
        OR project_id IN (
            SELECT project_id FROM project_members
            WHERE user_id = current_setting('app.current_user_id', true)::TEXT
            AND role IN ('owner', 'admin')
        )
    );

-- 8. Create RLS policies for tasks table
CREATE POLICY tasks_select ON tasks
    FOR SELECT
    USING (
        project_id IN (
            SELECT id FROM projects
            WHERE owner_id = current_setting('app.current_user_id', true)::TEXT
        )
        OR project_id IN (
            SELECT project_id FROM project_members
            WHERE user_id = current_setting('app.current_user_id', true)::TEXT
        )
    );

CREATE POLICY tasks_insert ON tasks
    FOR INSERT
    WITH CHECK (
        project_id IN (
            SELECT id FROM projects
            WHERE owner_id = current_setting('app.current_user_id', true)::TEXT
        )
        OR project_id IN (
            SELECT project_id FROM project_members
            WHERE user_id = current_setting('app.current_user_id', true)::TEXT
        )
    );

CREATE POLICY tasks_update ON tasks
    FOR UPDATE
    USING (
        project_id IN (
            SELECT id FROM projects
            WHERE owner_id = current_setting('app.current_user_id', true)::TEXT
        )
        OR project_id IN (
            SELECT project_id FROM project_members
            WHERE user_id = current_setting('app.current_user_id', true)::TEXT
        )
    );

CREATE POLICY tasks_delete ON tasks
    FOR DELETE
    USING (
        project_id IN (
            SELECT id FROM projects
            WHERE owner_id = current_setting('app.current_user_id', true)::TEXT
        )
        OR project_id IN (
            SELECT project_id FROM project_members
            WHERE user_id = current_setting('app.current_user_id', true)::TEXT
        )
    );

-- 9. Policies for players table
CREATE POLICY players_select ON players FOR SELECT USING (
    project_id IN (
        SELECT id FROM projects WHERE owner_id = current_setting('app.current_user_id', true)::TEXT
    ) OR project_id IN (
        SELECT project_id FROM project_members WHERE user_id = current_setting('app.current_user_id', true)::TEXT
    )
);

CREATE POLICY players_insert ON players FOR INSERT WITH CHECK (
    project_id IN (
        SELECT id FROM projects WHERE owner_id = current_setting('app.current_user_id', true)::TEXT
    ) OR project_id IN (
        SELECT project_id FROM project_members WHERE user_id = current_setting('app.current_user_id', true)::TEXT
    )
);

CREATE POLICY players_update ON players FOR UPDATE USING (
    project_id IN (
        SELECT id FROM projects WHERE owner_id = current_setting('app.current_user_id', true)::TEXT
    ) OR project_id IN (
        SELECT project_id FROM project_members WHERE user_id = current_setting('app.current_user_id', true)::TEXT
    )
);

CREATE POLICY players_delete ON players FOR DELETE USING (
    project_id IN (
        SELECT id FROM projects WHERE owner_id = current_setting('app.current_user_id', true)::TEXT
    ) OR project_id IN (
        SELECT project_id FROM project_members WHERE user_id = current_setting('app.current_user_id', true)::TEXT
    )
);

-- 10. Policies for task_assignments (inherits from tasks)
CREATE POLICY task_assignments_select ON task_assignments FOR SELECT USING (
    task_id IN (SELECT id FROM tasks)
);

CREATE POLICY task_assignments_insert ON task_assignments FOR INSERT WITH CHECK (
    task_id IN (SELECT id FROM tasks)
);

CREATE POLICY task_assignments_delete ON task_assignments FOR DELETE USING (
    task_id IN (SELECT id FROM tasks)
);

-- 11. Policies for comments (using correct table name)
CREATE POLICY comments_select ON comments FOR SELECT USING (
    task_id IN (SELECT id FROM tasks)
);

CREATE POLICY comments_insert ON comments FOR INSERT WITH CHECK (
    task_id IN (SELECT id FROM tasks)
);

CREATE POLICY comments_delete ON comments FOR DELETE USING (
    task_id IN (SELECT id FROM tasks)
);

-- 12. Policies for lines (using correct table name)
CREATE POLICY lines_select ON lines FOR SELECT USING (
    project_id IN (
        SELECT id FROM projects WHERE owner_id = current_setting('app.current_user_id', true)::TEXT
    ) OR project_id IN (
        SELECT project_id FROM project_members WHERE user_id = current_setting('app.current_user_id', true)::TEXT
    )
);

CREATE POLICY lines_insert ON lines FOR INSERT WITH CHECK (
    project_id IN (
        SELECT id FROM projects WHERE owner_id = current_setting('app.current_user_id', true)::TEXT
    ) OR project_id IN (
        SELECT project_id FROM project_members WHERE user_id = current_setting('app.current_user_id', true)::TEXT
    )
);

CREATE POLICY lines_delete ON lines FOR DELETE USING (
    project_id IN (
        SELECT id FROM projects WHERE owner_id = current_setting('app.current_user_id', true)::TEXT
    ) OR project_id IN (
        SELECT project_id FROM project_members WHERE user_id = current_setting('app.current_user_id', true)::TEXT
    )
);

-- 13. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_projects_owner_id ON projects(owner_id);
CREATE INDEX IF NOT EXISTS idx_project_members_user_id ON project_members(user_id);
CREATE INDEX IF NOT EXISTS idx_project_members_project_id ON project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_players_project_id ON players(project_id);
CREATE INDEX IF NOT EXISTS idx_lines_project_id ON lines(project_id);
CREATE INDEX IF NOT EXISTS idx_comments_task_id ON comments(task_id);

-- 14. Create helper function to set current user context
CREATE OR REPLACE FUNCTION set_current_user_id(user_id TEXT)
RETURNS VOID AS $$
BEGIN
    PERFORM set_config('app.current_user_id', user_id, true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
