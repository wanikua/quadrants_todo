import { StackServerApp } from "@stackframe/stack"

export const stackServerApp = new StackServerApp({
  tokenStore: "nextjs-cookie",
  urls: {
    home: "/",
    signIn: "/auth/signin",
    signUp: "/auth/signup",
    afterSignIn: "/projects",
    afterSignUp: "/projects",
    afterSignOut: "/",
  },
})
