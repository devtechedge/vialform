# Deployment

VIALFORM deploys to Vercel (Next.js App Router). The public demonstration runs in
demo mode on embedded Postgres (PGLite); a production deployment uses a managed
Postgres via DATABASE_URL.

## Environment variables

| Variable | Purpose | Demo default |
| --- | --- | --- |
| DEMO_MODE | Enable the synthetic demo backend and labels | true |
| DATABASE_URL | Managed Postgres (Neon/equivalent); when set, node-postgres is used | unset (PGLite) |
| DATABASE_URL_UNPOOLED | Direct connection for migrations | unset |
| APP_URL | Public origin, set to the production alias after first deploy | http://localhost:3000 |
| AUTH_SECRET | Signs sessions/CSRF; >= 32 chars, non-default in production | dev-only (refused in prod) |
| FILE_SIGNING_SECRET | Signs private download URLs; >= 32 chars in production | dev-only (refused in prod) |
| ALLOW_PROD_SEED | Must be "1" to seed a non-demo database | unset |

Never commit real values. `.env.example` carries placeholders only.

## First deploy (Vercel)

1. Create/link the project: `vercel link --project vialform` (team devtechedge1).
2. Set framework preset to `nextjs` and disable Vercel Authentication (SSO) so the
   public URL serves the app: project PATCH `{"framework":"nextjs","ssoProtection":null}`.
3. Add env vars with `vercel env add` (AUTH_SECRET, FILE_SIGNING_SECRET, DEMO_MODE,
   APP_URL). Generate strong secrets; do not print them.
4. Ensure git auto-deploy is enabled and the production branch is `main`.
5. Deploy from main: `vercel --prod` (or push to main). Read the production alias
   from the deploy output; set APP_URL to it and redeploy.
6. Smoke-test: `GET /api/health` returns `{status:"ok", db, demo, products}`.

## Database

- Demo (PGLite): schema and synthetic seed apply automatically on boot; state
  resets on cold start. No migration step is needed.
- Production (Postgres): apply migrations with `pnpm db:migrate` against
  DATABASE_URL_UNPOOLED, then seed only if explicitly intended
  (`ALLOW_PROD_SEED=1 pnpm db:seed`). The seed refuses production non-demo runs.

## Rollback

Vercel keeps prior deployments. Promote the last known-good deployment from the
dashboard, or `vercel rollback`. Because demo state is ephemeral, a rollback does
not lose real data. For production Postgres, restore from the provider's backup /
point-in-time recovery and re-run migrations if the schema changed.

## Health and monitoring

- `/api/health` is the liveness + database-readiness probe.
- CI runs lint, typecheck, unit, integration, build, e2e (with axe) and a
  production dependency audit on every push and pull request.