import { eq, inArray } from "drizzle-orm";
import { getDb } from "@/db/client";
import * as schema from "@/db/schema";

function esc(value: unknown): string {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

/** Tenant-scoped CSV of an institution's RFQs, quotes, POs and orders. */
export async function buildWorkspaceCsv(organizationId: string): Promise<string> {
  const db = await getDb();
  const rfqs = await db.select().from(schema.quoteRequests).where(eq(schema.quoteRequests.organizationId, organizationId));
  const rfqIds = rfqs.map((rfq) => rfq.id);
  const quotes = rfqIds.length > 0 ? await db.select().from(schema.quoteRevisions).where(inArray(schema.quoteRevisions.quoteRequestId, rfqIds)) : [];
  const pos = await db.select().from(schema.purchaseOrders).where(eq(schema.purchaseOrders.organizationId, organizationId));
  const orders = await db.select().from(schema.orders).where(eq(schema.orders.organizationId, organizationId));

  const lines = [["record_type", "id", "reference", "status", "detail", "total_minor", "currency", "created_at"].map(esc).join(",")];
  for (const rfq of rfqs) lines.push(["rfq", rfq.id, "", rfq.status, rfq.destinationCountry, "", rfq.currency, rfq.createdAt.toISOString()].map(esc).join(","));
  for (const quote of quotes) lines.push(["quote", quote.id, quote.quoteRequestId, quote.status, `rev ${quote.revisionNumber}`, quote.totalMinor, quote.currency, quote.createdAt.toISOString()].map(esc).join(","));
  for (const po of pos) lines.push(["po", po.id, po.poNumber, po.status, "", po.totalMinor, po.currency, po.createdAt.toISOString()].map(esc).join(","));
  for (const order of orders) lines.push(["order", order.id, order.orderNumber, order.status, order.destinationCountry, order.totalMinor, order.currency, order.createdAt.toISOString()].map(esc).join(","));
  return lines.join("\n");
}