import { and, eq, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import type { Transaction } from "@/db/client";
import { withTransaction } from "@/db/transaction";
import * as schema from "@/db/schema";
import { isDemoMode } from "@/env";
import { sumMinor } from "@/domain/money";
import type { ShipmentMilestone } from "@/domain/enums";
import { recordAudit } from "./audit";
import { checkEligibility } from "./compliance";
import { getSystemFlags } from "./system";
import type { QuoteLineSnapshot } from "@/db/schema/procurement";

export class ProcurementError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProcurementError";
  }
}

export type BasketLine = { productId: string; quantityMinor: number; unit: string; lotId?: string | null };

export async function getBasket(userId: string, organizationId: string) {
  const db = await getDb();
  return db
    .select({ item: schema.savedListItems, product: schema.products })
    .from(schema.savedListItems)
    .innerJoin(schema.products, eq(schema.savedListItems.productId, schema.products.id))
    .where(and(eq(schema.savedListItems.userId, userId), eq(schema.savedListItems.organizationId, organizationId)));
}

export async function addBasketItem(userId: string, organizationId: string, line: BasketLine): Promise<void> {
  const db = await getDb();
  const [existing] = await db
    .select()
    .from(schema.savedListItems)
    .where(and(eq(schema.savedListItems.userId, userId), eq(schema.savedListItems.productId, line.productId)));
  if (existing) {
    await db.update(schema.savedListItems).set({ quantityMinor: line.quantityMinor, unit: line.unit, lotId: line.lotId ?? null }).where(eq(schema.savedListItems.id, existing.id));
  } else {
    await db.insert(schema.savedListItems).values({ organizationId, userId, productId: line.productId, lotId: line.lotId ?? null, quantityMinor: line.quantityMinor, unit: line.unit });
  }
}

export async function removeBasketItem(userId: string, itemId: string): Promise<void> {
  const db = await getDb();
  await db.delete(schema.savedListItems).where(and(eq(schema.savedListItems.id, itemId), eq(schema.savedListItems.userId, userId)));
}

/**
 * Submit an RFQ. The server re-checks institution verification, consumer
 * destination, global flags and per-product jurisdiction eligibility. The
 * client never decides eligibility.
 */
export async function submitRfq(input: { organizationId: string; userId: string; country: string; notes?: string; lines: BasketLine[] }): Promise<{ id: string }> {
  if (input.lines.length === 0) throw new ProcurementError("An RFQ needs at least one line.");
  const db = await getDb();
  const [org] = await db.select().from(schema.organizations).where(eq(schema.organizations.id, input.organizationId));
  if (!org) throw new ProcurementError("Organization not found.");
  if (org.verificationStatus !== "VERIFIED") throw new ProcurementError("Institution verification is required before procurement.");
  if (org.isConsumerDestination) throw new ProcurementError("Consumer destinations are not eligible for procurement.");
  const flags = await getSystemFlags();
  if (flags.killSwitch) throw new ProcurementError("The global kill switch is engaged.");
  if (flags.salesPaused) throw new ProcurementError("A global sales pause is active.");

  const snapshot: Record<string, unknown> = {};
  for (const line of input.lines) {
    const eligibility = await checkEligibility(line.productId, input.country);
    snapshot[line.productId] = eligibility;
    if (!eligibility.eligible) throw new ProcurementError(`A material is not eligible in ${input.country}: ${eligibility.reasons.join(" ")}`);
    if (line.quantityMinor <= 0) throw new ProcurementError("Quantities must be positive.");
  }

  const rfq = await withTransaction(async (tx) => {
    const [created] = await tx.insert(schema.quoteRequests).values({
      organizationId: input.organizationId,
      createdBy: input.userId,
      status: "SUBMITTED",
      destinationCountry: input.country,
      currency: "USD",
      buyerNotes: input.notes ?? null,
      eligibilitySnapshot: snapshot,
      submittedAt: new Date(),
      isDemo: org.isDemo,
    }).returning();
    if (!created) throw new ProcurementError("Failed to create RFQ.");
    for (const line of input.lines) {
      const [product] = await tx.select().from(schema.products).where(eq(schema.products.id, line.productId));
      await tx.insert(schema.quoteRequestLines).values({
        quoteRequestId: created.id,
        productId: line.productId,
        lotId: line.lotId ?? null,
        quantityMinor: line.quantityMinor,
        unit: line.unit,
        currency: "USD",
        identitySnapshot: { name: product?.name, sku: product?.sku, moleculeType: product?.moleculeType },
      });
    }
    await recordAudit(tx, { organizationId: input.organizationId, actorId: input.userId, action: "SUBMIT_RFQ", entityType: "quote_request", entityId: created.id, summary: `RFQ submitted with ${input.lines.length} line(s).`, metadata: { country: input.country } });
    return created;
  });
  return { id: rfq.id };
}

export async function listRfqs(organizationId: string) {
  const db = await getDb();
  return db.select().from(schema.quoteRequests).where(eq(schema.quoteRequests.organizationId, organizationId));
}

