import { AuthError } from "./rbac";

/**
 * Block cross-origin mutations. For non-GET requests the Origin header must be
 * present and its host must match the request host. This complements Next.js
 * server-action origin checks and protects route handlers from CSRF.
 */
export function assertSameOrigin(request: Request): void {
  const method = request.method.toUpperCase();
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") return;
  const origin = request.headers.get("origin");
  if (!origin) throw new AuthError("Missing Origin header for mutation.", 403);
  const url = new URL(request.url);
  const host = request.headers.get("host") ?? url.host;
  let originHost: string;
  try {
    originHost = new URL(origin).host;
  } catch {
    throw new AuthError("Invalid Origin header.", 403);
  }
  if (originHost !== host) throw new AuthError("Cross-origin request blocked.", 403);
}