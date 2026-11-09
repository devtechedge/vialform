import type { PgliteDatabase } from "drizzle-orm/pglite";
import { getEnv, isDemoMode } from "@/env";
import { seedDemo } from "@/demo/seed";
import * as schema from "./schema";
import { bootstrapPglite } from "./bootstrap";

/**
 * Canonical database surface. The demo and test backend is embedded Postgres
 * (PGLite); production uses node-postgres against DATABASE_URL (Neon or
 * equivalent). Both Drizzle drivers expose the same PgDatabase query and
 * transaction API, so the export is typed canonically as the PGLite database
 * and the node-postgres instance is adapted at this single boundary.
 */
export type Database = PgliteDatabase<typeof schema>;
export type Transaction = Parameters<Parameters<Database["transaction"]>[0]>[0];
export type DbSource = "postgres" | "pglite";

const globalRef = globalThis as typeof globalThis & {
  __vialformDb?: Promise<Database>;
  __vialformDbSource?: DbSource;
};

function activeSource(): DbSource {
  const url = getEnv().DATABASE_URL;
  return url && url.trim() ? "postgres" : "pglite";
}

export function dbSource(): DbSource {
  return globalRef.__vialformDbSource ?? activeSource();
}

async function createPostgres(url: string): Promise<Database> {
  const { drizzle } = await import("drizzle-orm/node-postgres");
  const { Pool } = await import("pg");
  const pool = new Pool({
    connectionString: url,
    max: 5,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  });
  return drizzle(pool, { schema }) as unknown as Database;
}

async function createPglite(): Promise<Database> {
  const { PGlite } = await import("@electric-sql/pglite");
  const { drizzle } = await import("drizzle-orm/pglite");
  const client = new PGlite();
  await client.waitReady;
  await bootstrapPglite(client);
  const db = drizzle(client, { schema });
  if (isDemoMode()) await seedDemo(db);
  return db;
}

async function createDb(): Promise<Database> {
  const source = activeSource();
  globalRef.__vialformDbSource = source;
  if (source === "postgres") {
    return createPostgres(getEnv().DATABASE_URL!.trim());
  }
  return createPglite();
}

/** Server-only, memoized database accessor. Safe to call per request. */
export function getDb(): Promise<Database> {
  if (typeof window !== "undefined") {
    throw new Error("@/db/client is server-only; never import it from client code.");
  }
  globalRef.__vialformDb ??= createDb().catch((error) => {
    globalRef.__vialformDb = undefined;
    throw error;
  });
  return globalRef.__vialformDb;
}