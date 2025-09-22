-- Enable Row Level Security for all project-related tables
-- This ensures data isolation between projects

-- Enable RLS on projects table
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Enable RLS on project_members table
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;

-- Create a function to get current user's accessible projects
CREATE OR REPLACE FUNCTION get_user_projects(user_id TEXT)
RETURNS TABLE(project_id UUID) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT pm.project_id
  FROM project_members pm
  WHERE pm.user_id = $1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Policy for projects table: Users can only see projects they're members of
CREATE POLICY projects_select_policy ON projects
  FOR SELECT
  USING (
    id IN (
      SELECT project_id FROM project_members 
      WHERE user_id = current_setting('app.current_user_id', true)
    )
  );

CREATE POLICY projects_insert_policy ON projects
  FOR INSERT
  WITH CHECK (
    owner_id = current_setting('app.current_user_id', true)
  );

CREATE POLICY projects_update_policy ON projects
  FOR UPDATE
  USING (
    owner_id = current_setting('app.current_user_id', true)
  );

CREATE POLICY projects_delete_policy ON projects
  FOR DELETE
  USING (
    owner_id = current_setting('app.current_user_id', true)
  );

-- Policy for project_members table
CREATE POLICY project_members_select_policy ON project_members
  FOR SELECT
  USING (
    project_id IN (
      SELECT project_id FROM project_members 
      WHERE user_id = current_setting('app.current_user_id', true)
    )
  );

CREATE POLICY project_members_insert_policy ON project_members
  FOR INSERT
  WITH CHECK (
    project_id IN (
      SELECT id FROM projects 
      WHERE owner_id = current_setting('app.current_user_id', true)
    )
    OR
    -- Allow joining with valid invite code
    project_id IN (
      SELECT id FROM projects 
      WHERE invite_code = current_setting('app.invite_code', true)
    )
  );

-- Create project-scoped tables with automatic project_id injection
CREATE OR REPLACE FUNCTION create_project_tables()
RETURNS void AS $$
BEGIN
  -- Add project_id to existing tables if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tasks' AND column_name = 'project_id'
  ) THEN
    ALTER TABLE tasks ADD COLUMN project_id UUID REFERENCES projects(id) ON DELETE CASCADE;
    CREATE INDEX idx_tasks_project_id ON tasks(project_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'players' AND column_name = 'project_id'
  ) THEN
    ALTER TABLE players ADD COLUMN project_id UUID REFERENCES projects(id) ON DELETE CASCADE;
    CREATE INDEX idx_players_project_id ON players(project_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'lines' AND column_name = 'project_id'
  ) THEN
    ALTER TABLE lines ADD COLUMN project_id UUID REFERENCES projects(id) ON DELETE CASCADE;
    CREATE INDEX idx_lines_project_id ON lines(project_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'comments' AND column_name = 'project_id'
  ) THEN
    ALTER TABLE comments ADD COLUMN project_id UUID REFERENCES projects(id) ON DELETE CASCADE;
    CREATE INDEX idx_comments_project_id ON comments(project_id);
  END IF;

  -- Enable RLS on all tables
  ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
  ALTER TABLE players ENABLE ROW LEVEL SECURITY;
  ALTER TABLE lines ENABLE ROW LEVEL SECURITY;
  ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

  -- Create policies for tasks
  DROP POLICY IF EXISTS tasks_policy ON tasks;
  CREATE POLICY tasks_policy ON tasks
    FOR ALL
    USING (
      project_id IN (
        SELECT project_id FROM project_members 
        WHERE user_id = current_setting('app.current_user_id', true)
      )
    )
    WITH CHECK (
      project_id IN (
        SELECT project_id FROM project_members 
        WHERE user_id = current_setting('app.current_user_id', true)
      )
    );

  -- Create policies for players
  DROP POLICY IF EXISTS players_policy ON players;
  CREATE POLICY players_policy ON players
    FOR ALL
    USING (
      project_id IN (
        SELECT project_id FROM project_members 
        WHERE user_id = current_setting('app.current_user_id', true)
      )
    )
    WITH CHECK (
      project_id IN (
        SELECT project_id FROM project_members 
        WHERE user_id = current_setting('app.current_user_id', true)
      )
    );

  -- Create policies for lines
  DROP POLICY IF EXISTS lines_policy ON lines;
  CREATE POLICY lines_policy ON lines
    FOR ALL
    USING (
      project_id IN (
        SELECT project_id FROM project_members 
        WHERE user_id = current_setting('app.current_user_id', true)
      )
    )
    WITH CHECK (
      project_id IN (
        SELECT project_id FROM project_members 
        WHERE user_id = current_setting('app.current_user_id', true)
      )
    );

  -- Create policies for comments
  DROP POLICY IF EXISTS comments_policy ON comments;
  CREATE POLICY comments_policy ON comments
    FOR ALL
    USING (
      project_id IN (
        SELECT project_id FROM project_members 
        WHERE user_id = current_setting('app.current_user_id', true)
      )
    )
    WITH CHECK (
      project_id IN (
        SELECT project_id FROM project_members 
        WHERE user_id = current_setting('app.current_user_id', true)
      )
    );
END;
$$ LANGUAGE plpgsql;

-- Execute the function
SELECT create_project_tables();

-- Create a function to set the current user context
CREATE OR REPLACE FUNCTION set_current_user(user_id TEXT)
RETURNS void AS $$
BEGIN
  PERFORM set_config('app.current_user_id', user_id, false);
END;
$$ LANGUAGE plpgsql;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_project_members_user_id ON project_members(user_id);
CREATE INDEX IF NOT EXISTS idx_project_members_project_id ON project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_projects_owner_id ON projects(owner_id);
CREATE INDEX IF NOT EXISTS idx_projects_invite_code ON projects(invite_code) WHERE invite_code IS NOT NULL;