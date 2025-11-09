// lib/env.ts

// Centralized, typed environment access
// Note: These functions are used on the server (layouts, middleware, API routes).

type Env = {
  DATABASE_URL: string
}

export const env: Env = {
  DATABASE_URL: process.env.DATABASE_URL || "",
}

export function isDatabaseConfigured(): boolean {
  return Boolean(env.DATABASE_URL)
}
