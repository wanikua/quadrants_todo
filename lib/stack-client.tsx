"use client"

import { StackProvider as StackProviderSDK, StackTheme } from "@stackframe/stack"

export function StackProvider({ children }: { children: React.ReactNode }) {
  return (
    <StackProviderSDK
      app={{
        projectId: process.env.NEXT_PUBLIC_STACK_PROJECT_ID || "",
        publishableClientKey: process.env.NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY || "",
      }}
    >
      <StackTheme>{children}</StackTheme>
    </StackProviderSDK>
  )
}
