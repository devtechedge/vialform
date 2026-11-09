import { desc, eq, inArray } from "drizzle-orm";
import { getDb } from "@/db/client";
import * as schema from "@/db/schema";
import { getBasket } from "./procurement";

export async function getWorkspaceData(organizationId: string, userId: string) {
  const db = await getDb();
  const basket = await getBasket(userId, organizationId);
  const saved = await db
    .select({ saved: schema.savedDossiers, product: schema.products })
    .from(schema.savedDossiers)
    .innerJoin(schema.products, eq(schema.savedDossiers.productId, schema.products.id))
    .where(eq(schema.savedDossiers.userId, userId));
  const comparisons = await db.select().from(schema.comparisons).where(eq(schema.comparisons.userId, userId));
  const rfqs = await db.select().from(schema.quoteRequests).where(eq(schema.quoteRequests.organizationId, organizationId)).orderBy(desc(schema.quoteRequests.createdAt));
  const rfqIds = rfqs.map((rfq) => rfq.id);
  const quotes = rfqIds.length > 0 ? await db.select().from(schema.quoteRevisions).where(inArray(schema.quoteRevisions.quoteRequestId, rfqIds)) : [];
  const pos = await db.select().from(schema.purchaseOrders).where(eq(schema.purchaseOrders.organizationId, organizationId));
  const orders = await db.select().from(schema.orders).where(eq(schema.orders.organizationId, organizationId));
  const orderIds = orders.map((order) => order.id);
  const shipments = orderIds.length > 0 ? await db.select().from(schema.shipmentEvents).where(inArray(schema.shipmentEvents.orderId, orderIds)).orderBy(desc(schema.shipmentEvents.occurredAt)) : [];
  const notifications = await db.select().from(schema.notifications).where(eq(schema.notifications.userId, userId)).orderBy(desc(schema.notifications.createdAt)).limit(20);
  const team = await db
    .select({ membership: schema.memberships, user: { id: schema.users.id, fullName: schema.users.fullName, email: schema.users.email } })
    .from(schema.memberships)
    .innerJoin(schema.users, eq(schema.memberships.userId, schema.users.id))
    .where(eq(schema.memberships.organizationId, organizationId));
  return { basket, saved, comparisons, rfqs, quotes, pos, orders, shipments, notifications, team };
}