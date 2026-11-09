# Architecture

VIALFORM is a Next.js App Router application with a server-first design: reads
happen in server components, writes go through typed server actions and route
handlers, and the client never decides authorization, eligibility or pricing.

## Layers

- `src/app` - routes (public catalogue/dossier/compare, auth, workspace, admin)
  and API route handlers (health, signed files, uploads, watchlist CSV).
- `src/server` - domain services: `compliance` (eligibility gate + lifecycle),
  `procurement` (RFQ/quote/PO/order/shipment + atomic reservation), `catalogue`
  (search + dossier aggregation), `auth` (sessions, RBAC, CSRF, password),
  `audit`, `system` (global flags), `storage`/`files`/`uploads`/`documents`.
- `src/db` - Drizzle schema split per domain (`schema/*.ts`), a memoized client
  that selects node-postgres (DATABASE_URL) or embedded PGLite (demo), embedded
  DDL bootstrap, and a serializable transaction helper with bounded retry.
- `src/domain` - shared enums (status vocabularies + lifecycle transitions) and
  minor-unit money helpers.
- `src/demo` - grounded candidate identities, verified regulatory sources, and
  the idempotent synthetic seed.
- `src/components` - design primitives, site shell, and client action forms.

## Data flow and invariants

- Money is integer minor units with an ISO currency; totals are recomputed
  server-side. Timestamps are UTC. Quote/order line snapshots are immutable.
- Tenant-scoped tables carry `organization_id`; guards derive the organization
  from the session, never from client input.
- The compliance gate (`checkEligibility`) is the single authority for whether
  procurement may proceed; it is re-checked at RFQ submit and order confirmation.
- Privileged writes and their audit events commit in one transaction.

## Backends

- Demo: embedded Postgres (PGLite), schema applied from the embedded DDL module
  and synthetic data seeded on boot; state resets on cold start. WASM assets are
  force-traced for Vercel serverless.
- Production: node-postgres against a managed Postgres; migrations under
  `drizzle/` applied by `scripts/migrate.ts`. The seed refuses production
  non-demo runs.

## Schema generation

`pnpm db:generate` runs drizzle-kit to emit SQL migrations and regenerates
`src/db/ddl.ts` so demo and production apply an identical schema.