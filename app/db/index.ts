import { loadEnvConfig } from '@next/env'
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from './schema'

loadEnvConfig(process.cwd())

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL must be a Neon postgres connection string')
}

const sql = neon(process.env.DATABASE_URL)
export const db = drizzle(sql, { schema })

// Export types for convenience
export type Project = typeof schema.projects.$inferSelect
export type ProjectInsert = typeof schema.projects.$inferInsert
export type Task = typeof schema.tasks.$inferSelect
export type TaskInsert = typeof schema.tasks.$inferInsert
export type Player = typeof schema.players.$inferSelect
export type PlayerInsert = typeof schema.players.$inferInsert
export type Comment = typeof schema.comments.$inferSelect
export type CommentInsert = typeof schema.comments.$inferInsert
export type Line = typeof schema.lines.$inferSelect
export type LineInsert = typeof schema.lines.$inferInsert

// Export schema for external use
export * from './schema'