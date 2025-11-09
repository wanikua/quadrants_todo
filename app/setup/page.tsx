"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, XCircle, Database, Key, ExternalLink } from "lucide-react"

export default function SetupPage() {
  const [dbStatus, setDbStatus] = useState<"checking" | "connected" | "error" | null>(null)
  const [clerkStatus, setClerkStatus] = useState<"checking" | "configured" | "error" | null>(null)

  const testDatabase = async () => {
    setDbStatus("checking")
    try {
      const response = await fetch("/api/test-db")
      const result = await response.json()
      setDbStatus(result.success ? "connected" : "error")
    } catch (error) {
      setDbStatus("error")
    }
  }

  const testClerk = async () => {
    setClerkStatus("checking")
    try {
      const response = await fetch("/api/test-clerk")
      const result = await response.json()
      setClerkStatus(result.success ? "configured" : "error")
    } catch (error) {
      setClerkStatus("error")
    }
  }

  const runDatabaseSetup = async () => {
    try {
      const response = await fetch("/api/setup-db", { method: "POST" })
      const result = await response.json()
      if (result.success) {
        alert("Database setup completed successfully!")
        testDatabase()
      } else {
        alert("Database setup failed: " + result.error)
      }
    } catch (error) {
      alert("Database setup failed: " + error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Setup Configuration</h1>
          <p className="text-gray-600">Configure your database and authentication settings</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Database Setup */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                Database Setup
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertDescription>
                  <strong>Step 1:</strong> Create a free account at{" "}
                  <a
                    href="https://neon.tech"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline inline-flex items-center gap-1"
                  >
                    neon.tech <ExternalLink className="w-3 h-3" />
                  </a>
                </AlertDescription>
              </Alert>

              <Alert>
                <AlertDescription>
                  <strong>Step 2:</strong> Create a new project and copy your connection string
                </AlertDescription>
              </Alert>

              <Alert>
                <AlertDescription>
                  <strong>Step 3:</strong> Add your DATABASE_URL to .env.local file
                </AlertDescription>
              </Alert>

              <div className="flex gap-2">
                <Button onClick={testDatabase} variant="outline" disabled={dbStatus === "checking"}>
                  {dbStatus === "checking" ? "Testing..." : "Test Connection"}
                </Button>
                <Button onClick={runDatabaseSetup} disabled={dbStatus !== "connected"}>
                  Setup Tables
                </Button>
              </div>

              {dbStatus && (
                <div className="flex items-center gap-2">
                  {dbStatus === "connected" ? (
                    <>
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span className="text-green-700">Database connected successfully!</span>
                    </>
                  ) : dbStatus === "error" ? (
                    <>
                      <XCircle className="w-5 h-5 text-red-500" />
                      <span className="text-red-700">Database connection failed</span>
                    </>
                  ) : null}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Clerk Setup */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="w-5 h-5" />
                Authentication Setup
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertDescription>
                  <strong>Step 1:</strong> Create a free account at{" "}
                  <a
                    href="https://clerk.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline inline-flex items-center gap-1"
                  >
                    clerk.com <ExternalLink className="w-3 h-3" />
                  </a>
                </AlertDescription>
              </Alert>

              <Alert>
                <AlertDescription>
                  <strong>Step 2:</strong> Create a new application
                </AlertDescription>
              </Alert>

              <Alert>
                <AlertDescription>
                  <strong>Step 3:</strong> Copy your publishable key and secret key to .env.local
                </AlertDescription>
              </Alert>

              <Button onClick={testClerk} variant="outline" disabled={clerkStatus === "checking"}>
                {clerkStatus === "checking" ? "Testing..." : "Test Clerk Config"}
              </Button>

              {clerkStatus && (
                <div className="flex items-center gap-2">
                  {clerkStatus === "configured" ? (
                    <>
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span className="text-green-700">Clerk configured successfully!</span>
                    </>
                  ) : clerkStatus === "error" ? (
                    <>
                      <XCircle className="w-5 h-5 text-red-500" />
                      <span className="text-red-700">Clerk configuration failed</span>
                    </>
                  ) : null}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Environment Variables Template</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
              {`# Database Configuration
DATABASE_URL=postgresql://username:password@ep-example.us-east-2.aws.neon.tech/neondb?sslmode=require

# Clerk Authentication (Optional)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your-actual-publishable-key-here
CLERK_SECRET_KEY=sk_test_your-actual-secret-key-here

# Clerk URLs (Optional)
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/`}
            </pre>
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <Button asChild>
            <a href="/">Return to App</a>
          </Button>
        </div>
      </div>
    </div>
  )
}
