import { StackServerApp } from "@stack-auth/nextjs/server"

export const stackServerApp = new StackServerApp({
  tokenStore: "nextjs-cookie",
  urls: {
    signIn: "/auth/signin",
    signUp: "/auth/signup",
    afterSignIn: "/projects",
    afterSignUp: "/projects",
    afterSignOut: "/",
  },
})
