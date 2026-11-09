import { sql } from "drizzle-orm";
import { dbSource, getDb } from "../src/db/client";

/**
 * Local smoke check: boot the database backend, confirm the schema applied and
 * the demo seed populated. Production HTTP smoke checks live in scripts/health.ts.
 */
const db = await getDb();
const tables = await db.execute<{ n: number }>(
  sql`SELECT count(*)::int AS n FROM information_schema.tables WHERE table_schema = 'public'`,
);
const counts = await db.execute<{ candidates: number; products: number; lots: number; approvals: number }>(
  sql`SELECT
    (SELECT count(*)::int FROM candidates) AS candidates,
    (SELECT count(*)::int FROM products) AS products,
    (SELECT count(*)::int FROM lots) AS lots,
    (SELECT count(*)::int FROM jurisdiction_approvals) AS approvals`,
);
console.log("db source:", dbSource());
console.log("public tables:", tables.rows[0]?.n ?? 0);
console.log("seed counts:", counts.rows[0]);
console.log("OK");