/**
 * Embedded schema DDL for the PGLite demo backend. Generated from the Drizzle
 * migrations (scripts/gen-ddl.ts) so demo and production share one schema.
 * Applied once per process before the first query; no runtime file reads.
 */
export const ddl = `
CREATE TABLE IF NOT EXISTS app_meta (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
`;