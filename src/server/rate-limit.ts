/**
 * Process-local sliding-window rate limiter for auth and privileged actions.
 * Demo state resets on cold start; a production deployment would back this with
 * a shared store. Keys should combine a client identifier and the action.
 */
const globalRef = globalThis as typeof globalThis & {
  __vialformRate?: Map<string, number[]>;
};

function bucket(): Map<string, number[]> {
  globalRef.__vialformRate ??= new Map();
  return globalRef.__vialformRate;
}

export type RateResult = { allowed: boolean; remaining: number; retryAfterMs: number };

export function rateLimit(key: string, limit: number, windowMs: number): RateResult {
  const now = Date.now();
  const store = bucket();
  const hits = (store.get(key) ?? []).filter((timestamp) => now - timestamp < windowMs);
  if (hits.length >= limit) {
    store.set(key, hits);
    const first = hits[0] ?? now;
    return { allowed: false, remaining: 0, retryAfterMs: Math.max(0, windowMs - (now - first)) };
  }
  hits.push(now);
  store.set(key, hits);
  return { allowed: true, remaining: limit - hits.length, retryAfterMs: 0 };
}

export function clientKey(request: Request, action: string): string {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return `${action}:${forwarded ?? "local"}`;
}