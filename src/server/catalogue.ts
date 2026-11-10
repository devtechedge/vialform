import { and, eq, inArray } from "drizzle-orm";
import { getDb } from "@/db/client";
import * as schema from "@/db/schema";
import type { ApprovalStatus, MoleculeType } from "@/domain/enums";

export const JURISDICTIONS = [
  { code: "US", label: "United States" },
  { code: "IN", label: "India" },
  { code: "EU", label: "European Union" },
] as const;

export function jurisdictionLabel(code: string): string {
  return JURISDICTIONS.find((entry) => entry.code === code)?.label ?? code;
}

export type CatalogueFilters = {
  q?: string;
  family?: string;
  moleculeType?: string;
  modified?: boolean;
  length?: string;
  documents?: boolean;
  country: string;
};

export const LENGTH_BUCKETS = [
  { value: "1-10", label: "1-10 aa" },
  { value: "11-30", label: "11-30 aa" },
  { value: "31+", label: "31+ aa" },
] as const;

function inLengthBucket(lengthAa: number | null, bucket: string): boolean {
  if (lengthAa === null) return false;
  if (bucket === "1-10") return lengthAa >= 1 && lengthAa <= 10;
  if (bucket === "11-30") return lengthAa >= 11 && lengthAa <= 30;
  if (bucket === "31+") return lengthAa >= 31;
  return true;
}

export type CatalogueItem = {
  id: string;
  sku: string;
  name: string;
  family: string;
  moleculeType: MoleculeType;
  lengthAa: number | null;
  modifications: string | null;
  grade: string | null;
  approvalStatus: ApprovalStatus;
  expiresAt: Date | null;
  isDemo: boolean;
};

/**
 * Public catalogue: only published products with an ACTIVE, unexpired approval
 * in the viewer's jurisdiction. Search runs server-side across name, synonym,
 * SKU, sequence and molecular metadata. The private watchlist is never exposed.
 */
export async function listEligibleProducts(filters: CatalogueFilters): Promise<CatalogueItem[]> {
  const db = await getDb();
  const rows = await db
    .select({ product: schema.products, approval: schema.jurisdictionApprovals })
    .from(schema.products)
    .innerJoin(
      schema.jurisdictionApprovals,
      and(
        eq(schema.jurisdictionApprovals.productId, schema.products.id),
        eq(schema.jurisdictionApprovals.country, filters.country),
        eq(schema.jurisdictionApprovals.status, "ACTIVE"),
      ),
    )
    .where(eq(schema.products.status, "PUBLISHED"));

  const aliasRows = await db.select().from(schema.productAliases);
  const aliasMap = new Map<string, string[]>();
  for (const row of aliasRows) {
    const list = aliasMap.get(row.productId) ?? [];
    list.push(row.alias);
    aliasMap.set(row.productId, list);
  }

  const now = Date.now();
  let items: CatalogueItem[] = rows
    .filter((row) => row.approval.expiresAt === null || row.approval.expiresAt.getTime() > now)
    .map((row) => ({
      id: row.product.id,
      sku: row.product.sku,
      name: row.product.name,
      family: row.product.family,
      moleculeType: row.product.moleculeType,
      lengthAa: row.product.lengthAa,
      modifications: row.product.modifications,
      grade: row.product.grade,
      approvalStatus: row.approval.status,
      expiresAt: row.approval.expiresAt,
      isDemo: row.product.isDemo,
    }));

  const query = filters.q?.trim().toLowerCase();
  if (query) {
    items = items.filter((item) => {
      const haystack = [
        item.name,
        item.sku,
        item.family,
        item.moleculeType,
        ...(aliasMap.get(item.id) ?? []),
      ].join(" ").toLowerCase();
      return haystack.includes(query);
    });
  }
  if (filters.documents) {
    const lotRows = await db.select({ id: schema.lots.id, productId: schema.lots.productId }).from(schema.lots);
    const docRows = await db.select({ lotId: schema.lotDocuments.lotId }).from(schema.lotDocuments);
    const docLotIds = new Set(docRows.map((row) => row.lotId));
    const withDocs = new Set(lotRows.filter((lot) => docLotIds.has(lot.id)).map((lot) => lot.productId));
    items = items.filter((item) => withDocs.has(item.id));
  }
  if (filters.length) items = items.filter((item) => inLengthBucket(item.lengthAa, filters.length!));
  if (filters.family) items = items.filter((item) => item.family === filters.family);
  if (filters.moleculeType) items = items.filter((item) => item.moleculeType === filters.moleculeType);
  if (filters.modified) items = items.filter((item) => item.modifications !== null);

  return items.sort((a, b) => a.name.localeCompare(b.name));
}

export async function catalogueFacets(country: string): Promise<{ families: string[]; moleculeTypes: string[] }> {
  const items = await listEligibleProducts({ country });
  return {
    families: [...new Set(items.map((item) => item.family))].sort(),
    moleculeTypes: [...new Set(items.map((item) => item.moleculeType))].sort(),
  };
}

export type Dossier = {
  product: typeof schema.products.$inferSelect;
  aliases: string[];
  candidate: typeof schema.candidates.$inferSelect | null;
  approval: typeof schema.jurisdictionApprovals.$inferSelect | null;
  lots: Array<typeof schema.lots.$inferSelect>;
  documents: Array<typeof schema.lotDocuments.$inferSelect>;
  reviewerNames: Record<string, string>;
};

export async function getDossier(productId: string, country: string): Promise<Dossier | null> {
  const db = await getDb();
  const [product] = await db.select().from(schema.products).where(eq(schema.products.id, productId));
  if (!product) return null;
  const aliasRows = await db.select().from(schema.productAliases).where(eq(schema.productAliases.productId, productId));
  const [approval] = await db
    .select()
    .from(schema.jurisdictionApprovals)
    .where(and(eq(schema.jurisdictionApprovals.productId, productId), eq(schema.jurisdictionApprovals.country, country)));
  const candidate = product.candidateId
    ? ((await db.select().from(schema.candidates).where(eq(schema.candidates.id, product.candidateId)))[0] ?? null)
    : null;
  const lots = await db.select().from(schema.lots).where(eq(schema.lots.productId, productId));
  const lotIds = lots.map((lot) => lot.id);
  const documents = lotIds.length > 0 ? await db.select().from(schema.lotDocuments).where(inArray(schema.lotDocuments.lotId, lotIds)) : [];
  const reviewerIds = [...new Set(documents.map((doc) => doc.reviewerId).filter((id): id is string => id !== null))];
  const reviewerRows = reviewerIds.length > 0
    ? await db.select({ id: schema.users.id, fullName: schema.users.fullName }).from(schema.users).where(inArray(schema.users.id, reviewerIds))
    : [];
  const reviewerNames = Object.fromEntries(reviewerRows.map((row) => [row.id, row.fullName]));
  return { product, aliases: aliasRows.map((row) => row.alias), candidate, approval: approval ?? null, lots, documents, reviewerNames };
}

export async function getProductBySku(sku: string): Promise<typeof schema.products.$inferSelect | null> {
  const db = await getDb();
  const [product] = await db.select().from(schema.products).where(eq(schema.products.sku, sku));
  return product ?? null;
}