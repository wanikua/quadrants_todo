-- Performance Optimization: Add Database Indexes
-- Run this SQL script to add indexes without affecting data

-- Tasks table indexes
CREATE INDEX IF NOT EXISTS tasks_project_id_idx ON tasks(project_id);
CREATE INDEX IF NOT EXISTS tasks_archived_idx ON tasks(archived);
CREATE INDEX IF NOT EXISTS tasks_project_archived_idx ON tasks(project_id, archived);
CREATE INDEX IF NOT EXISTS tasks_updated_at_idx ON tasks(updated_at);

-- Players table indexes
CREATE INDEX IF NOT EXISTS players_project_id_idx ON players(project_id);
CREATE INDEX IF NOT EXISTS players_user_id_idx ON players(user_id);

-- Task assignments table indexes
CREATE INDEX IF NOT EXISTS task_assignments_task_id_idx ON task_assignments(task_id);
CREATE INDEX IF NOT EXISTS task_assignments_player_id_idx ON task_assignments(player_id);

-- Lines table indexes
CREATE INDEX IF NOT EXISTS lines_project_id_idx ON lines(project_id);
CREATE INDEX IF NOT EXISTS lines_from_task_id_idx ON lines(from_task_id);
CREATE INDEX IF NOT EXISTS lines_to_task_id_idx ON lines(to_task_id);

-- Comments table indexes
CREATE INDEX IF NOT EXISTS comments_task_id_idx ON comments(task_id);

-- User activity table indexes
CREATE INDEX IF NOT EXISTS user_activity_project_id_idx ON user_activity(project_id);
CREATE INDEX IF NOT EXISTS user_activity_last_seen_idx ON user_activity(last_seen);

-- Verify indexes were created
SELECT schemaname, tablename, indexname
FROM pg_indexes
WHERE indexname LIKE '%_idx'
ORDER BY tablename, indexname;
