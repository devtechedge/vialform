/**
 * Shared domain vocabulary. These unions are the single source of truth for
 * status text columns, Zod validation and UI badges. The compliance lifecycle
 * is enforced server-side; candidates default to NOT_APPROVED and unpurchasable.
 */

export const STAFF_ROLES = ["PLATFORM_ADMIN", "COMPLIANCE_ADMIN", "RESEARCH_ADMIN", "STAFF"] as const;
export type StaffRole = (typeof STAFF_ROLES)[number];

export const ORG_ROLES = ["OWNER", "ADMIN", "MEMBER", "VIEWER"] as const;
export type OrgRole = (typeof ORG_ROLES)[number];

export const ORG_TYPES = ["UNIVERSITY", "RESEARCH_INSTITUTE", "BIOTECH", "PHARMA", "CRO", "OTHER"] as const;
export type OrgType = (typeof ORG_TYPES)[number];

export const VERIFICATION_STATUSES = ["UNVERIFIED", "PENDING", "VERIFIED", "REJECTED", "SUSPENDED"] as const;
export type VerificationStatus = (typeof VERIFICATION_STATUSES)[number];

export const VERIFICATION_REQUEST_STATUSES = ["PENDING", "APPROVED", "REJECTED", "NEEDS_INFO"] as const;
export type VerificationRequestStatus = (typeof VERIFICATION_REQUEST_STATUSES)[number];

export const CANDIDATE_STATUSES = ["NOT_APPROVED", "UNDER_REVIEW", "EXCLUDED"] as const;
export type CandidateStatus = (typeof CANDIDATE_STATUSES)[number];

export const CANDIDATE_CLASSES = ["RESEARCH_CANDIDATE", "APPROVED_MEDICINE", "INVESTIGATIONAL", "REGIONALLY_APPROVED"] as const;
export type CandidateClass = (typeof CANDIDATE_CLASSES)[number];

export const MOLECULE_TYPES = ["PEPTIDE", "PROTEIN", "SMALL_MOLECULE", "PEPTIDOMIMETIC", "OTHER"] as const;
export type MoleculeType = (typeof MOLECULE_TYPES)[number];

export const PRODUCT_STATUSES = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;
export type ProductStatus = (typeof PRODUCT_STATUSES)[number];

/** Product-country eligibility lifecycle. Only ACTIVE permits procurement. */
export const APPROVAL_STATUSES = [
  "DISCOVERY",
  "LEGAL_REVIEW",
  "DOCUMENT_REVIEW",
  "JURISDICTION_APPROVED",
  "ACTIVE",
  "REJECTED",
  "SUSPENDED",
  "EXPIRED",
] as const;
export type ApprovalStatus = (typeof APPROVAL_STATUSES)[number];

/** Allowed forward transitions; REJECTED/SUSPENDED/EXPIRED are terminal-ish. */
export const APPROVAL_TRANSITIONS: Record<ApprovalStatus, readonly ApprovalStatus[]> = {
  DISCOVERY: ["LEGAL_REVIEW", "REJECTED"],
  LEGAL_REVIEW: ["DOCUMENT_REVIEW", "REJECTED"],
  DOCUMENT_REVIEW: ["JURISDICTION_APPROVED", "REJECTED"],
  JURISDICTION_APPROVED: ["ACTIVE", "SUSPENDED", "REJECTED"],
  ACTIVE: ["SUSPENDED", "EXPIRED"],
  REJECTED: ["DISCOVERY"],
  SUSPENDED: ["LEGAL_REVIEW", "REJECTED"],
  EXPIRED: ["LEGAL_REVIEW"],
};

export const LOT_STATUSES = ["QUARANTINE", "RELEASED", "RESERVED", "EXPIRED", "RECALLED", "CONSUMED"] as const;
export type LotStatus = (typeof LOT_STATUSES)[number];

export const DOCUMENT_KINDS = ["COA", "HPLC", "MASS_SPEC", "SPEC_SHEET", "LICENSE", "SUPPLIER_CERT", "OTHER"] as const;
export type DocumentKind = (typeof DOCUMENT_KINDS)[number];

export const DOCUMENT_ORIGINS = ["SUPPLIER_ISSUED", "INDEPENDENT", "DEMO"] as const;
export type DocumentOrigin = (typeof DOCUMENT_ORIGINS)[number];

export const QUOTE_REQUEST_STATUSES = [
  "DRAFT",
  "SUBMITTED",
  "ELIGIBILITY_BLOCKED",
  "UNDER_REVIEW",
  "QUOTED",
  "REVISION_REQUESTED",
  "ACCEPTED",
  "REJECTED",
  "EXPIRED",
  "CANCELLED",
] as const;
export type QuoteRequestStatus = (typeof QUOTE_REQUEST_STATUSES)[number];

export const QUOTE_REVISION_STATUSES = ["DRAFT", "SENT", "ACCEPTED", "SUPERSEDED", "REJECTED"] as const;
export type QuoteRevisionStatus = (typeof QUOTE_REVISION_STATUSES)[number];

export const PO_STATUSES = ["UPLOADED", "UNDER_REVIEW", "APPROVED", "REJECTED"] as const;
export type PoStatus = (typeof PO_STATUSES)[number];

export const ORDER_STATUSES = ["CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "ON_HOLD"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const SHIPMENT_MILESTONES = [
  "LABEL_CREATED",
  "PICKED",
  "PACKED",
  "DISPATCHED",
  "IN_TRANSIT",
  "CUSTOMS",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "EXCEPTION",
] as const;
export type ShipmentMilestone = (typeof SHIPMENT_MILESTONES)[number];

export const MARKET_METRICS = ["SEARCH_INTEREST", "SELLER_COUNT", "PRICE_SAMPLE", "ADVERTISED_STOCK", "LITERATURE_MENTIONS"] as const;
export type MarketMetric = (typeof MARKET_METRICS)[number];

export const CONFIDENCE_LEVELS = ["HIGH", "MEDIUM", "LOW", "INSUFFICIENT"] as const;
export type ConfidenceLevel = (typeof CONFIDENCE_LEVELS)[number];

export const EVIDENCE_TIERS = ["VERIFIED_FACT", "SUPPLIER_CLAIM", "DEMO_DATA"] as const;
export type EvidenceTier = (typeof EVIDENCE_TIERS)[number];

export function isApprovalPurchasable(status: ApprovalStatus): boolean {
  return status === "ACTIVE";
}