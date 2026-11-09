import "dotenv/config";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { Pool } from "pg";

/**
 * Apply Drizzle SQL migrations to a production Postgres database (Neon or
 * equivalent) via DATABASE_URL_UNPOOLED / DATABASE_URL. Tracks applied files in
 * _migrations and applies each atomically. The PGLite demo backend does not use
 * this path; it applies the embedded DDL on boot.
 */
const url = process.env.DATABASE_URL_UNPOOLED?.trim() || process.env.DATABASE_URL?.trim();
if (!url) {
  console.error("DATABASE_URL_UNPOOLED or DATABASE_URL is required for production migrations.");
  process.exit(1);
}

const pool = new Pool({ connectionString: url });
const dir = join(process.cwd(), "drizzle");
const files = readdirSync(dir).filter((file) => file.endsWith(".sql")).sort();

await pool.query(
  "CREATE TABLE IF NOT EXISTS _migrations (name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())",
);
const { rows } = await pool.query<{ name: string }>("SELECT name FROM _migrations");
const done = new Set(rows.map((row) => row.name));

for (const file of files) {
  if (done.has(file)) continue;
  const sql = readFileSync(join(dir, file), "utf8");
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(sql);
    await client.query("INSERT INTO _migrations (name) VALUES ($1)", [file]);
    await client.query("COMMIT");
    console.log(`Applied ${file}`);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(`Failed ${file}:`, error);
    process.exit(1);
  } finally {
    client.release();
  }
}

await pool.end();
console.log("Migrations complete.");