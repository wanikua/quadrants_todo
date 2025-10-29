-- Add user activity table for tracking online users
CREATE TABLE IF NOT EXISTS user_activity (
  id SERIAL PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  last_seen TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_activity_project_user ON user_activity(project_id, user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_last_seen ON user_activity(last_seen);

-- Add unique constraint to prevent duplicate entries
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_activity_unique ON user_activity(project_id, user_id);
