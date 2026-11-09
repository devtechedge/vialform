import { describe, expect, it } from "vitest";
import { MAX_UPLOAD_BYTES, processUpload, scanForMalware, UploadError } from "./uploads";

describe("upload hardening", () => {
  it("detects the EICAR test signature", () => {
    const bytes = new TextEncoder().encode("X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*");
    expect(scanForMalware(bytes).clean).toBe(false);
  });

  it("accepts a small allowed file and returns integrity metadata", async () => {
    const bytes = new TextEncoder().encode("demo document");
    const result = await processUpload({ bytes, mimeType: "text/plain", fileName: "doc.txt" });
    expect(result.sizeBytes).toBe(bytes.length);
    expect(result.sha256).toMatch(/^[0-9a-f]{64}$/);
    expect(result.key).toMatch(/^uploads\//);
  });

  it("rejects oversized files", async () => {
    const bytes = new Uint8Array(MAX_UPLOAD_BYTES + 1);
    await expect(processUpload({ bytes, mimeType: "text/plain", fileName: "big.txt" })).rejects.toThrow(UploadError);
  });

  it("rejects disallowed mime types", async () => {
    const bytes = new TextEncoder().encode("x");
    await expect(processUpload({ bytes, mimeType: "application/x-msdownload", fileName: "x.exe" })).rejects.toThrow(/type not allowed/i);
  });

  it("rejects empty files", async () => {
    await expect(processUpload({ bytes: new Uint8Array(0), mimeType: "text/plain", fileName: "empty.txt" })).rejects.toThrow(/empty/i);
  });
});