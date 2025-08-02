import { getTasks, getPlayers, getLines, testConnection } from "@/lib/database"
import QuadrantTodoClient from "./client"

export default async function QuadrantTodoApp() {
  // Test database connection
  let isDatabaseAvailable = false
  let tasks = []
  let players = []
  let lines = []

  try {
    isDatabaseAvailable = await testConnection()

    if (isDatabaseAvailable) {
      const [tasksResult, playersResult, linesResult] = await Promise.all([getTasks(), getPlayers(), getLines()])
      tasks = tasksResult
      players = playersResult
      lines = linesResult
    } else {
      // Use default players when database is not available
      players = [
        { id: 1, name: "Alice", color: "#ef4444", created_at: new Date().toISOString() },
        { id: 2, name: "Bob", color: "#f97316", created_at: new Date().toISOString() },
        { id: 3, name: "Charlie", color: "#eab308", created_at: new Date().toISOString() },
      ]
    }
  } catch (error) {
    console.error("Error loading data:", error)
    // Fallback to default data
    players = [
      { id: 1, name: "Alice", color: "#ef4444", created_at: new Date().toISOString() },
      { id: 2, name: "Bob", color: "#f97316", created_at: new Date().toISOString() },
      { id: 3, name: "Charlie", color: "#eab308", created_at: new Date().toISOString() },
    ]
  }

  // Determine if we're in offline mode
  const isOfflineMode = !isDatabaseAvailable

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Database Warning */}
      {!isDatabaseAvailable && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 m-4">
          <h2 className="text-lg font-semibold text-yellow-800 mb-2">🔧 Database Connection Issue</h2>
          <p className="text-yellow-700 mb-2">
            Unable to connect to database. App is running in demo mode with local storage.
          </p>
          <div className="text-sm text-yellow-600 space-y-1">
            <p>To enable full functionality:</p>
            <ol className="list-decimal list-inside ml-4 space-y-1">
              <li>
                Create a free account at{" "}
                <a href="https://neon.tech" target="_blank" rel="noopener noreferrer" className="underline">
                  neon.tech
                </a>
              </li>
              <li>Create a new project and copy the connection string</li>
              <li>Add it to your .env.local file as DATABASE_URL</li>
              <li>
                Visit{" "}
                <a href="/setup" className="underline font-semibold">
                  /setup
                </a>{" "}
                for guided setup
              </li>
            </ol>
          </div>
        </div>
      )}

      <QuadrantTodoClient initialTasks={tasks} initialPlayers={players} initialLines={lines} isOfflineMode={isOfflineMode} />
    </div>
  )
}
