"use client"

import { SignIn, SignUp, SignedIn, SignedOut } from "@clerk/nextjs"
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function AuthPage() {
  const [activeTab, setActiveTab] = useState("signin")

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-gray-900">Quadrant Task Manager</CardTitle>
            <CardDescription className="text-gray-600">Organize your tasks with priority quadrants</CardDescription>
          </CardHeader>
          <CardContent>
            <SignedOut>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="signin">Sign In</TabsTrigger>
                  <TabsTrigger value="signup">Sign Up</TabsTrigger>
                </TabsList>
                <TabsContent value="signin" className="mt-6">
                  <div className="flex justify-center">
                    <SignIn
                      appearance={{
                        elements: {
                          rootBox: "w-full",
                          card: "shadow-none border-0 bg-transparent",
                        },
                      }}
                    />
                  </div>
                </TabsContent>
                <TabsContent value="signup" className="mt-6">
                  <div className="flex justify-center">
                    <SignUp
                      appearance={{
                        elements: {
                          rootBox: "w-full",
                          card: "shadow-none border-0 bg-transparent",
                        },
                      }}
                    />
                  </div>
                </TabsContent>
              </Tabs>
            </SignedOut>
            <SignedIn>
              <div className="text-center">
                <p className="text-green-600 mb-4">Successfully signed in!</p>
                <p className="text-gray-600">Redirecting to your projects...</p>
              </div>
            </SignedIn>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
