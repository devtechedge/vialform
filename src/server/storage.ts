import { createHash } from "node:crypto";
import { isDemoMode } from "@/env";

export interface StoredObject {
  bytes: Uint8Array;
  mimeType: string;
}

export interface StorageAdapter {
  put(key: string, bytes: Uint8Array, mimeType: string): Promise<void>;
  get(key: string): Promise<StoredObject | null>;
}

const globalStore = globalThis as typeof globalThis & {
  __vialformStorage?: Map<string, StoredObject>;
};

function demoMap(): Map<string, StoredObject> {
  globalStore.__vialformStorage ??= new Map();
  return globalStore.__vialformStorage;
}

/** Demo adapter: process-local object store, reset on cold start with the DB. */
const demoAdapter: StorageAdapter = {
  async put(key, bytes, mimeType) {
    demoMap().set(key, { bytes, mimeType });
  },
  async get(key) {
    return demoMap().get(key) ?? null;
  },
};

export function getStorage(): StorageAdapter {
  if (isDemoMode()) return demoAdapter;
  throw new Error("Private object storage is not configured for production. Configure the production adapter before leaving demo mode.");
}

export function sha256Hex(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

/** Deterministic synthetic document content, unmistakably labelled as demo. */
export function syntheticDocument(label: string): Uint8Array {
  const text = [
    "VIALFORM SYNTHETIC DEMO DOCUMENT",
    label,
    "",
    "SYNTHETIC DEMO - NOT VALID.",
    "This file is illustrative demonstration data. It is not a certificate of",
    "analysis, not an analytical test result, and not a regulatory document.",
    "No purity, identity or assay value here has been measured.",
  ].join("\n");
  return new TextEncoder().encode(text);
}