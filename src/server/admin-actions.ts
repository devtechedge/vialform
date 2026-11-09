"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import * as schema from "@/db/schema";
import { requireStaff } from "@/server/auth/rbac";
import { recordAudit } from "@/server/audit";
import { canTransition } from "@/server/compliance";
import { addShipmentEvent, approvePo, confirmOrder, issueQuote, ProcurementError } from "@/server/procurement";
import { APPROVAL_STATUSES, SHIPMENT_MILESTONES, type ApprovalStatus, type ShipmentMilestone } from "@/domain/enums";
import type { ActionState } from "./workspace-actions";

function message(error: unknown): string {
  if (error instanceof ProcurementError) return error.message;
  if (error instanceof Error) return error.message;
  return "Something went wrong.";
}

export async function setSystemFlagAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const staff = await requireStaff(["PLATFORM_ADMIN", "COMPLIANCE_ADMIN"]);
    const key = String(formData.get("key") ?? "");
    const value = String(formData.get("value") ?? "");
    if (!["sales_paused", "kill_switch", "fulfilment_enabled"].includes(key) || !["true", "false"].includes(value)) {
      return { error: "Invalid flag." };
    }
    const db = await getDb();
    await db.insert(schema.appMeta).values({ key, value }).onConflictDoUpdate({ target: schema.appMeta.key, set: { value, updatedAt: new Date() } });
    await recordAudit(db, { actorId: staff.id, actorRole: staff.staffRole, action: "SET_SYSTEM_FLAG", entityType: "system", entityId: key, summary: `Set ${key}=${value}.` });
    revalidatePath("/admin");
    return { ok: `${key} set to ${value}.` };
  } catch (error) {
    return { error: message(error) };
  }
}

export async function transitionApprovalAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const staff = await requireStaff(["COMPLIANCE_ADMIN", "PLATFORM_ADMIN"]);
    const approvalId = String(formData.get("approvalId") ?? "");
    const to = String(formData.get("to") ?? "") as ApprovalStatus;
    const legalBasis = String(formData.get("legalBasis") ?? "");
    const lawfulPurpose = String(formData.get("lawfulPurpose") ?? "");
    if (!APPROVAL_STATUSES.includes(to)) return { error: "Invalid target status." };
    const db = await getDb();
    const [approval] = await db.select().from(schema.jurisdictionApprovals).where(eq(schema.jurisdictionApprovals.id, approvalId));
    if (!approval) return { error: "Approval not found." };
    if (!canTransition(approval.status, to)) return { error: `Cannot transition from ${approval.status} to ${to}.` };
    if ((to === "ACTIVE" || to === "JURISDICTION_APPROVED") && legalBasis.trim().length < 3) {
      return { error: "Record a legal basis before approving." };
    }
    await db.update(schema.jurisdictionApprovals).set({
      status: to,
      legalBasis: legalBasis || approval.legalBasis,
      lawfulPurpose: lawfulPurpose || approval.lawfulPurpose,
      reviewerId: staff.id,
      reviewedAt: new Date(),
      reviewNotes: String(formData.get("notes") ?? "") || approval.reviewNotes,
      revision: approval.revision + 1,
    }).where(eq(schema.jurisdictionApprovals.id, approvalId));
    await recordAudit(db, { actorId: staff.id, actorRole: staff.staffRole, action: "TRANSITION_APPROVAL", entityType: "jurisdiction_approval", entityId: approvalId, summary: `Approval ${approval.status} -> ${to}.`, metadata: { to } });
    revalidatePath("/admin");
    return { ok: `Transitioned to ${to}.` };
  } catch (error) {
    return { error: message(error) };
  }
}

export async function reviewVerificationAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const staff = await requireStaff(["COMPLIANCE_ADMIN", "PLATFORM_ADMIN"]);
    const requestId = String(formData.get("requestId") ?? "");
    const approve = formData.get("approve") === "true";
    const db = await getDb();
    const [request] = await db.select().from(schema.verificationRequests).where(eq(schema.verificationRequests.id, requestId));
    if (!request) return { error: "Request not found." };
    await db.update(schema.verificationRequests).set({ status: approve ? "APPROVED" : "REJECTED", reviewerId: staff.id, reviewedAt: new Date(), reviewNotes: String(formData.get("notes") ?? "") }).where(eq(schema.verificationRequests.id, requestId));
    await db.update(schema.organizations).set({ verificationStatus: approve ? "VERIFIED" : "REJECTED" }).where(eq(schema.organizations.id, request.organizationId));
    await recordAudit(db, { organizationId: request.organizationId, actorId: staff.id, actorRole: staff.staffRole, action: approve ? "VERIFY_INSTITUTION" : "REJECT_INSTITUTION", entityType: "organization", entityId: request.organizationId, summary: `Institution ${approve ? "verified" : "rejected"}.` });
    revalidatePath("/admin");
    return { ok: approve ? "Institution verified." : "Institution rejected." };
  } catch (error) {
    return { error: message(error) };
  }
}

export async function issueQuoteAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const staff = await requireStaff();
    const rfqId = String(formData.get("rfqId") ?? "");
    const unitPriceMinor = Number(formData.get("unitPriceMinor") ?? 0);
    if (!rfqId || !Number.isFinite(unitPriceMinor) || unitPriceMinor < 0) return { error: "Enter a valid unit price." };
    const db = await getDb();
    const lines = await db
      .select({ line: schema.quoteRequestLines, product: schema.products })
      .from(schema.quoteRequestLines)
      .innerJoin(schema.products, eq(schema.quoteRequestLines.productId, schema.products.id))
      .where(eq(schema.quoteRequestLines.quoteRequestId, rfqId));
    if (lines.length === 0) return { error: "RFQ has no lines." };
    await issueQuote({
      staffId: staff.id,
      staffRole: staff.staffRole ?? "STAFF",
      rfqId,
      notes: String(formData.get("notes") ?? "") || undefined,
      lines: lines.map(({ line, product }) => ({ productId: product.id, sku: product.sku, name: product.name, quantityMinor: line.quantityMinor, unit: line.unit, unitPriceMinor })),
    });
    revalidatePath("/admin");
    return { ok: "Quote issued." };
  } catch (error) {
    return { error: message(error) };
  }
}

export async function reviewPoAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const staff = await requireStaff();
    await approvePo({ staffId: staff.id, staffRole: staff.staffRole ?? "STAFF", poId: String(formData.get("poId") ?? ""), approve: formData.get("approve") === "true", notes: String(formData.get("notes") ?? "") || undefined });
    revalidatePath("/admin");
    return { ok: "PO reviewed." };
  } catch (error) {
    return { error: message(error) };
  }
}

export async function confirmOrderAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const staff = await requireStaff();
    await confirmOrder({ staffId: staff.id, staffRole: staff.staffRole ?? "STAFF", poId: String(formData.get("poId") ?? "") });
    revalidatePath("/admin");
    return { ok: "Order confirmed." };
  } catch (error) {
    return { error: message(error) };
  }
}

export async function addShipmentAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const staff = await requireStaff();
    const milestone = String(formData.get("milestone") ?? "") as ShipmentMilestone;
    if (!SHIPMENT_MILESTONES.includes(milestone)) return { error: "Invalid milestone." };
    await addShipmentEvent({ staffId: staff.id, staffRole: staff.staffRole ?? "STAFF", orderId: String(formData.get("orderId") ?? ""), milestone, description: String(formData.get("description") ?? "Milestone recorded."), location: String(formData.get("location") ?? "") || undefined });
    revalidatePath("/admin");
    return { ok: "Shipment event recorded." };
  } catch (error) {
    return { error: message(error) };
  }
}