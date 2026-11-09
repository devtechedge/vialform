"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import * as schema from "@/db/schema";
import { primaryMembership, requireContext } from "@/server/auth/rbac";
import { recordAudit } from "@/server/audit";
import { addBasketItem, getBasket, ProcurementError, removeBasketItem, submitRfq, uploadPo } from "@/server/procurement";

export type ActionState = { error?: string; ok?: string };

function message(error: unknown): string {
  if (error instanceof ProcurementError) return error.message;
  if (error instanceof Error) return error.message;
  return "Something went wrong.";
}

export async function addToBasketAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const context = await requireContext();
    const membership = primaryMembership(context);
    if (!membership) return { error: "No institution is associated with your account." };
    const productId = String(formData.get("productId") ?? "");
    const quantityMinor = Number(formData.get("quantityMinor") ?? 1000);
    const unit = String(formData.get("unit") ?? "mg");
    if (!productId || !Number.isFinite(quantityMinor) || quantityMinor <= 0) return { error: "Enter a valid product and quantity." };
    await addBasketItem(context.user.id, membership.organizationId, { productId, quantityMinor, unit });
    revalidatePath("/workspace");
    return { ok: "Added to the RFQ basket." };
  } catch (error) {
    return { error: message(error) };
  }
}

export async function removeBasketItemAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const context = await requireContext();
    await removeBasketItem(context.user.id, String(formData.get("itemId") ?? ""));
    revalidatePath("/workspace");
    return { ok: "Removed." };
  } catch (error) {
    return { error: message(error) };
  }
}

export async function submitRfqAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const context = await requireContext();
    const membership = primaryMembership(context);
    if (!membership) return { error: "No institution is associated with your account." };
    const basket = await getBasket(context.user.id, membership.organizationId);
    if (basket.length === 0) return { error: "Your basket is empty." };
    const country = String(formData.get("country") ?? membership.deliveryCountry);
    const result = await submitRfq({
      organizationId: membership.organizationId,
      userId: context.user.id,
      country,
      notes: String(formData.get("notes") ?? "") || undefined,
      lines: basket.map((row) => ({ productId: row.item.productId, quantityMinor: row.item.quantityMinor, unit: row.item.unit, lotId: row.item.lotId })),
    });
    const db = await getDb();
    await db.delete(schema.savedListItems).where(and(eq(schema.savedListItems.userId, context.user.id), eq(schema.savedListItems.organizationId, membership.organizationId)));
    revalidatePath("/workspace");
    redirect(`/workspace?rfq=${result.id}`);
  } catch (error) {
    const digest = (error as { digest?: string }).digest;
    if (typeof digest === "string" && digest.startsWith("NEXT_REDIRECT")) throw error;
    return { error: message(error) };
  }
}

export async function saveDossierAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const context = await requireContext();
    const membership = primaryMembership(context);
    if (!membership) return { error: "No institution is associated with your account." };
    const productId = String(formData.get("productId") ?? "");
    const db = await getDb();
    const [existing] = await db.select().from(schema.savedDossiers).where(and(eq(schema.savedDossiers.userId, context.user.id), eq(schema.savedDossiers.productId, productId)));
    if (!existing) {
      await db.insert(schema.savedDossiers).values({ organizationId: membership.organizationId, userId: context.user.id, productId });
      await recordAudit(db, { organizationId: membership.organizationId, actorId: context.user.id, action: "SAVE_DOSSIER", entityType: "product", entityId: productId, summary: "Dossier saved." });
    }
    revalidatePath("/workspace");
    return { ok: "Dossier saved." };
  } catch (error) {
    return { error: message(error) };
  }
}

export async function saveComparisonAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const context = await requireContext();
    const membership = primaryMembership(context);
    if (!membership) return { error: "No institution is associated with your account." };
    const productIds = String(formData.get("productIds") ?? "").split(",").filter(Boolean).slice(0, 4);
    if (productIds.length === 0) return { error: "Nothing to save." };
    const db = await getDb();
    await db.insert(schema.comparisons).values({ organizationId: membership.organizationId, userId: context.user.id, name: String(formData.get("name") ?? "Comparison"), productIds });
    revalidatePath("/workspace");
    return { ok: "Comparison saved." };
  } catch (error) {
    return { error: message(error) };
  }
}

export async function uploadPoAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const context = await requireContext();
    const membership = primaryMembership(context);
    if (!membership) return { error: "No institution is associated with your account." };
    const revisionId = String(formData.get("revisionId") ?? "");
    const poNumber = String(formData.get("poNumber") ?? "");
    if (!revisionId || !poNumber) return { error: "Enter a PO number." };
    await uploadPo({ userId: context.user.id, organizationId: membership.organizationId, revisionId, poNumber });
    revalidatePath("/workspace");
    return { ok: "Purchase order uploaded for review." };
  } catch (error) {
    return { error: message(error) };
  }
}