import { bigint, integer, jsonb, pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";
import type { OrderStatus, PoStatus, QuoteRequestStatus, QuoteRevisionStatus, ShipmentMilestone } from "@/domain/enums";
import { createdAt, isDemo, revision, updatedAt } from "./columns";
import { products } from "./catalogue";
import { lots } from "./lots";
import { organizations, users } from "./identity";

export type QuoteLineSnapshot = {
  productId: string;
  sku: string;
  name: string;
  quantityMinor: number;
  unit: string;
  unitPriceMinor: number;
  lineTotalMinor: number;
};

export const quoteRequests = pgTable("quote_requests", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  createdBy: uuid("created_by").notNull().references(() => users.id),
  status: text("status").$type<QuoteRequestStatus>().notNull().default("DRAFT"),
  destinationCountry: text("destination_country").notNull(),
  currency: text("currency").notNull().default("USD"),
  buyerNotes: text("buyer_notes"),
  internalNotes: text("internal_notes"),
  eligibilitySnapshot: jsonb("eligibility_snapshot").$type<Record<string, unknown>>(),
  submittedAt: timestamp("submitted_at", { withTimezone: true }),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  revision: revision(),
  isDemo: isDemo(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const quoteRequestLines = pgTable("quote_request_lines", {
  id: uuid("id").defaultRandom().primaryKey(),
  quoteRequestId: uuid("quote_request_id").notNull().references(() => quoteRequests.id, { onDelete: "cascade" }),
  productId: uuid("product_id").notNull().references(() => products.id),
  lotId: uuid("lot_id").references(() => lots.id),
  quantityMinor: integer("quantity_minor").notNull(),
  unit: text("unit").notNull(),
  targetPriceMinor: bigint("target_price_minor", { mode: "number" }),
  currency: text("currency").notNull(),
  identitySnapshot: jsonb("identity_snapshot").$type<Record<string, unknown>>().notNull(),
  createdAt: createdAt(),
});

/** Immutable priced quote. Each revision snapshots lines; never mutated in place. */
export const quoteRevisions = pgTable(
  "quote_revisions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    quoteRequestId: uuid("quote_request_id").notNull().references(() => quoteRequests.id, { onDelete: "cascade" }),
    revisionNumber: integer("revision_number").notNull(),
    status: text("status").$type<QuoteRevisionStatus>().notNull().default("DRAFT"),
    currency: text("currency").notNull(),
    subtotalMinor: bigint("subtotal_minor", { mode: "number" }).notNull(),
    totalMinor: bigint("total_minor", { mode: "number" }).notNull(),
    validUntil: timestamp("valid_until", { withTimezone: true }),
    preparedBy: uuid("prepared_by").notNull().references(() => users.id),
    notes: text("notes"),
    linesSnapshot: jsonb("lines_snapshot").$type<QuoteLineSnapshot[]>().notNull(),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    isDemo: isDemo(),
    createdAt: createdAt(),
  },
  (table) => [unique("quote_revisions_request_number_unique").on(table.quoteRequestId, table.revisionNumber)],
);

export const purchaseOrders = pgTable("purchase_orders", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  quoteRevisionId: uuid("quote_revision_id").notNull().references(() => quoteRevisions.id),
  uploadedBy: uuid("uploaded_by").notNull().references(() => users.id),
  poNumber: text("po_number").notNull(),
  documentKey: text("document_key"),
  documentSha256: text("document_sha256"),
  status: text("status").$type<PoStatus>().notNull().default("UPLOADED"),
  totalMinor: bigint("total_minor", { mode: "number" }).notNull(),
  currency: text("currency").notNull(),
  reviewerId: uuid("reviewer_id").references(() => users.id),
  reviewNotes: text("review_notes"),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  revision: revision(),
  isDemo: isDemo(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const orders = pgTable("orders", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  purchaseOrderId: uuid("purchase_order_id").notNull().references(() => purchaseOrders.id),
  quoteRevisionId: uuid("quote_revision_id").notNull().references(() => quoteRevisions.id),
  orderNumber: text("order_number").notNull().unique(),
  status: text("status").$type<OrderStatus>().notNull().default("CONFIRMED"),
  currency: text("currency").notNull(),
  totalMinor: bigint("total_minor", { mode: "number" }).notNull(),
  destinationCountry: text("destination_country").notNull(),
  snapshot: jsonb("snapshot").$type<Record<string, unknown>>().notNull(),
  confirmedBy: uuid("confirmed_by").references(() => users.id),
  confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
  revision: revision(),
  isDemo: isDemo(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const orderLines = pgTable("order_lines", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderId: uuid("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  productId: uuid("product_id").notNull().references(() => products.id),
  lotId: uuid("lot_id").references(() => lots.id),
  name: text("name").notNull(),
  sku: text("sku").notNull(),
  quantityMinor: integer("quantity_minor").notNull(),
  unit: text("unit").notNull(),
  unitPriceMinor: bigint("unit_price_minor", { mode: "number" }).notNull(),
  lineTotalMinor: bigint("line_total_minor", { mode: "number" }).notNull(),
  currency: text("currency").notNull(),
});

export const shipmentEvents = pgTable("shipment_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderId: uuid("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  milestone: text("milestone").$type<ShipmentMilestone>().notNull(),
  description: text("description").notNull(),
  location: text("location"),
  carrier: text("carrier"),
  trackingRef: text("tracking_ref"),
  occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
  recordedBy: uuid("recorded_by").references(() => users.id),
  isDemo: isDemo(),
  createdAt: createdAt(),
});