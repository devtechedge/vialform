import { boolean, integer, timestamp } from "drizzle-orm/pg-core";

/** Fresh column builders per table (a Drizzle builder may only be used once). */
export const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
export const updatedAt = () => timestamp("updated_at", { withTimezone: true }).notNull().defaultNow();
export const revision = () => integer("revision").notNull().default(1);
export const isDemo = () => boolean("is_demo").notNull().default(false);