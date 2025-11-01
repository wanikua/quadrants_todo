import { sql } from "../lib/database"

// Function to create example project for existing users
async function createExampleProject(userId: string, userName: string) {
  if (!sql) {
    console.log("Database not available, skipping example project creation")
    return
  }

  try {
    const projectId = `proj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const inviteCode = Math.random().toString(36).substring(2, 10).toUpperCase()

    // Create example project as team project
    await sql`
      INSERT INTO projects (id, name, description, type, owner_id, invite_code, created_at)
      VALUES (
        ${projectId},
        'Welcome to Quadrant Manager! 👋',
        'This is your example team project. Feel free to explore and modify these tasks!',
        'team',
        ${userId},
        ${inviteCode},
        NOW()
      )
    `

    // Add user as project member
    await sql`
      INSERT INTO project_members (id, project_id, user_id, role, joined_at)
      VALUES (
        ${'member_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)},
        ${projectId},
        ${userId},
        'owner',
        NOW()
      )
    `

    // Create players for the user and example team members
    const userPlayerResult = await sql`
      INSERT INTO players (project_id, user_id, name, color, created_at)
      VALUES (${projectId}, ${userId}, ${userName}, '#3b82f6', NOW())
      RETURNING id
    `
    const userPlayerId = userPlayerResult[0]?.id

    // Create example team members
    const aliceResult = await sql`
      INSERT INTO players (project_id, name, color, created_at)
      VALUES (${projectId}, 'Alice', '#ef4444', NOW())
      RETURNING id
    `
    const alicePlayerId = aliceResult[0]?.id

    const bobResult = await sql`
      INSERT INTO players (project_id, name, color, created_at)
      VALUES (${projectId}, 'Bob', '#10b981', NOW())
      RETURNING id
    `
    const bobPlayerId = bobResult[0]?.id

    const charlieResult = await sql`
      INSERT INTO players (project_id, name, color, created_at)
      VALUES (${projectId}, 'Charlie', '#f59e0b', NOW())
      RETURNING id
    `
    const charliePlayerId = charlieResult[0]?.id

    // Create example tasks with varying urgency and importance
    const exampleTasks = [
      {
        description: '🎯 High Priority: Complete this important and urgent task first',
        urgency: 85,
        importance: 90,
        assigneeIds: [userPlayerId, alicePlayerId].filter(Boolean)
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
        assigneeIds: [bobPlayerId].filter(Boolean)
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
        assigneeIds: [charliePlayerId].filter(Boolean)
      },
      {
        description: '✨ Click on me to add comments and details',
        urgency: 60,
        importance: 70,
        assigneeIds: [alicePlayerId, bobPlayerId].filter(Boolean)
      },
      {
        description: '🚀 Team Collaboration: Work together on this task',
        urgency: 70,
        importance: 75,
        assigneeIds: [userPlayerId, alicePlayerId, bobPlayerId, charliePlayerId].filter(Boolean)
      },
      {
        description: '📊 Review quarterly goals and metrics',
        urgency: 45,
        importance: 85,
        assigneeIds: [userPlayerId, alicePlayerId].filter(Boolean)
      }
    ]

    for (const task of exampleTasks) {
      const taskResult = await sql`
        INSERT INTO tasks (project_id, description, urgency, importance, created_at)
        VALUES (${projectId}, ${task.description}, ${task.urgency}, ${task.importance}, NOW())
        RETURNING id
      `

      const taskId = taskResult[0]?.id

      // Assign task to user if specified
      if (taskId && task.assigneeIds.length > 0) {
        for (const playerId of task.assigneeIds) {
          await sql`
            INSERT INTO task_assignments (task_id, player_id, created_at)
            VALUES (${taskId}, ${playerId}, NOW())
          `
        }
      }
    }

    console.log(`✅ Created example project for user ${userId} (${userName})`)
    return true
  } catch (error) {
    console.error(`❌ Failed to create example project for user ${userId}:`, error)
    return false
  }
}

async function main() {
  if (!sql) {
    console.error("❌ Database not configured")
    process.exit(1)
  }

  console.log("🚀 Starting to add example projects for existing users...")

  try {
    // Get all users who don't have an example project yet
    const users = await sql`
      SELECT id, name, email
      FROM users
      WHERE id NOT IN (
        SELECT DISTINCT owner_id
        FROM projects
        WHERE name = 'Welcome to Quadrant Manager! 👋'
      )
    `

    if (users.length === 0) {
      console.log("✨ All users already have example projects!")
      process.exit(0)
    }

    console.log(`📝 Found ${users.length} users without example projects`)

    let successCount = 0
    let failCount = 0

    for (const user of users) {
      const userName = user.name || user.email.split('@')[0] || 'User'
      const success = await createExampleProject(user.id, userName)
      if (success) {
        successCount++
      } else {
        failCount++
      }
    }

    console.log("\n" + "=".repeat(50))
    console.log(`✅ Successfully created: ${successCount} projects`)
    console.log(`❌ Failed: ${failCount} projects`)
    console.log("=".repeat(50))

  } catch (error) {
    console.error("❌ Error running script:", error)
    process.exit(1)
  }

  process.exit(0)
}

main()
