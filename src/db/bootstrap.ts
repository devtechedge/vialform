import type { PGlite } from "@electric-sql/pglite";
import { ddl } from "./ddl";

/**
 * Apply the embedded schema to a fresh in-memory PGLite instance. The demo
 * database is ephemeral (resets on cold start); seeding is handled separately
 * by scripts/seed.ts and the demo bootstrap so production never auto-seeds.
 */
export async function bootstrapPglite(client: PGlite): Promise<void> {
  await client.exec(ddl);
}