import { describe, expect, it } from "vitest";
import { APPROVAL_TRANSITIONS, isApprovalPurchasable } from "./enums";
import { canTransition } from "@/server/compliance";

describe("approval lifecycle", () => {
  it("only ACTIVE is purchasable", () => {
    expect(isApprovalPurchasable("ACTIVE")).toBe(true);
    for (const status of ["DISCOVERY", "LEGAL_REVIEW", "DOCUMENT_REVIEW", "JURISDICTION_APPROVED", "REJECTED", "SUSPENDED", "EXPIRED"] as const) {
      expect(isApprovalPurchasable(status)).toBe(false);
    }
  });

  it("allows the forward discovery-to-active path", () => {
    expect(canTransition("DISCOVERY", "LEGAL_REVIEW")).toBe(true);
    expect(canTransition("LEGAL_REVIEW", "DOCUMENT_REVIEW")).toBe(true);
    expect(canTransition("DOCUMENT_REVIEW", "JURISDICTION_APPROVED")).toBe(true);
    expect(canTransition("JURISDICTION_APPROVED", "ACTIVE")).toBe(true);
  });

  it("blocks skipping review stages", () => {
    expect(canTransition("DISCOVERY", "ACTIVE")).toBe(false);
    expect(canTransition("LEGAL_REVIEW", "ACTIVE")).toBe(false);
    expect(canTransition("REJECTED", "ACTIVE")).toBe(false);
  });

  it("every transition target is a known status", () => {
    for (const targets of Object.values(APPROVAL_TRANSITIONS)) {
      for (const target of targets) expect(APPROVAL_TRANSITIONS[target]).toBeDefined();
    }
  });
});