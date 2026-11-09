import "dotenv/config";
import { getEnv, isDemoMode } from "../src/env";
import { getDb } from "../src/db/client";
import { seedDemo } from "../src/demo/seed";

/**
 * Seed demo data only. Refuses to run against a production non-demo database:
 * seeding requires demo mode, or an explicit ALLOW_PROD_SEED=1 opt-in outside
 * production. The seed itself is idempotent.
 */
const env = getEnv();
if (env.NODE_ENV === "production" && !isDemoMode()) {
  console.error("Refusing to seed a production non-demo database.");
  process.exit(1);
}
if (!isDemoMode() && env.ALLOW_PROD_SEED !== "1") {
  console.error("Refusing to seed: not in demo mode and ALLOW_PROD_SEED is not '1'.");
  process.exit(1);
}

const db = await getDb();
await seedDemo(db);
console.log("Demo seed complete (idempotent).");