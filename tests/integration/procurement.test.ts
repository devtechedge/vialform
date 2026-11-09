import { beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { getDb, type Database } from "@/db/client";
import * as schema from "@/db/schema";
import { checkEligibility } from "@/server/compliance";
import { confirmOrder, issueQuote, listRfqs, ProcurementError, submitRfq, uploadPo } from "@/server/procurement";

let db: Database;
let helixId: string;
let meridianId: string;
let buyerId: string;
let adminId: string;
let ghk: typeof schema.products.$inferSelect;
let bpc: typeof schema.products.$inferSelect;

function first<T>(rows: T[]): T {
  const row = rows[0];
  if (!row) throw new Error("Expected a seeded row");
  return row;
}

beforeAll(async () => {
  db = await getDb();
  helixId = first(await db.select().from(schema.organizations).where(eq(schema.organizations.slug, "helix-demo"))).id;
  meridianId = first(await db.select().from(schema.organizations).where(eq(schema.organizations.slug, "meridian-demo"))).id;
  buyerId = first(await db.select().from(schema.users).where(eq(schema.users.email, "buyer@helix.demo"))).id;
  adminId = first(await db.select().from(schema.users).where(eq(schema.users.email, "admin@vialform.demo"))).id;
  ghk = first(await db.select().from(schema.products).where(eq(schema.products.name, "GHK-Cu")));
  bpc = first(await db.select().from(schema.products).where(eq(schema.products.name, "BPC-157")));
});

describe("jurisdiction gate", () => {
  it("marks an ACTIVE approval eligible and a REJECTED one ineligible", async () => {
    expect((await checkEligibility(ghk.id, "US")).eligible).toBe(true);
    const rejected = await checkEligibility(bpc.id, "US");
    expect(rejected.eligible).toBe(false);
    expect(rejected.status).toBe("REJECTED");
  });

  it("blocks an RFQ for a non-active product (jurisdiction bypass)", async () => {
    await expect(submitRfq({ organizationId: helixId, userId: buyerId, country: "US", lines: [{ productId: bpc.id, quantityMinor: 1000, unit: "mg" }] }))
      .rejects.toThrow(ProcurementError);
  });

  it("blocks an RFQ for an unverified institution", async () => {
    await expect(submitRfq({ organizationId: meridianId, userId: buyerId, country: "IN", lines: [{ productId: ghk.id, quantityMinor: 1000, unit: "mg" }] }))
      .rejects.toThrow(/verification/i);
  });

  it("blocks a consumer destination even when verified", async () => {
    const [consumer] = await db.insert(schema.organizations).values({ name: "Consumer Test", slug: `consumer-${Date.now()}`, type: "OTHER", country: "US", deliveryCountry: "US", verificationStatus: "VERIFIED", isConsumerDestination: true }).returning();
    await expect(submitRfq({ organizationId: consumer!.id, userId: buyerId, country: "US", lines: [{ productId: ghk.id, quantityMinor: 1000, unit: "mg" }] }))
      .rejects.toThrow(/consumer/i);
  });
});

describe("RFQ to order flow", () => {
  it("accepts an eligible RFQ, prices it server-side, and isolates tenants", async () => {
    const { id } = await submitRfq({ organizationId: helixId, userId: buyerId, country: "US", lines: [{ productId: ghk.id, quantityMinor: 1000, unit: "mg" }] });
    const helixRfqs = await listRfqs(helixId);
    expect(helixRfqs.some((rfq) => rfq.id === id)).toBe(true);
    const meridianRfqs = await listRfqs(meridianId);
    expect(meridianRfqs.some((rfq) => rfq.id === id)).toBe(false);

    const quote = await issueQuote({ staffId: adminId, staffRole: "COMPLIANCE_ADMIN", rfqId: id, lines: [{ productId: ghk.id, sku: ghk.sku, name: ghk.name, quantityMinor: 1000, unit: "mg", unitPriceMinor: 500 }] });
    const [revision] = await db.select().from(schema.quoteRevisions).where(eq(schema.quoteRevisions.id, quote.id));
    expect(revision!.totalMinor).toBe(500_000);

    await expect(uploadPo({ userId: buyerId, organizationId: meridianId, revisionId: quote.id, poNumber: "PO-IDOR" }))
      .rejects.toThrow(/does not belong/i);

    const po = await uploadPo({ userId: buyerId, organizationId: helixId, revisionId: quote.id, poNumber: "PO-OK" });
    expect(po.id).toBeTruthy();
  });

  it("refuses to confirm orders in demo mode", async () => {
    const { id } = await submitRfq({ organizationId: helixId, userId: buyerId, country: "US", lines: [{ productId: ghk.id, quantityMinor: 1000, unit: "mg" }] });
    const quote = await issueQuote({ staffId: adminId, staffRole: "COMPLIANCE_ADMIN", rfqId: id, lines: [{ productId: ghk.id, sku: ghk.sku, name: ghk.name, quantityMinor: 1000, unit: "mg", unitPriceMinor: 500 }] });
    const po = await uploadPo({ userId: buyerId, organizationId: helixId, revisionId: quote.id, poNumber: "PO-DEMO" });
    await db.update(schema.purchaseOrders).set({ status: "APPROVED" }).where(eq(schema.purchaseOrders.id, po.id));
    await expect(confirmOrder({ staffId: adminId, staffRole: "COMPLIANCE_ADMIN", poId: po.id })).rejects.toThrow(/demo mode/i);
  });
});