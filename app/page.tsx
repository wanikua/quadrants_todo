import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, Grid, Target, Zap } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Quadrant Task Manager
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            Organize your tasks using the Eisenhower Matrix
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/auth/signup">
              <Button size="lg">Get Started</Button>
            </Link>
            <Link href="/auth/signin">
              <Button size="lg" variant="outline">
                Sign In
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <Card>
            <CardHeader>
              <Target className="h-10 w-10 mb-2 text-red-500" />
              <CardTitle>Urgent & Important</CardTitle>
              <CardDescription>Do it now</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Critical tasks that require immediate attention
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CheckCircle className="h-10 w-10 mb-2 text-blue-500" />
              <CardTitle>Not Urgent & Important</CardTitle>
              <CardDescription>Schedule it</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400">Important tasks to plan and schedule</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Zap className="h-10 w-10 mb-2 text-yellow-500" />
              <CardTitle>Urgent & Not Important</CardTitle>
              <CardDescription>Delegate it</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400">Tasks that can be delegated to others</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Grid className="h-10 w-10 mb-2 text-gray-500" />
              <CardTitle>Not Urgent & Not Important</CardTitle>
              <CardDescription>Delete it</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400">Low priority tasks to eliminate</p>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <h2 className="text-3xl font-bold mb-4">Why Use Quadrant Task Manager?</h2>
          <div className="max-w-2xl mx-auto text-gray-600 dark:text-gray-300 space-y-4">
            <p>
              The Eisenhower Matrix helps you prioritize tasks by urgency and importance, allowing you to focus on what
              truly matters.
            </p>
            <p>Sign up now to start organizing your tasks more effectively!</p>
          </div>
        </div>
      </div>
    </div>
  )
}
