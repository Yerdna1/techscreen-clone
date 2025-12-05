import { pgTable, uuid, text, integer, timestamp, pgEnum } from "drizzle-orm/pg-core"

// Enums
export const subscriptionTierEnum = pgEnum("subscription_tier", [
  "free",
  "professional",
  "enterprise",
])

export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "active",
  "cancelled",
  "past_due",
  "trialing",
])

export const inputTypeEnum = pgEnum("input_type", [
  "text",
  "screenshot",
  "audio",
  "system_audio",
])

export const transactionTypeEnum = pgEnum("transaction_type", [
  "usage",
  "purchase",
  "subscription_reset",
  "bonus",
])

// Users table
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  clerkId: text("clerk_id").notNull().unique(),
  email: text("email").notNull(),
  name: text("name"),
  imageUrl: text("image_url"),
  tokens: integer("tokens").notNull().default(3),
  subscriptionTier: subscriptionTierEnum("subscription_tier").notNull().default("free"),
  subscriptionId: text("subscription_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

// Questions table
export const questions = pgTable("questions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  inputType: inputTypeEnum("input_type").notNull().default("text"),
  inputContent: text("input_content").notNull(),
  programmingLanguage: text("programming_language").notNull().default("javascript"),
  response: text("response"),
  tokensUsed: integer("tokens_used").notNull().default(1),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

// Subscriptions table
export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  polarSubscriptionId: text("polar_subscription_id").notNull().unique(),
  plan: subscriptionTierEnum("plan").notNull(),
  status: subscriptionStatusEnum("status").notNull().default("active"),
  currentPeriodStart: timestamp("current_period_start").notNull(),
  currentPeriodEnd: timestamp("current_period_end").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

// Token transactions table
export const tokenTransactions = pgTable("token_transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  amount: integer("amount").notNull(),
  type: transactionTypeEnum("type").notNull(),
  description: text("description").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

// API Keys table for desktop app authentication
export const apiKeys = pgTable("api_keys", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  key: text("key").notNull().unique(),
  name: text("name").notNull().default("Desktop App"),
  lastUsedAt: timestamp("last_used_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

// Type exports for use in application
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Question = typeof questions.$inferSelect
export type NewQuestion = typeof questions.$inferInsert
export type Subscription = typeof subscriptions.$inferSelect
export type NewSubscription = typeof subscriptions.$inferInsert
export type TokenTransaction = typeof tokenTransactions.$inferSelect
export type NewTokenTransaction = typeof tokenTransactions.$inferInsert
export type ApiKey = typeof apiKeys.$inferSelect
export type NewApiKey = typeof apiKeys.$inferInsert
