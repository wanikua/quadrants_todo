import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from './schema'

// Validate DATABASE_URL format
const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  console.warn('DATABASE_URL is not set')
}

let sql: any = null
let db: any = null

if (databaseUrl) {
  try {
    // Validate the URL format
    if (!databaseUrl.startsWith('postgresql://') && !databaseUrl.startsWith('postgres://')) {
      throw new Error('DATABASE_URL must start with postgresql:// or postgres://')
    }
    
    sql = neon(databaseUrl)
    db = drizzle(sql, { schema })
  } catch (error) {
    console.error('Failed to initialize database connection:', error)
    // Set to null so we can handle gracefully
    sql = null
    db = null
  }
}

// Export with null checks
export { db, sql }

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
