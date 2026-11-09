import { describe, expect, it } from "vitest";
import { signFileToken, verifyFileToken } from "./files";

describe("signed file tokens", () => {
  it("round-trips a valid token", () => {
    const token = signFileToken("doc-123", Date.now() + 60_000);
    const verified = verifyFileToken(token);
    expect(verified?.fileId).toBe("doc-123");
  });

  it("rejects an expired token", () => {
    const token = signFileToken("doc-123", Date.now() - 1000);
    expect(verifyFileToken(token)).toBeNull();
  });

  it("rejects a tampered signature", () => {
    const token = signFileToken("doc-123", Date.now() + 60_000);
    const tampered = `${token.split(".").slice(0, 2).join(".")}.deadbeef`;
    expect(verifyFileToken(tampered)).toBeNull();
  });

  it("rejects a token bound to a different document", () => {
    const token = signFileToken("doc-123", Date.now() + 60_000);
    const verified = verifyFileToken(token);
    expect(verified?.fileId).not.toBe("doc-999");
  });

  it("rejects malformed tokens", () => {
    expect(verifyFileToken("")).toBeNull();
    expect(verifyFileToken("a.b")).toBeNull();
    expect(verifyFileToken("a.b.c.d")).toBeNull();
  });
});