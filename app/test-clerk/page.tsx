"use client"

export default function TestClerkPage() {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-2xl font-bold mb-4">Clerk Configuration Test</h1>

      <div className="space-y-4">
        <div className="border border-purple-500/30 p-4 rounded">
          <h2 className="font-semibold mb-2">Environment Variables:</h2>
          <p>Publishable Key: {publishableKey ? '✅ Set' : '❌ Missing'}</p>
          <p className="text-sm text-gray-400 mt-2">
            Key: {publishableKey?.substring(0, 20)}...
          </p>
        </div>

        <div className="border border-purple-500/30 p-4 rounded">
          <h2 className="font-semibold mb-2">Next Steps:</h2>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Make sure your Clerk app is created at dashboard.clerk.com</li>
            <li>Add these URLs to Clerk Dashboard → Paths:
              <ul className="ml-6 mt-2 space-y-1 text-gray-400">
                <li>Sign in URL: /sign-in</li>
                <li>Sign up URL: /sign-up</li>
                <li>After sign in: /projects</li>
                <li>After sign up: /projects</li>
              </ul>
            </li>
            <li>Verify your domain is allowed (localhost should be default)</li>
          </ol>
        </div>

        <div className="mt-4">
          <a
            href="/sign-in"
            className="inline-block bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg"
          >
            Try Sign In Page →
          </a>
        </div>
      </div>
    </div>
  )
}
