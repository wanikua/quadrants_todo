"use client"

export default function DebugPage() {
  const envVars = {
    NEXT_PUBLIC_STACK_PROJECT_ID: process.env.NEXT_PUBLIC_STACK_PROJECT_ID,
    NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY: process.env.NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY,
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Environment Debug</h1>

      <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Client Environment Variables</h2>
        <pre className="text-sm overflow-auto">
          {JSON.stringify(envVars, null, 2)}
        </pre>
      </div>

      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
        <h3 className="font-semibold mb-2">Expected Values:</h3>
        <ul className="text-sm space-y-1">
          <li>✅ NEXT_PUBLIC_STACK_PROJECT_ID should be: 27c182ee-834e-40b7-9320-b050927a1f44</li>
          <li>✅ NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY should start with: pck_</li>
        </ul>
      </div>

      {(!envVars.NEXT_PUBLIC_STACK_PROJECT_ID || !envVars.NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY) && (
        <div className="mt-6 p-4 bg-red-50 dark:bg-red-900 rounded-lg">
          <h3 className="font-semibold text-red-700 dark:text-red-300 mb-2">⚠️ Missing Environment Variables</h3>
          <p className="text-sm">
            Environment variables are not being loaded. Try:
          </p>
          <ol className="text-sm mt-2 space-y-1 list-decimal list-inside">
            <li>Restart the dev server completely</li>
            <li>Check .env.local file exists in project root</li>
            <li>Ensure no quotes around values in .env.local</li>
            <li>Run: rm -rf .next && npm run dev</li>
          </ol>
        </div>
      )}
    </div>
  )
}
