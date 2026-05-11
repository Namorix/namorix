import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core"

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: integer("role").notNull().default(0),
  createAt: text("create_at").notNull(),
})

export const refreshTokens = sqliteTable("refresh_tokens", {
  jti: text("jti").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  userAgent: text("user_agent"),
  fingerprint: text("fingerprint"),
  ipAddress: text("ip_address"),
  lastUsedAt: text("last_used_at").notNull(),
  createAt: text("create_at").notNull(),
  expiresAt: text("expires_at").notNull(),
})

export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
})
