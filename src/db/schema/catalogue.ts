import { boolean, integer, jsonb, pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";
import type {
  CandidateClass,
  CandidateStatus,
  ConfidenceLevel,
  MarketMetric,
  MoleculeType,
  ProductStatus,
} from "@/domain/enums";
import { createdAt, isDemo, revision, updatedAt } from "./columns";

/** Private watchlist item. Defaults to NOT_APPROVED and never purchasable. */
export const candidates = pgTable("candidates", {
  id: uuid("id").defaultRandom().primaryKey(),
  canonicalName: text("canonical_name").notNull(),
  aliases: jsonb("aliases").$type<string[]>().notNull().default([]),
  moleculeType: text("molecule_type").$type<MoleculeType>().notNull(),
  lengthAa: integer("length_aa"),
  construct: text("construct").$type<"FRAGMENT" | "FULL_LENGTH" | "MODIFIED">(),
  classification: text("classification").$type<CandidateClass>().notNull(),
  status: text("status").$type<CandidateStatus>().notNull().default("NOT_APPROVED"),
  sequence: text("sequence"),
  sequenceSource: text("sequence_source"),
  casNumber: text("cas_number"),
  regulatoryCaution: text("regulatory_caution"),
  excludedFromRuo: boolean("excluded_from_ruo").notNull().default(false),
  notes: text("notes"),
  isDemo: isDemo(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const products = pgTable("products", {
  id: uuid("id").defaultRandom().primaryKey(),
  sku: text("sku").notNull().unique(),
  candidateId: uuid("candidate_id").references(() => candidates.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  family: text("family").notNull(),
  moleculeType: text("molecule_type").$type<MoleculeType>().notNull(),
  lengthAa: integer("length_aa"),
  sequence: text("sequence"),
  sequenceSource: text("sequence_source"),
  formula: text("formula"),
  molecularWeight: text("molecular_weight"),
  modifications: text("modifications"),
  identifiers: jsonb("identifiers").$type<string[]>().notNull().default([]),
  grade: text("grade"),
  spec: text("spec"),
  status: text("status").$type<ProductStatus>().notNull().default("DRAFT"),
  evidenceNotes: text("evidence_notes"),
  revision: revision(),
  isDemo: isDemo(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const productAliases = pgTable(
  "product_aliases",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
    alias: text("alias").notNull(),
    kind: text("kind").$type<"SYNONYM" | "CODE" | "SEQUENCE">().notNull().default("SYNONYM"),
  },
  (table) => [unique("product_aliases_product_alias_unique").on(table.productId, table.alias)],
);

/** Dated public demand evidence. Visibility/coverage, never audited sales. */
export const marketSignals = pgTable("market_signals", {
  id: uuid("id").defaultRandom().primaryKey(),
  candidateId: uuid("candidate_id").notNull().references(() => candidates.id, { onDelete: "cascade" }),
  metric: text("metric").$type<MarketMetric>().notNull(),
  sourceUrl: text("source_url").notNull(),
  publisher: text("publisher").notNull(),
  observedAt: timestamp("observed_at", { withTimezone: true }).notNull(),
  geography: text("geography"),
  observation: text("observation").notNull(),
  valueText: text("value_text"),
  confidence: text("confidence").$type<ConfidenceLevel>().notNull(),
  limitations: text("limitations").notNull(),
  isDemo: isDemo(),
  createdAt: createdAt(),
});

export const regulatorySources = pgTable("regulatory_sources", {
  id: uuid("id").defaultRandom().primaryKey(),
  jurisdiction: text("jurisdiction").notNull(),
  title: text("title").notNull(),
  publisher: text("publisher").notNull(),
  sourceUrl: text("source_url").notNull(),
  scope: text("scope").notNull(),
  accessedAt: timestamp("accessed_at", { withTimezone: true }).notNull(),
  confidence: text("confidence").$type<ConfidenceLevel>().notNull(),
  uncertainty: text("uncertainty").notNull(),
  isDemo: isDemo(),
  createdAt: createdAt(),
});