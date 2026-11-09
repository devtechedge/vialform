import { and, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import * as schema from "@/db/schema";
import { APPROVAL_TRANSITIONS, isApprovalPurchasable, type ApprovalStatus } from "@/domain/enums";
import { getSystemFlags } from "./system";

export type EligibilityResult = {
  eligible: boolean;
  status: ApprovalStatus | "NO_APPROVAL";
  reasons: string[];
  approvalId?: string;
};

/**
 * Server-side product-country eligibility gate. This is the authority for
 * whether procurement may proceed; the client never decides eligibility.
 * Only an ACTIVE, unexpired approval on a published product with no global
 * pause or kill switch is eligible.
 */
export async function checkEligibility(productId: string, country: string): Promise<EligibilityResult> {
  const flags = await getSystemFlags();
  const reasons: string[] = [];
  if (flags.killSwitch) reasons.push("Global kill switch is engaged; procurement is disabled.");
  if (flags.salesPaused) reasons.push("A global sales pause is active.");

  const db = await getDb();
  const [product] = await db.select().from(schema.products).where(eq(schema.products.id, productId));
  if (!product) return { eligible: false, status: "NO_APPROVAL", reasons: [...reasons, "Product does not exist."] };
  if (product.status !== "PUBLISHED") reasons.push("Product is not published.");

  const [approval] = await db
    .select()
    .from(schema.jurisdictionApprovals)
    .where(and(eq(schema.jurisdictionApprovals.productId, productId), eq(schema.jurisdictionApprovals.country, country)));

  if (!approval) {
    return { eligible: false, status: "NO_APPROVAL", reasons: [...reasons, "No jurisdiction approval exists for this product-country pair."] };
  }
  if (!isApprovalPurchasable(approval.status)) {
    reasons.push(`Approval status is ${approval.status}; only ACTIVE permits procurement.`);
  }
  if (approval.expiresAt && approval.expiresAt.getTime() < Date.now()) {
    reasons.push("The jurisdiction approval has expired.");
  }
  return { eligible: reasons.length === 0, status: approval.status, reasons, approvalId: approval.id };
}

/** Whether a lifecycle transition is permitted by the state machine. */
export function canTransition(from: ApprovalStatus, to: ApprovalStatus): boolean {
  return APPROVAL_TRANSITIONS[from]?.includes(to) ?? false;
}

/** Approvals that are active but expiring within the window (for alerts). */
export async function expiringApprovals(withinDays: number): Promise<Array<typeof schema.jurisdictionApprovals.$inferSelect>> {
  const db = await getDb();
  const rows = await db.select().from(schema.jurisdictionApprovals).where(eq(schema.jurisdictionApprovals.status, "ACTIVE"));
  const cutoff = Date.now() + withinDays * 24 * 60 * 60 * 1000;
  return rows.filter((row) => row.expiresAt !== null && row.expiresAt.getTime() <= cutoff);
}