-- Fix players table to add user_id column
-- This script handles existing data gracefully

-- Add user_id column if it doesn't exist
ALTER TABLE players ADD COLUMN IF NOT EXISTS user_id text;

-- For existing players without user_id, we'll set them to a placeholder
-- These will need to be manually updated or deleted
UPDATE players
SET user_id = 'legacy_' || id::text
WHERE user_id IS NULL;

-- Make user_id NOT NULL
ALTER TABLE players ALTER COLUMN user_id SET NOT NULL;
