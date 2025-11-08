"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, XCircle, AlertTriangle, Loader2, Database, CreditCard, Key, Server } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface DiagnosticResult {
  status: "success" | "error" | "warning" | "pending"
  message: string
  details?: string
}

interface DiagnosticResults {
  database: DiagnosticResult
  auth: DiagnosticResult
  stripe: DiagnosticResult
  environment: DiagnosticResult
  schema: DiagnosticResult
}

export default function DiagnosticsPage() {
  const [results, setResults] = useState<DiagnosticResults>({
    database: { status: "pending", message: "Not tested" },
    auth: { status: "pending", message: "Not tested" },
    stripe: { status: "pending", message: "Not tested" },
    environment: { status: "pending", message: "Not tested" },
    schema: { status: "pending", message: "Not tested" },
  })
  const [isRunning, setIsRunning] = useState(false)

  const runDiagnostics = async () => {
    setIsRunning(true)

    // Test Environment Variables
    try {
      const envResponse = await fetch("/api/diagnostics/environment")
      const envData = await envResponse.json()
      setResults((prev) => ({
        ...prev,
        environment: {
          status: envData.success ? "success" : "warning",
          message: envData.message,
          details: envData.missing?.join(", "),
        },
      }))
    } catch (error) {
      setResults((prev) => ({
        ...prev,
        environment: {
          status: "error",
          message: "Failed to check environment",
          details: error instanceof Error ? error.message : String(error),
        },
      }))
    }

    // Test Database Connection
    try {
      const dbResponse = await fetch("/api/diagnostics/database")
      const dbData = await dbResponse.json()
      setResults((prev) => ({
        ...prev,
        database: {
          status: dbData.success ? "success" : "error",
          message: dbData.message,
          details: dbData.error,
        },
      }))
    } catch (error) {
      setResults((prev) => ({
        ...prev,
        database: {
          status: "error",
          message: "Database connection failed",
          details: error instanceof Error ? error.message : String(error),
        },
      }))
    }

    // Test Database Schema
    try {
      const schemaResponse = await fetch("/api/diagnostics/schema")
      const schemaData = await schemaResponse.json()
      setResults((prev) => ({
        ...prev,
        schema: {
          status: schemaData.success ? "success" : "warning",
          message: schemaData.message,
          details: schemaData.tables?.join(", "),
        },
      }))
    } catch (error) {
      setResults((prev) => ({
        ...prev,
        schema: {
          status: "error",
          message: "Schema check failed",
          details: error instanceof Error ? error.message : String(error),
        },
      }))
    }

    // Test Authentication
    try {
      const authResponse = await fetch("/api/diagnostics/auth")
      const authData = await authResponse.json()
      setResults((prev) => ({
        ...prev,
        auth: {
          status: authData.success ? "success" : "warning",
          message: authData.message,
          details: authData.details,
        },
      }))
    } catch (error) {
      setResults((prev) => ({
        ...prev,
        auth: {
          status: "error",
          message: "Auth check failed",
          details: error instanceof Error ? error.message : String(error),
        },
      }))
    }

    // Test Stripe
    try {
      const stripeResponse = await fetch("/api/diagnostics/stripe")
      const stripeData = await stripeResponse.json()
      setResults((prev) => ({
        ...prev,
        stripe: {
          status: stripeData.success ? "success" : "warning",
          message: stripeData.message,
          details: stripeData.details,
        },
      }))
    } catch (error) {
      setResults((prev) => ({
        ...prev,
        stripe: {
          status: "error",
          message: "Stripe check failed",
          details: error instanceof Error ? error.message : String(error),
        },
      }))
    }

    setIsRunning(false)
  }

  useEffect(() => {
    runDiagnostics()
  }, [])

  const getStatusIcon = (status: DiagnosticResult["status"]) => {
    switch (status) {
      case "success":
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case "error":
        return <XCircle className="w-5 h-5 text-red-500" />
      case "warning":
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />
      case "pending":
        return <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
    }
  }

  const getStatusBadge = (status: DiagnosticResult["status"]) => {
    switch (status) {
      case "success":
        return <Badge className="bg-green-500">Operational</Badge>
      case "error":
        return <Badge variant="destructive">Error</Badge>
      case "warning":
        return <Badge variant="secondary">Warning</Badge>
      case "pending":
        return <Badge variant="outline">Checking...</Badge>
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">System Diagnostics</h1>
          <p className="text-gray-600 dark:text-gray-400">Comprehensive check of all integrations and functionality</p>
        </div>

        <div className="mb-6">
          <Button onClick={runDiagnostics} disabled={isRunning} size="lg">
            {isRunning ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Running Diagnostics...
              </>
            ) : (
              "Run Diagnostics"
            )}
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Environment Variables */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Server className="w-5 h-5" />
                  <CardTitle>Environment Variables</CardTitle>
                </div>
                {getStatusBadge(results.environment.status)}
              </div>
              <CardDescription>Configuration check</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-2">
                {getStatusIcon(results.environment.status)}
                <div className="flex-1">
                  <p className="font-medium">{results.environment.message}</p>
                  {results.environment.details && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {results.environment.status === "warning"
                        ? `Missing: ${results.environment.details}`
                        : results.environment.details}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Database (Neon) */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  <CardTitle>Neon Database</CardTitle>
                </div>
                {getStatusBadge(results.database.status)}
              </div>
              <CardDescription>PostgreSQL connection</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-2">
                {getStatusIcon(results.database.status)}
                <div className="flex-1">
                  <p className="font-medium">{results.database.message}</p>
                  {results.database.details && (
                    <p className="text-sm text-red-600 dark:text-red-400 mt-1">{results.database.details}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Database Schema */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  <CardTitle>Database Schema</CardTitle>
                </div>
                {getStatusBadge(results.schema.status)}
              </div>
              <CardDescription>Table structure verification</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-2">
                {getStatusIcon(results.schema.status)}
                <div className="flex-1">
                  <p className="font-medium">{results.schema.message}</p>
                  {results.schema.details && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Tables: {results.schema.details}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Authentication */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Key className="w-5 h-5" />
                  <CardTitle>Authentication</CardTitle>
                </div>
                {getStatusBadge(results.auth.status)}
              </div>
              <CardDescription>JWT-based auth system</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-2">
                {getStatusIcon(results.auth.status)}
                <div className="flex-1">
                  <p className="font-medium">{results.auth.message}</p>
                  {results.auth.details && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{results.auth.details}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stripe */}
          <Card className="md:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  <CardTitle>Stripe Integration</CardTitle>
                </div>
                {getStatusBadge(results.stripe.status)}
              </div>
              <CardDescription>Payment processing and subscriptions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-2">
                {getStatusIcon(results.stripe.status)}
                <div className="flex-1">
                  <p className="font-medium">{results.stripe.message}</p>
                  {results.stripe.details && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{results.stripe.details}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common maintenance tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <Button variant="outline" asChild>
                <a href="/api/db/migrate-password">Migrate Password Column</a>
              </Button>
              <Button variant="outline" asChild>
                <a href="/api/setup-db" target="_blank" rel="noreferrer">
                  Run Database Setup
                </a>
              </Button>
              <Button variant="outline" asChild>
                <a href="/setup">Configuration Setup</a>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Environment Variables Reference */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Required Environment Variables</CardTitle>
            <CardDescription>Copy these to your .env.local file</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg text-sm overflow-x-auto">
              {`# Database (Required)
DATABASE_URL=postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/neondb

# JWT Secret (Required)
JWT_SECRET=your-secret-key-at-least-32-characters-long

# Stripe (Optional - for payments)
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID_PRO_MONTHLY=price_...
STRIPE_PRICE_ID_PRO_YEARLY=price_...
STRIPE_PRICE_ID_TEAM_MONTHLY=price_...
STRIPE_PRICE_ID_TEAM_YEARLY=price_...

# App URL (Optional)
NEXT_PUBLIC_APP_URL=http://localhost:3000`}
            </pre>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
