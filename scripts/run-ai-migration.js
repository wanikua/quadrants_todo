const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.DATABASE_URL);

async function runMigration() {
  try {
    console.log('🚀 Running AI learning tables migration...');

    // Create task_predictions table
    await sql`
      CREATE TABLE IF NOT EXISTS task_predictions (
        id SERIAL PRIMARY KEY,
        user_id TEXT NOT NULL,
        project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        task_description TEXT NOT NULL,
        predicted_urgency INTEGER NOT NULL,
        predicted_importance INTEGER NOT NULL,
        final_urgency INTEGER NOT NULL,
        final_importance INTEGER NOT NULL,
        adjustment_delta JSONB,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `;
    console.log('✅ task_predictions table created');

    // Create user_task_preferences table
    await sql`
      CREATE TABLE IF NOT EXISTS user_task_preferences (
        user_id TEXT PRIMARY KEY,
        avg_urgency_bias REAL DEFAULT 0,
        avg_importance_bias REAL DEFAULT 0,
        keyword_patterns JSONB,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `;
    console.log('✅ user_task_preferences table created');

    // Create indexes
    await sql`CREATE INDEX IF NOT EXISTS idx_task_predictions_user_id ON task_predictions(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_task_predictions_project_id ON task_predictions(project_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_task_predictions_created_at ON task_predictions(created_at DESC)`;
    console.log('✅ Indexes created');

    console.log('🎉 Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

runMigration();
