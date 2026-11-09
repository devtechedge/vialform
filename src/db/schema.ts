import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

/**
 * Schema is defined here with Drizzle and mirrored to SQL migrations under
 * drizzle/. The embedded DDL module (ddl.ts) is generated from those migrations
 * so the PGLite demo backend applies the exact same schema without runtime fs.
 */
export const appMeta = pgTable("app_meta", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});