/** Staff issue an immutable priced quote. Totals are recomputed server-side. */
export async function issueQuote(input: { staffId: string; staffRole: string; rfqId: string; notes?: string; lines: Array<{ productId: string; sku: string; name: string; quantityMinor: number; unit: string; unitPriceMinor: number }> }): Promise<{ id: string }> {
  const db = await getDb();
  const [rfq] = await db.select().from(schema.quoteRequests).where(eq(schema.quoteRequests.id, input.rfqId));
  if (!rfq) throw new ProcurementError("RFQ not found.");
  const snapshot: QuoteLineSnapshot[] = input.lines.map((line) => ({
    productId: line.productId,
    sku: line.sku,
    name: line.name,
    quantityMinor: line.quantityMinor,
    unit: line.unit,
    unitPriceMinor: line.unitPriceMinor,
    lineTotalMinor: line.quantityMinor * line.unitPriceMinor,
  }));
  const subtotal = sumMinor(snapshot.map((line) => line.lineTotalMinor));

  const revision = await withTransaction(async (tx) => {
    const prior = await tx.select().from(schema.quoteRevisions).where(eq(schema.quoteRevisions.quoteRequestId, input.rfqId));
    await tx.update(schema.quoteRevisions).set({ status: "SUPERSEDED" }).where(and(eq(schema.quoteRevisions.quoteRequestId, input.rfqId), eq(schema.quoteRevisions.status, "SENT")));
    const [created] = await tx.insert(schema.quoteRevisions).values({
      quoteRequestId: input.rfqId,
      revisionNumber: prior.length + 1,
      status: "SENT",
      currency: rfq.currency,
      subtotalMinor: subtotal,
      totalMinor: subtotal,
      validUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      preparedBy: input.staffId,
      notes: input.notes ?? null,
      linesSnapshot: snapshot,
      sentAt: new Date(),
      isDemo: rfq.isDemo,
    }).returning();
    if (!created) throw new ProcurementError("Failed to create quote.");
    await tx.update(schema.quoteRequests).set({ status: "QUOTED", revision: rfq.revision + 1 }).where(eq(schema.quoteRequests.id, input.rfqId));
    await recordAudit(tx, { organizationId: rfq.organizationId, actorId: input.staffId, actorRole: input.staffRole, action: "ISSUE_QUOTE", entityType: "quote_revision", entityId: created.id, summary: `Quote revision ${created.revisionNumber} issued.`, metadata: { totalMinor: subtotal } });
    return created;
  });
  return { id: revision.id };
}

export async function uploadPo(input: { userId: string; organizationId: string; revisionId: string; poNumber: string; documentKey?: string; documentSha256?: string }): Promise<{ id: string }> {
  const db = await getDb();
  const [revision] = await db.select().from(schema.quoteRevisions).where(eq(schema.quoteRevisions.id, input.revisionId));
  if (!revision) throw new ProcurementError("Quote revision not found.");
  const [rfq] = await db.select().from(schema.quoteRequests).where(eq(schema.quoteRequests.id, revision.quoteRequestId));
  if (!rfq || rfq.organizationId !== input.organizationId) throw new ProcurementError("Quote does not belong to your institution.");
  const [po] = await db.insert(schema.purchaseOrders).values({
    organizationId: input.organizationId,
    quoteRevisionId: input.revisionId,
    uploadedBy: input.userId,
    poNumber: input.poNumber,
    documentKey: input.documentKey ?? null,
    documentSha256: input.documentSha256 ?? null,
    status: "UPLOADED",
    totalMinor: revision.totalMinor,
    currency: revision.currency,
    isDemo: rfq.isDemo,
  }).returning();
  if (!po) throw new ProcurementError("Failed to create PO.");
  await recordAudit(db, { organizationId: input.organizationId, actorId: input.userId, action: "UPLOAD_PO", entityType: "purchase_order", entityId: po.id, summary: `PO ${input.poNumber} uploaded.` });
  return { id: po.id };
}

export async function approvePo(input: { staffId: string; staffRole: string; poId: string; approve: boolean; notes?: string }): Promise<void> {
  const db = await getDb();
  const [po] = await db.select().from(schema.purchaseOrders).where(eq(schema.purchaseOrders.id, input.poId));
  if (!po) throw new ProcurementError("PO not found.");
  await db.update(schema.purchaseOrders).set({ status: input.approve ? "APPROVED" : "REJECTED", reviewerId: input.staffId, reviewNotes: input.notes ?? null, reviewedAt: new Date(), revision: po.revision + 1 }).where(eq(schema.purchaseOrders.id, input.poId));
  await recordAudit(db, { organizationId: po.organizationId, actorId: input.staffId, actorRole: input.staffRole, action: input.approve ? "APPROVE_PO" : "REJECT_PO", entityType: "purchase_order", entityId: po.id, summary: `PO ${input.approve ? "approved" : "rejected"}.` });
}

/**
 * Confirm an order from an approved PO. Blocked in demo mode and until the
 * fulfilment gate is enabled (written legal/provider approval). Reserves lots
 * atomically and re-checks eligibility at confirmation time.
 */
