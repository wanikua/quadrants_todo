"use server"

import { StackServerApp } from "@stackframe/stack"

if (!process.env.NEXT_PUBLIC_STACK_PROJECT_ID) {
  throw new Error("NEXT_PUBLIC_STACK_PROJECT_ID is not set")
}

if (!process.env.STACK_SECRET_SERVER_KEY) {
  throw new Error("STACK_SECRET_SERVER_KEY is not set")
}

export const stackServerApp = new StackServerApp({
  tokenStore: "nextjs-cookie",
  urls: {
    signIn: "/handler/sign-in",
    signUp: "/handler/sign-up",
    afterSignIn: "/projects",
    afterSignUp: "/projects",
    afterSignOut: "/",
  },
})

// Helper function to get current user ID from auth
export async function getCurrentUserId(): Promise<string | null> {
  try {
    const user = await stackServerApp.getUser()
    return user?.id || null
  } catch (error) {
    console.error("Failed to get current user:", error)
    return null
  }
}

// Helper function to require authentication
export async function requireAuth(): Promise<string> {
  const userId = await getCurrentUserId()
  if (!userId) {
    throw new Error("Unauthorized: User must be logged in")
  }
  return userId
}
