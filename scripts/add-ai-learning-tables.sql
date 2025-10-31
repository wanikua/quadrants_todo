-- Add AI Learning Tables for Task Prediction
-- This migration adds tables to support AI-powered task priority predictions

-- Task Predictions table - stores AI predictions and actual user adjustments
CREATE TABLE IF NOT EXISTS task_predictions (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  task_description TEXT NOT NULL,
  predicted_urgency INTEGER NOT NULL,
  predicted_importance INTEGER NOT NULL,
  final_urgency INTEGER NOT NULL,
  final_importance INTEGER NOT NULL,
  adjustment_delta JSONB, -- Stores { urgency_delta: X, importance_delta: Y }
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- User Task Preferences table - stores learned patterns for personalization
CREATE TABLE IF NOT EXISTS user_task_preferences (
  user_id TEXT PRIMARY KEY,
  avg_urgency_bias REAL DEFAULT 0,
  avg_importance_bias REAL DEFAULT 0,
  keyword_patterns JSONB, -- Stores keyword to priority mappings
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_task_predictions_user_id ON task_predictions(user_id);
CREATE INDEX IF NOT EXISTS idx_task_predictions_project_id ON task_predictions(project_id);
CREATE INDEX IF NOT EXISTS idx_task_predictions_created_at ON task_predictions(created_at DESC);

-- Comments
COMMENT ON TABLE task_predictions IS 'Stores AI predictions and user adjustments for learning';
COMMENT ON TABLE user_task_preferences IS 'Stores user-specific task priority preferences for personalization';
COMMENT ON COLUMN task_predictions.adjustment_delta IS 'JSON containing urgency_delta and importance_delta';
COMMENT ON COLUMN user_task_preferences.keyword_patterns IS 'JSON mapping keywords to urgency/importance values';
