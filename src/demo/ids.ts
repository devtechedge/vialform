import { createHash } from "node:crypto";

/**
 * Deterministic UUID for demo seed rows. The embedded PGLite demo runs per
 * serverless instance; random ids would make links generated on one instance
 * 404 on another. Deriving ids from a stable key keeps every instance identical.
 */
export function did(key: string): string {
  const h = createHash("sha256").update(`vialform-demo:${key}`).digest("hex");
  const variant = ((parseInt(h[16]!, 16) & 0x3) | 0x8).toString(16);
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-${variant}${h.slice(17, 20)}-${h.slice(20, 32)}`;
}