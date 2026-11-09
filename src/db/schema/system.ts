import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

/**
 * Key/value system state. Holds the global sales pause and kill switch flags
 * read by the procurement gate, plus schema metadata. Privileged writes are
 * authorized and audited.
 */
export const appMeta = pgTable("app_meta", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});