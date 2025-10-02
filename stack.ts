import { StackServerApp } from "@stackframe/stack"

export const stackServerApp = new StackServerApp({
  tokenStore: "nextjs-cookie",
  urls: {
    signIn: "/auth/signin",
    afterSignIn: "/projects",
    afterSignOut: "/",
    afterSignUp: "/projects",
  },
})

export async function getUser() {
  return await stackServerApp.getUser()
}

export async function requireUser() {
  const user = await getUser()

  if (!user) {
    throw new Error("Unauthorized")
  }

  return user
}
