import { sqliteTable, text, real, integer } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'

export const users = sqliteTable('users', {
  id:        text('id').primaryKey(),
  email:     text('email').notNull().unique(),
  password:  text('password').notNull(),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
})

export const receipts = sqliteTable('receipts', {
  id:          text('id').primaryKey(),
  userId:      text('user_id').notNull(),
  title:       text('title').notNull(),
  amount:      real('amount').notNull(),
  currency:    text('currency').notNull().default('EUR'),
  date:        text('date').notNull(),
  category:    text('category').notNull(),
  vendor:      text('vendor'),
  description: text('description'),
  imageUrl:    text('image_url'),
  rawText:     text('raw_text'),
  items:       text('items').default('[]'),      // JSON array
  tags:        text('tags').notNull().default('[]'), // JSON array
  isSynced:    integer('is_synced').notNull().default(0),
  createdAt:   text('created_at').notNull().default(sql`(datetime('now'))`),
  updatedAt:   text('updated_at').notNull().default(sql`(datetime('now'))`),
})
