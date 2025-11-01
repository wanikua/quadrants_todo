import { sql } from "../lib/database"

async function populateExampleProject(projectId: string, userId: string, userName: string) {
  if (!sql) {
    console.log("Database not available")
    return false
  }

  try {
    // Create player for the user
    const userPlayerResult = await sql`
      INSERT INTO players (project_id, user_id, name, color, created_at)
      VALUES (${projectId}, ${userId}, ${userName}, '#3b82f6', NOW())
      RETURNING id
    `
    const userPlayerId = userPlayerResult[0]?.id
    console.log(`  ✅ Created player for ${userName}: ${userPlayerId}`)

    // Create example tasks with varying urgency and importance
    const exampleTasks = [
      {
        description: '🎯 High Priority: Complete this important and urgent task first',
        urgency: 85,
        importance: 90,
        assigneeIds: [userPlayerId].filter(Boolean)
      },
      {
        description: '📅 Schedule: Plan this important but not urgent task',
        urgency: 30,
        importance: 80,
        assigneeIds: [userPlayerId].filter(Boolean)
      },
      {
        description: '⚡ Quick Win: Handle this urgent but less important task soon',
        urgency: 80,
        importance: 35,
        assigneeIds: []
      },
      {
        description: '💡 Try dragging me around the matrix!',
        urgency: 50,
        importance: 50,
        assigneeIds: []
      },
      {
        description: '🗑️ Low Priority: Delegate or eliminate tasks in this quadrant',
        urgency: 25,
        importance: 20,
        assigneeIds: []
      },
      {
        description: '✨ Click on me to add comments and details',
        urgency: 60,
        importance: 70,
        assigneeIds: []
      },
      {
        description: '🚀 Invite team members to collaborate on this task',
        urgency: 70,
        importance: 75,
        assigneeIds: [userPlayerId].filter(Boolean)
      },
      {
        description: '📊 Review quarterly goals and metrics',
        urgency: 45,
        importance: 85,
        assigneeIds: [userPlayerId].filter(Boolean)
      }
    ]

    console.log(`  📝 Creating ${exampleTasks.length} tasks...`)
    for (const task of exampleTasks) {
      const taskResult = await sql`
        INSERT INTO tasks (project_id, description, urgency, importance, created_at)
        VALUES (${projectId}, ${task.description}, ${task.urgency}, ${task.importance}, NOW())
        RETURNING id
      `

      const taskId = taskResult[0]?.id

      // Assign task to players if specified
      if (taskId && task.assigneeIds.length > 0) {
        for (const playerId of task.assigneeIds) {
          await sql`
            INSERT INTO task_assignments (task_id, player_id, assigned_at)
            VALUES (${taskId}, ${playerId}, NOW())
          `
        }
      }
    }

    console.log(`  ✅ Created all tasks and assignments`)
    return true
  } catch (error) {
    console.error(`  ❌ Failed to populate project:`, error)
    return false
  }
}

async function main() {
  if (!sql) {
    console.error("❌ Database not configured")
    process.exit(1)
  }

  console.log("🔍 Looking for empty example projects...\n")

  try {
    // Find example projects with no tasks
    const emptyProjects = await sql`
      SELECT p.id, p.name, p.owner_id, u.name as owner_name, u.email
      FROM projects p
      JOIN users u ON p.owner_id = u.id
      WHERE p.name = 'Welcome to Quadrant Manager! 👋'
      AND p.id NOT IN (
        SELECT DISTINCT project_id FROM tasks
      )
    `

    if (emptyProjects.length === 0) {
      console.log("✨ No empty example projects found!")
      process.exit(0)
    }

    console.log(`📋 Found ${emptyProjects.length} empty example projects\n`)

    let successCount = 0
    let failCount = 0

    for (const project of emptyProjects) {
      const ownerName = project.owner_name || project.email.split('@')[0] || 'User'
      console.log(`\n📦 Processing project for ${ownerName}...`)
      console.log(`   Project ID: ${project.id}`)

      const success = await populateExampleProject(project.id, project.owner_id, ownerName)
      if (success) {
        successCount++
      } else {
        failCount++
      }
    }

    console.log("\n" + "=".repeat(50))
    console.log(`✅ Successfully populated: ${successCount} projects`)
    console.log(`❌ Failed: ${failCount} projects`)
    console.log("=".repeat(50))

  } catch (error) {
    console.error("❌ Error running script:", error)
    process.exit(1)
  }

  process.exit(0)
}

main()
