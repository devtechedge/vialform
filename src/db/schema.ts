/**
 * Drizzle schema barrel. Each domain owns a module; migrations under drizzle/
 * and the embedded DDL module (ddl.ts) are generated from this surface so the
 * PGLite demo and production Postgres apply an identical schema.
 */
export * from "./schema/identity";
export * from "./schema/catalogue";
export * from "./schema/compliance";
export * from "./schema/lots";
export * from "./schema/system";