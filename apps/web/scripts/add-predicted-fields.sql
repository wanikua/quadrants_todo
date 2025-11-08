-- Add predicted_urgency and predicted_importance columns to tasks table
-- These fields store the original AI predictions for learning purposes

ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS predicted_urgency INTEGER,
ADD COLUMN IF NOT EXISTS predicted_importance INTEGER;

-- Add comments for documentation
COMMENT ON COLUMN tasks.predicted_urgency IS 'Original AI predicted urgency value for learning';
COMMENT ON COLUMN tasks.predicted_importance IS 'Original AI predicted importance value for learning';
