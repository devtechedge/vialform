# Security Policy

VIALFORM is a compliance-first procurement portal. This document states the
threat model, the controls implemented in v1, and the residual risks that a
production deployment must address. It is not legal advice.

## Reporting a vulnerability

Open a private security advisory on the repository, or email
security@vialform.example. Do not file public issues for vulnerabilities. Include
a reproduction and the affected route or service.

## Threat model

The assets are institution identity, jurisdiction approvals, lot and COA
integrity, quote/order pricing, and private documents. The adversaries considered
are: an unauthenticated visitor, a verified buyer attempting to reach another
tenant's data or bypass eligibility, a buyer tampering with prices or replaying
requests, and an attacker forging documents or stealing sessions.

## Controls implemented

- Authentication: database-backed sessions; only a SHA-256 hash of the session
  token is stored. Cookies are HttpOnly, SameSite=Lax and Secure in production.
  Passwords use scrypt with per-password salts and timing-safe verification.
- Authorization: role-based staff roles and organization membership roles.
  Tenant-scoped queries derive the organization from the session, never from
  client input. Cross-tenant access (IDOR) is rejected.
- Compliance gate: product-country eligibility is decided server-side. Only an
  ACTIVE, unexpired approval on a published product, with no global pause or kill
  switch, permits an RFQ. Consumer destinations and unverified institutions are
  blocked. Order confirmation is blocked in demo mode and until a fulfilment gate
  is enabled.
- CSRF: non-GET route handlers require a matching Origin host; Next.js server
  actions carry their own origin checks.
- Rate limiting: sliding-window limits on login, signup and upload.
- Uploads: 10 MB cap, MIME allowlist, a malware-scan hook (EICAR-detecting by
  default) and SHA-256 integrity.
- Private files: served only through short-lived HMAC-signed, expiring tokens
  bound to the document id, with a SHA-256 integrity check on read.
- Pricing: quote and order totals are recomputed server-side from quantity and
  unit price; client-supplied totals are never trusted. Lot reservation is atomic.
- Headers: CSP, HSTS (production), X-Content-Type-Options, X-Frame-Options,
  Referrer-Policy, Permissions-Policy and Cross-Origin-Opener-Policy.
- Audit: an append-only audit trail records actor, action, entity and metadata
  for privileged writes, committed atomically with the write.
- Secrets: server-only env, validated with Zod; production refuses default or
  short secrets. Logs store hashed IPs, not raw addresses.

## Residual risks and production requirements

- Demo mode ships synthetic accounts and data and resets on cold start. Demo
  credentials must never exist in a real production deployment (DEMO_MODE=false).
- The demo object store and rate limiter are process-local. Production must use
  durable private object storage and a shared rate-limit store.
- The malware hook is a testable stub; production must integrate a real scanner.
- The embedded PGLite backend is for the demo. Production must use a managed
  Postgres (DATABASE_URL) with migrations applied and backups configured.
- No health data is collected or stored.

## Tested

Integration tests cover tenant isolation, jurisdiction bypass, price tampering,
IDOR, session replay, forged-COA integrity, rate limits and CSRF origin checks.
End-to-end tests cover buyer/admin flows and WCAG 2.2 AA accessibility.