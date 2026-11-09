import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import * as schema from "@/db/schema";
import { getSystemFlags } from "./system";

export async function getAdminData() {
  const db = await getDb();
  const flags = await getSystemFlags();
  const approvals = await db
    .select({ approval: schema.jurisdictionApprovals, product: schema.products })
    .from(schema.jurisdictionApprovals)
    .innerJoin(schema.products, eq(schema.jurisdictionApprovals.productId, schema.products.id));
  const verifications = await db
    .select({ request: schema.verificationRequests, organization: schema.organizations })
    .from(schema.verificationRequests)
    .innerJoin(schema.organizations, eq(schema.verificationRequests.organizationId, schema.organizations.id));
  const rfqs = await db
    .select({ rfq: schema.quoteRequests, organization: schema.organizations })
    .from(schema.quoteRequests)
    .innerJoin(schema.organizations, eq(schema.quoteRequests.organizationId, schema.organizations.id))
    .orderBy(desc(schema.quoteRequests.createdAt));
  const pos = await db.select().from(schema.purchaseOrders).orderBy(desc(schema.purchaseOrders.createdAt));
  const orders = await db.select().from(schema.orders).orderBy(desc(schema.orders.createdAt));
  const candidates = await db.select().from(schema.candidates);
  const signals = await db.select().from(schema.marketSignals);
  const suppliers = await db.select().from(schema.suppliers);
  const lots = await db
    .select({ lot: schema.lots, product: schema.products })
    .from(schema.lots)
    .innerJoin(schema.products, eq(schema.lots.productId, schema.products.id));
  const audit = await db.select().from(schema.auditEvents).orderBy(desc(schema.auditEvents.createdAt)).limit(50);
  return { flags, approvals, verifications, rfqs, pos, orders, candidates, signals, suppliers, lots, audit };
}