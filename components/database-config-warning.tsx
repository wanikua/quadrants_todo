"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"

export function DatabaseConfigWarning() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-6 h-6 text-yellow-600" />
          </div>
          <CardTitle className="text-xl font-bold">Database Configuration Required</CardTitle>
          <CardDescription>
            The project management features require a database connection.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted p-4 rounded-lg">
            <h3 className="font-semibold mb-2">To enable project features:</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>Create a free PostgreSQL database on <a href="https://neon.tech" target="_blank" rel="noopener" className="text-blue-600 hover:underline">Neon</a></li>
              <li>Copy your database connection string</li>
              <li>Add it to your <code className="bg-background px-1 rounded">.env.local</code> file:</li>
            </ol>
            <div className="mt-2 p-2 bg-background rounded text-xs font-mono">
              DATABASE_URL=postgresql://username:password@host/database
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Without a database, you can still use the basic task management features with local storage.
          </p>
          <div className="flex gap-2">
            <Button onClick={() => window.location.href = "/"} variant="outline" className="flex-1">
              Use Local Mode
            </Button>
            <Button onClick={() => window.location.reload()} className="flex-1">
              I've Added Database URL
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}