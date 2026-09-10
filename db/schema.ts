import { sql } from 'drizzle-orm';
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const gameResults = sqliteTable('game_results', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  sessionId: text('session_id').notNull(),
  levelId: text('level_id').notNull(),
  attempts: integer('attempts').notNull(),
  completed: integer('completed', { mode: 'boolean' }).notNull(),
  durationMs: integer('duration_ms').notNull(),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const feedback = sqliteTable('feedback', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  sessionId: text('session_id').notNull(),
  role: text('role').notNull(),
  rating: integer('rating').notNull(),
  tags: text('tags').notNull(),
  comment: text('comment').notNull(),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const assistantEvents = sqliteTable('assistant_events', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  sessionId: text('session_id').notNull(),
  audience: text('audience').notNull(),
  mode: text('mode').notNull(),
  category: text('category').notNull(),
  durationMs: integer('duration_ms').notNull(),
  safetyFlag: integer('safety_flag', { mode: 'boolean' }).notNull(),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});
