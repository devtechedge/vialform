import { randomBytes } from "node:crypto";
import { getStorage, sha256Hex } from "./storage";

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
export const ALLOWED_MIME_TYPES = ["application/pdf", "image/png", "image/jpeg", "text/plain"] as const;

export class UploadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UploadError";
  }
}

/**
 * Malware-scan hook. The default implementation detects the EICAR antivirus
 * test signature so the pipeline is testable; a production deployment replaces
 * this with a real scanner behind the same interface.
 */
export function scanForMalware(bytes: Uint8Array): { clean: boolean; signature?: string } {
  const text = new TextDecoder("latin1").decode(bytes);
  if (text.includes("EICAR-STANDARD-ANTIVIRUS-TEST-FILE")) return { clean: false, signature: "EICAR" };
  return { clean: true };
}

export type ProcessedUpload = { key: string; sha256: string; sizeBytes: number };

/** Validate size and type, run the malware hook, then store privately. */
export async function processUpload(input: { bytes: Uint8Array; mimeType: string; fileName: string; prefix?: string }): Promise<ProcessedUpload> {
  if (input.bytes.length === 0) throw new UploadError("Empty file.");
  if (input.bytes.length > MAX_UPLOAD_BYTES) throw new UploadError("File exceeds the 10 MB limit.");
  if (!(ALLOWED_MIME_TYPES as readonly string[]).includes(input.mimeType)) throw new UploadError("File type not allowed.");
  const scan = scanForMalware(input.bytes);
  if (!scan.clean) throw new UploadError("Malware scan hook rejected the file.");
  const key = `${input.prefix ?? "uploads"}/${randomBytes(16).toString("hex")}`;
  await getStorage().put(key, input.bytes, input.mimeType);
  return { key, sha256: sha256Hex(input.bytes), sizeBytes: input.bytes.length };
}