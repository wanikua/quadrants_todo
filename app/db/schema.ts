import { pgTable, text, timestamp, integer, serial, varchar, boolean, jsonb, real } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// Projects table
export const projects = pgTable('projects', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  type: text('type').notNull(), // 'personal' | 'team'
  owner_id: text('owner_id').notNull(),
  invite_code: text('invite_code'),
  created_at: timestamp('created_at').defaultNow().notNull(),
})

// Project members table
export const projectMembers = pgTable('project_members', {
  id: text('id').primaryKey(),
  project_id: text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  user_id: text('user_id').notNull(),
  role: text('role').notNull(), // 'owner' | 'admin' | 'member'
  joined_at: timestamp('joined_at').defaultNow().notNull(),
})

// Tasks table
export const tasks = pgTable('tasks', {
  id: serial('id').primaryKey(),
  project_id: text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  description: text('description').notNull(),
  urgency: integer('urgency').notNull(),
  importance: integer('importance').notNull(),
  predicted_urgency: integer('predicted_urgency'), // AI predicted urgency for learning
  predicted_importance: integer('predicted_importance'), // AI predicted importance for learning
  archived: boolean('archived').default(false),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
})

// Players table (links users to projects for task assignments)
export const players = pgTable('players', {
  id: serial('id').primaryKey(),
  project_id: text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  user_id: text('user_id').notNull(), // Links to the actual user
  name: text('name').notNull(),
  color: text('color').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
})

// Task assignments table (many-to-many relationship between tasks and players)
export const taskAssignments = pgTable('task_assignments', {
  id: serial('id').primaryKey(),
  task_id: integer('task_id').notNull().references(() => tasks.id, { onDelete: 'cascade' }),
  player_id: integer('player_id').notNull().references(() => players.id, { onDelete: 'cascade' }),
  assigned_at: timestamp('assigned_at').defaultNow().notNull(),
})

// Lines table (task connections)
export const lines = pgTable('lines', {
  id: serial('id').primaryKey(),
  project_id: text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  from_task_id: integer('from_task_id').notNull().references(() => tasks.id, { onDelete: 'cascade' }),
  to_task_id: integer('to_task_id').notNull().references(() => tasks.id, { onDelete: 'cascade' }),
  style: varchar('style', { length: 10 }).notNull().default('filled'),
  size: integer('size').notNull().default(8),
  color: varchar('color', { length: 7 }).notNull().default('#374151'),
  created_at: timestamp('created_at').defaultNow().notNull(),
})

// Comments table
export const comments = pgTable('comments', {
  id: serial('id').primaryKey(),
  task_id: integer('task_id').notNull().references(() => tasks.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  author_name: text('author_name').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
})

// User activity table (for tracking online users)
export const userActivity = pgTable('user_activity', {
  id: serial('id').primaryKey(),
  project_id: text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  user_id: text('user_id').notNull(),
  last_seen: timestamp('last_seen').defaultNow().notNull(),
})

// Define relations
export const projectsRelations = relations(projects, ({ many }: { many: any }) => ({
  members: many(projectMembers),
  tasks: many(tasks),
  players: many(players),
  lines: many(lines),
}))

export const projectMembersRelations = relations(projectMembers, ({ one }: { one: any }) => ({
  project: one(projects, {
    fields: [projectMembers.project_id],
    references: [projects.id],
  }),
}))

export const tasksRelations = relations(tasks, ({ one, many }: { one: any; many: any }) => ({
  project: one(projects, {
    fields: [tasks.project_id],
    references: [projects.id],
  }),
  assignments: many(taskAssignments),
  comments: many(comments),
  fromLines: many(lines, { relationName: 'fromTask' }),
  toLines: many(lines, { relationName: 'toTask' }),
}))

export const playersRelations = relations(players, ({ one, many }: { one: any; many: any }) => ({
  project: one(projects, {
    fields: [players.project_id],
    references: [projects.id],
  }),
  assignments: many(taskAssignments),
}))

export const taskAssignmentsRelations = relations(taskAssignments, ({ one }: { one: any }) => ({
  task: one(tasks, {
    fields: [taskAssignments.task_id],
    references: [tasks.id],
  }),
  player: one(players, {
    fields: [taskAssignments.player_id],
    references: [players.id],
  }),
}))

export const linesRelations = relations(lines, ({ one }: { one: any }) => ({
  project: one(projects, {
    fields: [lines.project_id],
    references: [projects.id],
  }),
  fromTask: one(tasks, {
    fields: [lines.from_task_id],
    references: [tasks.id],
    relationName: 'fromTask',
  }),
  toTask: one(tasks, {
    fields: [lines.to_task_id],
    references: [tasks.id],
    relationName: 'toTask',
  }),
}))

export const commentsRelations = relations(comments, ({ one }: { one: any }) => ({
  task: one(tasks, {
    fields: [comments.task_id],
    references: [tasks.id],
  }),
}))

// AI Task Predictions table (for learning from user adjustments)
export const taskPredictions = pgTable('task_predictions', {
  id: serial('id').primaryKey(),
  user_id: text('user_id').notNull(),
  project_id: text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  task_description: text('task_description').notNull(),
  predicted_urgency: integer('predicted_urgency').notNull(),
  predicted_importance: integer('predicted_importance').notNull(),
  final_urgency: integer('final_urgency').notNull(),
  final_importance: integer('final_importance').notNull(),
  adjustment_delta: jsonb('adjustment_delta'), // { urgency_delta, importance_delta }
  created_at: timestamp('created_at').defaultNow().notNull(),
})

// User Task Preferences table (for personalized predictions)
export const userTaskPreferences = pgTable('user_task_preferences', {
  user_id: text('user_id').primaryKey(),
  avg_urgency_bias: real('avg_urgency_bias').default(0),
  avg_importance_bias: real('avg_importance_bias').default(0),
  keyword_patterns: jsonb('keyword_patterns'), // { "urgent": { urgency: 80 }, "important": { importance: 90 } }
  updated_at: timestamp('updated_at').defaultNow().notNull(),
})

export const taskPredictionsRelations = relations(taskPredictions, ({ one }: { one: any }) => ({
  project: one(projects, {
    fields: [taskPredictions.project_id],
    references: [projects.id],
  }),
}))
