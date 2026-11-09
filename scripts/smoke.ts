import { sql } from "drizzle-orm";
import { dbSource, getDb } from "../src/db/client";

/**
 * Local smoke check: boot the database backend and confirm the schema applied.
 * Production HTTP smoke checks live in scripts/health.ts (added with deploy).
 */
const db = await getDb();
const result = await db.execute<{ n: number }>(
  sql`SELECT count(*)::int AS n FROM information_schema.tables WHERE table_schema = 'public'`,
);
console.log("db source:", dbSource());
console.log("public tables:", result.rows[0]?.n ?? 0);
console.log("OK");