export async function confirmOrder(input: { staffId: string; staffRole: string; poId: string }): Promise<{ id: string }> {
  if (isDemoMode()) throw new ProcurementError("Demo mode cannot create orders or invoices.");
  const flags = await getSystemFlags();
  if (!flags.fulfilmentEnabled) throw new ProcurementError("Fulfilment is disabled pending written legal and provider approval.");
  const db = await getDb();
  const [po] = await db.select().from(schema.purchaseOrders).where(eq(schema.purchaseOrders.id, input.poId));
  if (!po || po.status !== "APPROVED") throw new ProcurementError("PO must be approved before confirmation.");
  const [revision] = await db.select().from(schema.quoteRevisions).where(eq(schema.quoteRevisions.id, po.quoteRevisionId));
  if (!revision) throw new ProcurementError("Quote revision not found.");
  const [rfq] = await db.select().from(schema.quoteRequests).where(eq(schema.quoteRequests.id, revision.quoteRequestId));
  if (!rfq) throw new ProcurementError("RFQ not found.");

  for (const line of revision.linesSnapshot) {
    const eligibility = await checkEligibility(line.productId, rfq.destinationCountry);
    if (!eligibility.eligible) throw new ProcurementError(`Eligibility lapsed for ${line.sku}: ${eligibility.reasons.join(" ")}`);
  }

  const order = await withTransaction(async (tx) => {
    const [created] = await tx.insert(schema.orders).values({
      organizationId: po.organizationId,
      purchaseOrderId: po.id,
      quoteRevisionId: revision.id,
      orderNumber: `VF-ORD-${Date.now().toString(36).toUpperCase()}`,
      status: "CONFIRMED",
      currency: revision.currency,
      totalMinor: revision.totalMinor,
      destinationCountry: rfq.destinationCountry,
      snapshot: { lines: revision.linesSnapshot, poNumber: po.poNumber },
      confirmedBy: input.staffId,
      confirmedAt: new Date(),
      isDemo: false,
    }).returning();
    if (!created) throw new ProcurementError("Failed to create order.");
    const rfqLines = await tx.select().from(schema.quoteRequestLines).where(eq(schema.quoteRequestLines.quoteRequestId, rfq.id));
    for (const line of revision.linesSnapshot) {
      const rfqLine = rfqLines.find((entry) => entry.productId === line.productId);
      const lotId = rfqLine?.lotId ?? null;
      if (lotId) await reserveLot(tx, lotId, line.quantityMinor);
      await tx.insert(schema.orderLines).values({ orderId: created.id, productId: line.productId, lotId, name: line.name, sku: line.sku, quantityMinor: line.quantityMinor, unit: line.unit, unitPriceMinor: line.unitPriceMinor, lineTotalMinor: line.lineTotalMinor, currency: revision.currency });
    }
    await recordAudit(tx, { organizationId: po.organizationId, actorId: input.staffId, actorRole: input.staffRole, action: "CONFIRM_ORDER", entityType: "order", entityId: created.id, summary: `Order ${created.orderNumber} confirmed.` });
    return created;
  });
  return { id: order.id };
}

export async function addShipmentEvent(input: { staffId: string; staffRole: string; orderId: string; milestone: ShipmentMilestone; description: string; location?: string; carrier?: string; trackingRef?: string }): Promise<void> {
  const db = await getDb();
  const [order] = await db.select().from(schema.orders).where(eq(schema.orders.id, input.orderId));
  if (!order) throw new ProcurementError("Order not found.");
  await db.insert(schema.shipmentEvents).values({ orderId: input.orderId, milestone: input.milestone, description: input.description, location: input.location ?? null, carrier: input.carrier ?? null, trackingRef: input.trackingRef ?? null, occurredAt: new Date(), recordedBy: input.staffId, isDemo: order.isDemo });
  if (input.milestone === "DISPATCHED") await db.update(schema.orders).set({ status: "SHIPPED" }).where(eq(schema.orders.id, input.orderId));
  if (input.milestone === "DELIVERED") await db.update(schema.orders).set({ status: "DELIVERED" }).where(eq(schema.orders.id, input.orderId));
  await recordAudit(db, { organizationId: order.organizationId, actorId: input.staffId, actorRole: input.staffRole, action: "SHIPMENT_EVENT", entityType: "order", entityId: input.orderId, summary: `Shipment milestone ${input.milestone}.` });
}

/** Atomically reserve lot quantity; fails if insufficient remains. */
export async function reserveLot(tx: Transaction, lotId: string, quantityMinor: number): Promise<void> {
  const [updated] = await tx
    .update(schema.lots)
    .set({ reservedMinor: sql`reserved_minor + ${quantityMinor}` })
    .where(and(eq(schema.lots.id, lotId), sql`quantity_minor - reserved_minor >= ${quantityMinor}`))
    .returning();
  if (!updated) throw new ProcurementError("Insufficient lot quantity to reserve.");
}