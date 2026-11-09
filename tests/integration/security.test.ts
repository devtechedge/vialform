import { beforeAll, describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { and, eq, gt, isNull } from "drizzle-orm";
import { getDb, type Database } from "@/db/client";
import * as schema from "@/db/schema";
import { getStorage, sha256Hex } from "@/server/storage";
import { rateLimit } from "@/server/rate-limit";
import { assertSameOrigin } from "@/server/auth/csrf";
import { AuthError } from "@/server/auth/rbac";

let db: Database;
let buyerId: string;

beforeAll(async () => {
  db = await getDb();
  const [buyer] = await db.select().from(schema.users).where(eq(schema.users.email, "buyer@helix.demo"));
  buyerId = buyer!.id;
});

describe("session theft and replay", () => {
  it("a revoked session token no longer authenticates", async () => {
    const token = "test-token";
    const id = createHash("sha256").update(token).digest("hex");
    await db.insert(schema.sessions).values({ id, userId: buyerId, expiresAt: new Date(Date.now() + 60_000) });
    const active = () => db.select().from(schema.sessions).where(and(eq(schema.sessions.id, id), isNull(schema.sessions.revokedAt), gt(schema.sessions.expiresAt, new Date())));
    expect((await active()).length).toBe(1);
    await db.update(schema.sessions).set({ revokedAt: new Date() }).where(eq(schema.sessions.id, id));
    expect((await active()).length).toBe(0);
  });
});

describe("forged COA integrity", () => {
  it("detects tampered document bytes via SHA-256", async () => {
    const [doc] = await db.select().from(schema.lotDocuments).limit(1);
    const storage = getStorage();
    const original = await storage.get(doc!.storageKey);
    expect(original).not.toBeNull();
    expect(sha256Hex(original!.bytes)).toBe(doc!.sha256);
    await storage.put(doc!.storageKey, new TextEncoder().encode("forged content"), "text/plain");
    const forged = await storage.get(doc!.storageKey);
    expect(sha256Hex(forged!.bytes)).not.toBe(doc!.sha256);
  });
});

describe("rate limiting", () => {
  it("blocks after the limit within the window", () => {
    const key = `test-${Date.now()}`;
    expect(rateLimit(key, 2, 60_000).allowed).toBe(true);
    expect(rateLimit(key, 2, 60_000).allowed).toBe(true);
    const blocked = rateLimit(key, 2, 60_000);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterMs).toBeGreaterThan(0);
  });
});

describe("CSRF origin check", () => {
  it("allows a same-origin mutation", () => {
    const request = new Request("https://vialform.test/api/x", { method: "POST", headers: { origin: "https://vialform.test", host: "vialform.test" } });
    expect(() => assertSameOrigin(request)).not.toThrow();
  });

  it("blocks a cross-origin mutation", () => {
    const request = new Request("https://vialform.test/api/x", { method: "POST", headers: { origin: "https://evil.example", host: "vialform.test" } });
    expect(() => assertSameOrigin(request)).toThrow(AuthError);
  });

  it("blocks a mutation with no origin", () => {
    const request = new Request("https://vialform.test/api/x", { method: "POST", headers: { host: "vialform.test" } });
    expect(() => assertSameOrigin(request)).toThrow(AuthError);
  });

  it("ignores safe methods", () => {
    const request = new Request("https://vialform.test/api/x", { method: "GET" });
    expect(() => assertSameOrigin(request)).not.toThrow();
  });
});