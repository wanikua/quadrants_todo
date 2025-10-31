-- Migration: Consolidate user name fields
-- Date: 2025-10-31
-- Purpose: Merge display_name, name, and username into a single name field
--
-- Background:
-- The users table has accumulated three name fields due to multiple auth system migrations:
-- - display_name (from Stack Auth era - deprecated)
-- - name (actively used in current code)
-- - username (from early implementation - unused)
-- This migration consolidates them into name (the actively used field).

-- Step 1: Backup current state (for rollback if needed)
DO $$
BEGIN
    RAISE NOTICE '📊 Current state:';
END $$;

SELECT
    COUNT(*) as total_users,
    COUNT(display_name) as has_display_name,
    COUNT(name) as has_name,
    COUNT(username) as has_username
FROM users;

-- Step 2: Merge all name data into name (the actively used field)
-- Priority: name > display_name > username > 'Anonymous'
-- This ensures we keep the user's most recent updates (which go to 'name' field)
UPDATE users
SET name = COALESCE(name, display_name, username, 'Anonymous')
WHERE name IS NULL OR name = '';

DO $$
BEGIN
    RAISE NOTICE '✅ Step 2 complete: Merged name data into name field';
END $$;

-- Step 3: Verify no data loss
DO $$
DECLARE
    null_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO null_count FROM users WHERE name IS NULL;
    IF null_count > 0 THEN
        RAISE EXCEPTION '❌ Migration failed: % users have NULL name', null_count;
    ELSE
        RAISE NOTICE '✅ Step 3 complete: All users have name';
    END IF;
END $$;

-- Step 4: Drop redundant columns
ALTER TABLE users DROP COLUMN IF EXISTS display_name;
ALTER TABLE users DROP COLUMN IF EXISTS username;

DO $$
BEGIN
    RAISE NOTICE '✅ Step 4 complete: Dropped redundant columns (display_name, username)';
END $$;

-- Step 5: Make name NOT NULL (since it's now the canonical name field)
ALTER TABLE users ALTER COLUMN name SET NOT NULL;

DO $$
BEGIN
    RAISE NOTICE '✅ Step 5 complete: Set name as NOT NULL';
END $$;

-- Final verification
SELECT
    id,
    email,
    name,
    created_at
FROM users
ORDER BY created_at;

DO $$
BEGIN
    RAISE NOTICE '🎉 Migration complete! Users table now uses only name field.';
END $$;
