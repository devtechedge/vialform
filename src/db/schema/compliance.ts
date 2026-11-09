import { integer, jsonb, pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";
import type { ApprovalStatus, DocumentKind, DocumentOrigin } from "@/domain/enums";
import { createdAt, isDemo, revision, updatedAt } from "./columns";
import { products } from "./catalogue";
import { users } from "./identity";

/**
 * Product-country eligibility. This is the enforced compliance lifecycle:
 * DISCOVERY -> LEGAL_REVIEW -> DOCUMENT_REVIEW -> JURISDICTION_APPROVED -> ACTIVE,
 * plus REJECTED/SUSPENDED/EXPIRED. Only ACTIVE permits an RFQ. Every field a
 * compliance admin must record (purpose, legal basis, licences, evidence,
 * reviewer, review/expiry dates) lives here.
 */
export const jurisdictionApprovals = pgTable(
  "jurisdiction_approvals",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
    country: text("country").notNull(),
    status: text("status").$type<ApprovalStatus>().notNull().default("DISCOVERY"),
    lawfulPurpose: text("lawful_purpose"),
    legalBasis: text("legal_basis"),
    licenses: jsonb("licenses").$type<string[]>().notNull().default([]),
    supplierEvidenceKeys: jsonb("supplier_evidence_keys").$type<string[]>().notNull().default([]),
    regulatorySourceIds: jsonb("regulatory_source_ids").$type<string[]>().notNull().default([]),
    reviewerId: uuid("reviewer_id").references(() => users.id),
    reviewNotes: text("review_notes"),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    revision: revision(),
    isDemo: isDemo(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [unique("jurisdiction_approvals_product_country_unique").on(table.productId, table.country)],
);

export const suppliers = pgTable("suppliers", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  country: text("country").notNull(),
  licenseNumber: text("license_number"),
  qualificationStatus: text("qualification_status").$type<"QUALIFIED" | "PENDING" | "SUSPENDED">().notNull().default("PENDING"),
  evidenceKeys: jsonb("evidence_keys").$type<string[]>().notNull().default([]),
  contactEmail: text("contact_email"),
  isDemo: isDemo(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const supplierDocuments = pgTable("supplier_documents", {
  id: uuid("id").defaultRandom().primaryKey(),
  supplierId: uuid("supplier_id").notNull().references(() => suppliers.id, { onDelete: "cascade" }),
  kind: text("kind").$type<DocumentKind>().notNull(),
  origin: text("origin").$type<DocumentOrigin>().notNull().default("SUPPLIER_ISSUED"),
  storageKey: text("storage_key").notNull(),
  sha256: text("sha256").notNull(),
  fileName: text("file_name").notNull(),
  mimeType: text("mime_type").notNull(),
  sizeBytes: integer("size_bytes").notNull(),
  version: integer("version").notNull().default(1),
  reviewerId: uuid("reviewer_id").references(() => users.id),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  isDemo: isDemo(),
  createdAt: createdAt(),
});