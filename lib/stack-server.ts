"use server"

import { StackServerApp } from "@stackframe/stack"

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
