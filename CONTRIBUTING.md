# Contributing

Thanks for considering a contribution. VIALFORM is a compliance-first scientific
procurement portal, so correctness and honesty matter more than feature count.

## Ground rules

- Keep the regulatory stance: no human or veterinary use, no dosing or therapeutic
  claims, no inferred legality. Candidates default to not approved. Never present
  synthetic data as real; label demo data clearly.
- Never trust the client for authorization, eligibility or pricing. Enforce gates
  server-side and audit privileged writes.
- Keep diffs small and focused. Add a regression test that fails before the fix.
- Public-facing text (README, commits, UI copy) uses plain hyphens, never em
  dashes, and never names an audience or internal tooling.

## Local setup

```bash
pnpm install
cp .env.example .env   # placeholders only; demo mode needs no real secrets
pnpm dev
```

The demo backend is embedded Postgres (PGLite) and auto-seeds synthetic data on
boot. Set DATABASE_URL to use a managed Postgres instead.

## Checks before a pull request

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm test:integration
pnpm build
pnpm e2e        # requires a prior build; starts a production server
```

Regenerate schema artifacts after changing the Drizzle schema:

```bash
pnpm db:generate   # writes drizzle/ migrations and the embedded DDL module
```

## Commits

Use small, named, conventional commits (feat, fix, test, docs, ci, chore). Keep the
default branch buildable. Do not split whitespace or rewrite dates.

## Schema and money

Money is integer minor units with an ISO currency code; never use floating point.
Timestamps are UTC. Quote and order snapshots are immutable.