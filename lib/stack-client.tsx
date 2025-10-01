"use client"

import { StackProvider as StackProviderSDK, StackTheme } from "@stackframe/stack"
import { STACK_CONFIG } from "./stack-config"

export function StackProvider({ children }: { children: React.ReactNode }) {
  return (
    <StackProviderSDK
      app={{
        projectId: STACK_CONFIG.projectId,
        publishableClientKey: STACK_CONFIG.publishableClientKey,
      }}
    >
      <StackTheme>{children}</StackTheme>
    </StackProviderSDK>
  )
}
