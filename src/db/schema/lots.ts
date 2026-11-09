import { integer, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import type { DocumentKind, DocumentOrigin, LotStatus } from "@/domain/enums";
import { createdAt, isDemo, revision, updatedAt } from "./columns";
import { products } from "./catalogue";
import { suppliers } from "./compliance";
import { users } from "./identity";

export type CustodyEntry = { at: string; event: string; actor: string };

export const lots = pgTable("lots", {
  id: uuid("id").defaultRandom().primaryKey(),
  lotNumber: text("lot_number").notNull().unique(),
  productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  supplierId: uuid("supplier_id").notNull().references(() => suppliers.id),
  status: text("status").$type<LotStatus>().notNull().default("QUARANTINE"),
  manufactureDate: timestamp("manufacture_date", { withTimezone: true }),
  expiryDate: timestamp("expiry_date", { withTimezone: true }),
  unit: text("unit").notNull().default("mg"),
  quantityMinor: integer("quantity_minor").notNull().default(0),
  reservedMinor: integer("reserved_minor").notNull().default(0),
  custody: jsonb("custody").$type<CustodyEntry[]>().notNull().default([]),
  storageConditions: text("storage_conditions"),
  primaryCoaId: uuid("primary_coa_id"),
  revision: revision(),
  isDemo: isDemo(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const lotDocuments = pgTable("lot_documents", {
  id: uuid("id").defaultRandom().primaryKey(),
  lotId: uuid("lot_id").notNull().references(() => lots.id, { onDelete: "cascade" }),
  kind: text("kind").$type<DocumentKind>().notNull(),
  origin: text("origin").$type<DocumentOrigin>().notNull().default("SUPPLIER_ISSUED"),
  storageKey: text("storage_key").notNull(),
  sha256: text("sha256").notNull(),
  fileName: text("file_name").notNull(),
  mimeType: text("mime_type").notNull(),
  sizeBytes: integer("size_bytes").notNull(),
  version: integer("version").notNull().default(1),
  method: text("method"),
  assayDate: timestamp("assay_date", { withTimezone: true }),
  units: text("units"),
  reviewerId: uuid("reviewer_id").references(() => users.id),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  isDemo: isDemo(),
  createdAt: createdAt(),
});

export const lotReviews = pgTable("lot_reviews", {
  id: uuid("id").defaultRandom().primaryKey(),
  lotId: uuid("lot_id").notNull().references(() => lots.id, { onDelete: "cascade" }),
  reviewerId: uuid("reviewer_id").notNull().references(() => users.id),
  decision: text("decision").$type<"RELEASED" | "REJECTED" | "QUARANTINE">().notNull(),
  notes: text("notes").notNull(),
  createdAt: createdAt(),
});