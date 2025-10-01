"use client"

import type React from "react"

import { StackProvider as StackProviderBase, StackTheme as StackThemeBase } from "@stackframe/stack"

export function StackProvider({ children }: { children: React.ReactNode }) {
  return (
    <StackProviderBase
      app={{
        projectId: process.env.NEXT_PUBLIC_STACK_PROJECT_ID!,
        publishableClientKey: process.env.NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY!,
      }}
    >
      {children}
    </StackProviderBase>
  )
}

export function StackTheme({ children }: { children: React.ReactNode }) {
  return <StackThemeBase>{children}</StackThemeBase>
}
