import { sql } from "../lib/database"

async function cleanAndRepopulate() {
  if (!sql) {
    console.error("❌ Database not configured")
    process.exit(1)
  }

  console.log("🧹 Cleaning and repopulating example projects...\n")

  try {
    // Get all example projects
    const exampleProjects = await sql`
      SELECT p.id, p.name, p.owner_id, u.name as owner_name, u.email
      FROM projects p
      JOIN users u ON p.owner_id = u.id
      WHERE p.name = 'Welcome to Quadrant Manager! 👋'
    `

    if (exampleProjects.length === 0) {
      console.log("✨ No example projects found")
      process.exit(0)
    }

    console.log(`📋 Found ${exampleProjects.length} example projects\n`)

    for (const project of exampleProjects) {
      const ownerName = project.owner_name || project.email.split('@')[0] || 'User'
      console.log(`\n📦 Processing project for ${ownerName}...`)
      console.log(`   Project ID: ${project.id}`)

      // Delete all existing tasks (will cascade delete task_assignments)
      const deletedTasks = await sql`
        DELETE FROM tasks WHERE project_id = ${project.id}
      `
      console.log(`   🗑️  Deleted existing tasks`)

      // Delete all existing players
      const deletedPlayers = await sql`
        DELETE FROM players WHERE project_id = ${project.id}
      `
      console.log(`   🗑️  Deleted existing players`)

      // Create player for the user
      const userPlayerResult = await sql`
        INSERT INTO players (project_id, user_id, name, color, created_at)
        VALUES (${project.id}, ${project.owner_id}, ${ownerName}, '#3b82f6', NOW())
        RETURNING id
      `
      const userPlayerId = userPlayerResult[0]?.id
      console.log(`   ✅ Created player: ${userPlayerId}`)

      // Create example tasks
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

      console.log(`   📝 Creating ${exampleTasks.length} tasks...`)
      let taskCount = 0
      let assignmentCount = 0

      for (const task of exampleTasks) {
        const taskResult = await sql`
          INSERT INTO tasks (project_id, description, urgency, importance, created_at)
          VALUES (${project.id}, ${task.description}, ${task.urgency}, ${task.importance}, NOW())
          RETURNING id
        `
        const taskId = taskResult[0]?.id
        taskCount++

        if (taskId && task.assigneeIds.length > 0) {
          for (const playerId of task.assigneeIds) {
            await sql`
              INSERT INTO task_assignments (task_id, player_id, assigned_at)
              VALUES (${taskId}, ${playerId}, NOW())
            `
            assignmentCount++
          }
        }
      }

      console.log(`   ✅ Created ${taskCount} tasks with ${assignmentCount} assignments`)
    }

    console.log("\n" + "=".repeat(50))
    console.log(`✅ All example projects repopulated successfully!`)
    console.log("=".repeat(50))

  } catch (error) {
    console.error("❌ Error:", error)
    process.exit(1)
  }

  process.exit(0)
}

cleanAndRepopulate()
