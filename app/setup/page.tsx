"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, XCircle, Database, Key, ExternalLink } from "lucide-react"
import { PageBackground } from "@/components/page-background"
import { SiteHeader } from "@/components/site-header"
import { Footer } from "@/components/footer"

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
    <div className="min-h-screen bg-white relative overflow-hidden font-sans selection:bg-yellow-200">
      <PageBackground />
      <SiteHeader />

      <main className="pt-16 pb-20 px-6 relative z-10">
        <div className="max-w-4xl mx-auto">
          {/* Hero */}
          <div className="text-center mb-12 md:mb-16">
            <h1 className="text-5xl md:text-7xl font-black tracking-tight text-gray-900 mb-4">
              Setup <span className="text-highlight-yellow">Configuration</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-600 font-medium max-w-2xl mx-auto">
              Configure your database and authentication settings
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Database Setup */}
            <div className="bg-white border-3 border-black rounded-[2.5rem] p-8 md:p-10 shadow-bold-lg">
              <h2 className="flex items-center gap-2 text-2xl font-bold text-gray-900 mb-6">
                <Database className="w-5 h-5" />
                Database Setup
              </h2>
              <div className="space-y-4">
                <Alert className="border-2 border-black/10 rounded-xl bg-white">
                  <AlertDescription>
                    <strong>Step 1:</strong> Create a free account at{" "}
                    <a
                      href="https://neon.tech"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline inline-flex items-center gap-1 font-medium"
                    >
                      neon.tech <ExternalLink className="w-3 h-3" />
                    </a>
                  </AlertDescription>
                </Alert>

                <Alert className="border-2 border-black/10 rounded-xl bg-white">
                  <AlertDescription>
                    <strong>Step 2:</strong> Create a new project and copy your connection string
                  </AlertDescription>
                </Alert>

                <Alert className="border-2 border-black/10 rounded-xl bg-white">
                  <AlertDescription>
                    <strong>Step 3:</strong> Add your DATABASE_URL to .env.local file
                  </AlertDescription>
                </Alert>

                <div className="flex gap-2">
                  <Button
                    onClick={testDatabase}
                    disabled={dbStatus === "checking"}
                    className="bg-white text-black border-3 border-black rounded-xl font-bold shadow-bold hover-lift-shadow hover:bg-black hover:text-white transition-all"
                  >
                    {dbStatus === "checking" ? "Testing..." : "Test Connection"}
                  </Button>
                  <Button
                    onClick={runDatabaseSetup}
                    disabled={dbStatus !== "connected"}
                    className="bg-black text-white border-3 border-black rounded-xl font-bold shadow-bold hover-lift-shadow transition-all"
                  >
                    Setup Tables
                  </Button>
                </div>

                {dbStatus && (
                  <div className="flex items-center gap-2">
                    {dbStatus === "connected" ? (
                      <div className="flex items-center gap-2 w-full bg-green-50 border-2 border-green-500 rounded-xl px-4 py-3">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span className="text-green-700 font-bold">Database connected successfully!</span>
                      </div>
                    ) : dbStatus === "error" ? (
                      <div className="flex items-center gap-2 w-full bg-red-50 border-2 border-red-500 rounded-xl px-4 py-3">
                        <XCircle className="w-5 h-5 text-red-500" />
                        <span className="text-red-700 font-bold">Database connection failed</span>
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            </div>

            {/* Clerk Setup */}
            <div className="bg-white border-3 border-black rounded-[2.5rem] p-8 md:p-10 shadow-bold-lg">
              <h2 className="flex items-center gap-2 text-2xl font-bold text-gray-900 mb-6">
                <Key className="w-5 h-5" />
                Authentication Setup
              </h2>
              <div className="space-y-4">
                <Alert className="border-2 border-black/10 rounded-xl bg-white">
                  <AlertDescription>
                    <strong>Step 1:</strong> Create a free account at{" "}
                    <a
                      href="https://clerk.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline inline-flex items-center gap-1 font-medium"
                    >
                      clerk.com <ExternalLink className="w-3 h-3" />
                    </a>
                  </AlertDescription>
                </Alert>

                <Alert className="border-2 border-black/10 rounded-xl bg-white">
                  <AlertDescription>
                    <strong>Step 2:</strong> Create a new application
                  </AlertDescription>
                </Alert>

                <Alert className="border-2 border-black/10 rounded-xl bg-white">
                  <AlertDescription>
                    <strong>Step 3:</strong> Copy your publishable key and secret key to .env.local
                  </AlertDescription>
                </Alert>

                <Button
                  onClick={testClerk}
                  disabled={clerkStatus === "checking"}
                  className="bg-white text-black border-3 border-black rounded-xl font-bold shadow-bold hover-lift-shadow hover:bg-black hover:text-white transition-all"
                >
                  {clerkStatus === "checking" ? "Testing..." : "Test Clerk Config"}
                </Button>

                {clerkStatus && (
                  <div className="flex items-center gap-2">
                    {clerkStatus === "configured" ? (
                      <div className="flex items-center gap-2 w-full bg-green-50 border-2 border-green-500 rounded-xl px-4 py-3">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span className="text-green-700 font-bold">Clerk configured successfully!</span>
                      </div>
                    ) : clerkStatus === "error" ? (
                      <div className="flex items-center gap-2 w-full bg-red-50 border-2 border-red-500 rounded-xl px-4 py-3">
                        <XCircle className="w-5 h-5 text-red-500" />
                        <span className="text-red-700 font-bold">Clerk configuration failed</span>
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white border-3 border-black rounded-[2.5rem] p-8 md:p-10 shadow-bold-lg mt-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Environment Variables Template</h2>
            <pre className="bg-gray-100 border-2 border-black/10 p-4 rounded-xl text-sm overflow-x-auto">
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
          </div>

          <div className="mt-10 text-center">
            <Button
              asChild
              className="bg-black text-white border-3 border-black rounded-xl font-bold shadow-bold hover-lift-shadow transition-all"
            >
              <a href="/">Return to App</a>
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
