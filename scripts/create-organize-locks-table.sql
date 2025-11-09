-- Create organize_locks table for distributed locking
CREATE TABLE IF NOT EXISTS organize_locks (
    project_id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    user_name TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on expires_at for faster cleanup
CREATE INDEX IF NOT EXISTS idx_organize_locks_expires_at ON organize_locks(expires_at);

-- Clean up expired locks (optional, can be run periodically)
DELETE FROM organize_locks WHERE expires_at < NOW();
