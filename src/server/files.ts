import { createHmac, timingSafeEqual } from "node:crypto";
import { getEnv } from "@/env";

/**
 * Private files are served only through a short-lived HMAC-signed token bound
 * to the document id and an expiry. Tokens are timing-safe verified; expired or
 * forged tokens are rejected. No public object listing exists.
 */
export function signFileToken(fileId: string, expiresAtMs: number): string {
  const payload = `${fileId}.${expiresAtMs}`;
  const signature = createHmac("sha256", getEnv().FILE_SIGNING_SECRET).update(payload).digest("hex");
  return `${payload}.${signature}`;
}

export function verifyFileToken(token: string): { fileId: string; expiresAtMs: number } | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const fileId = parts[0];
  const expiry = parts[1];
  const signature = parts[2];
  if (!fileId || !expiry || !signature) return null;
  const expiresAtMs = Number(expiry);
  if (!Number.isFinite(expiresAtMs) || Date.now() > expiresAtMs) return null;
  const expected = createHmac("sha256", getEnv().FILE_SIGNING_SECRET).update(`${fileId}.${expiry}`).digest("hex");
  const provided = Buffer.from(signature, "hex");
  const expectedBuffer = Buffer.from(expected, "hex");
  if (provided.length !== expectedBuffer.length || !timingSafeEqual(provided, expectedBuffer)) return null;
  return { fileId, expiresAtMs };
}

export const FILE_TOKEN_TTL_MS = 5 * 60 * 1000;