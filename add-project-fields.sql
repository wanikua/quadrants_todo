-- Add missing fields to projects table

-- Add description column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='projects' AND column_name='description') THEN
    ALTER TABLE projects ADD COLUMN description TEXT;
  END IF;
END $$;

-- Add archived column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='projects' AND column_name='archived') THEN
    ALTER TABLE projects ADD COLUMN archived BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- Add updated_at column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='projects' AND column_name='updated_at') THEN
    ALTER TABLE projects ADD COLUMN updated_at TIMESTAMP DEFAULT NOW();
  END IF;
END $$;

-- Update existing rows to have updated_at = created_at if null
UPDATE projects SET updated_at = created_at WHERE updated_at IS NULL;
