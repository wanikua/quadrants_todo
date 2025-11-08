-- Enable Row-Level Security for all tables
-- This script should be run on your Neon database after enabling Neon Auth

-- 1. Create users table synced with Neon Auth
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,  -- Matches Stack Auth user ID
    email TEXT UNIQUE NOT NULL,
    display_name TEXT,
    subscription_status TEXT DEFAULT 'free' CHECK (subscription_status IN ('free', 'pro', 'team')),
    subscription_id TEXT,  -- Stripe subscription ID
    stripe_customer_id TEXT,  -- Stripe customer ID
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create projects table with user ownership
CREATE TABLE IF NOT EXISTS projects (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create project_members table for team collaboration
CREATE TABLE IF NOT EXISTS project_members (
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (project_id, user_id)
);

-- 4. Add project_id to existing tables
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE;
ALTER TABLE players ADD COLUMN IF NOT EXISTS project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE;
ALTER TABLE task_lines ADD COLUMN IF NOT EXISTS project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE;

-- 5. Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_lines ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS policies for users table
-- Users can view their own data
CREATE POLICY users_select_own ON users
    FOR SELECT
    USING (id = current_setting('app.current_user_id', true)::TEXT);

-- Users can update their own data
CREATE POLICY users_update_own ON users
    FOR UPDATE
    USING (id = current_setting('app.current_user_id', true)::TEXT);

-- Users can insert their own data
CREATE POLICY users_insert_own ON users
    FOR INSERT
    WITH CHECK (id = current_setting('app.current_user_id', true)::TEXT);

-- 7. Create RLS policies for projects table
-- Users can view projects they own or are members of
CREATE POLICY projects_select ON projects
    FOR SELECT
    USING (
        owner_id = current_setting('app.current_user_id', true)::TEXT
        OR id IN (
            SELECT project_id FROM project_members
            WHERE user_id = current_setting('app.current_user_id', true)::TEXT
        )
    );

-- Users can create projects
CREATE POLICY projects_insert ON projects
    FOR INSERT
    WITH CHECK (owner_id = current_setting('app.current_user_id', true)::TEXT);

-- Only owners can update projects
CREATE POLICY projects_update ON projects
    FOR UPDATE
    USING (owner_id = current_setting('app.current_user_id', true)::TEXT);

-- Only owners can delete projects
CREATE POLICY projects_delete ON projects
    FOR DELETE
    USING (owner_id = current_setting('app.current_user_id', true)::TEXT);

-- 8. Create RLS policies for project_members table
-- Users can view members of their projects
CREATE POLICY project_members_select ON project_members
    FOR SELECT
    USING (
        project_id IN (
            SELECT id FROM projects
            WHERE owner_id = current_setting('app.current_user_id', true)::TEXT
        )
        OR user_id = current_setting('app.current_user_id', true)::TEXT
    );

-- Project owners and admins can add members
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

-- Project owners and admins can remove members
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

-- 9. Create RLS policies for tasks table
-- Users can view tasks in their projects
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

-- Users can create tasks in their projects
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

-- Users can update tasks in their projects
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

-- Users can delete tasks in their projects
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

-- 10. Similar policies for players table
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

-- 11. Policies for task_assignments (inherits from tasks)
CREATE POLICY task_assignments_select ON task_assignments FOR SELECT USING (
    task_id IN (SELECT id FROM tasks)
);

CREATE POLICY task_assignments_insert ON task_assignments FOR INSERT WITH CHECK (
    task_id IN (SELECT id FROM tasks)
);

CREATE POLICY task_assignments_delete ON task_assignments FOR DELETE USING (
    task_id IN (SELECT id FROM tasks)
);

-- 12. Policies for task_comments (inherits from tasks)
CREATE POLICY task_comments_select ON task_comments FOR SELECT USING (
    task_id IN (SELECT id FROM tasks)
);

CREATE POLICY task_comments_insert ON task_comments FOR INSERT WITH CHECK (
    task_id IN (SELECT id FROM tasks)
);

CREATE POLICY task_comments_delete ON task_comments FOR DELETE USING (
    task_id IN (SELECT id FROM tasks)
);

-- 13. Policies for task_lines
CREATE POLICY task_lines_select ON task_lines FOR SELECT USING (
    project_id IN (
        SELECT id FROM projects WHERE owner_id = current_setting('app.current_user_id', true)::TEXT
    ) OR project_id IN (
        SELECT project_id FROM project_members WHERE user_id = current_setting('app.current_user_id', true)::TEXT
    )
);

CREATE POLICY task_lines_insert ON task_lines FOR INSERT WITH CHECK (
    project_id IN (
        SELECT id FROM projects WHERE owner_id = current_setting('app.current_user_id', true)::TEXT
    ) OR project_id IN (
        SELECT project_id FROM project_members WHERE user_id = current_setting('app.current_user_id', true)::TEXT
    )
);

CREATE POLICY task_lines_delete ON task_lines FOR DELETE USING (
    project_id IN (
        SELECT id FROM projects WHERE owner_id = current_setting('app.current_user_id', true)::TEXT
    ) OR project_id IN (
        SELECT project_id FROM project_members WHERE user_id = current_setting('app.current_user_id', true)::TEXT
    )
);

-- 14. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_projects_owner_id ON projects(owner_id);
CREATE INDEX IF NOT EXISTS idx_project_members_user_id ON project_members(user_id);
CREATE INDEX IF NOT EXISTS idx_project_members_project_id ON project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_players_project_id ON players(project_id);
CREATE INDEX IF NOT EXISTS idx_task_lines_project_id ON task_lines(project_id);

-- 15. Create helper function to set current user context
CREATE OR REPLACE FUNCTION set_current_user_id(user_id TEXT)
RETURNS VOID AS $$
BEGIN
    PERFORM set_config('app.current_user_id', user_id, true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, authenticated, anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, authenticated;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO postgres, authenticated;
