import { StackServerApp } from "@stackframe/stack"

export const stackServerApp = new StackServerApp({
  tokenStore: "nextjs-cookie",
  urls: {
    home: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    signIn: "/auth/signin",
    signUp: "/auth/signup",
    afterSignIn: "/projects",
    afterSignUp: "/projects",
    afterSignOut: "/",
  },
})

export async function getServerUser() {
  return await stackServerApp.getUser()
}

export async function requireServerAuth() {
  const user = await stackServerApp.getUser()
  if (!user) {
    throw new Error("Unauthorized")
  }
  return user
}

export async function getServerUserId(): Promise<string | null> {
  const user = await stackServerApp.getUser()
  return user?.id ?? null
}
