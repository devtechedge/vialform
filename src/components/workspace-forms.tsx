"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  addToBasketAction,
  removeBasketItemAction,
  saveComparisonAction,
  saveDossierAction,
  submitRfqAction,
  uploadPoAction,
  type ActionState,
} from "@/server/workspace-actions";

function Btn({ label, small = false }: { label: string; small?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={`rounded-md bg-cobalt font-medium text-on-cobalt hover:opacity-90 disabled:opacity-60 ${small ? "px-3 py-1.5 text-[13px]" : "px-4 py-2 text-sm"}`}>
      {pending ? "Working…" : label}
    </button>
  );
}

function Note({ state }: { state: ActionState }) {
  if (state.error) return <p role="alert" className="mt-2 text-[13px] text-danger">{state.error}</p>;
  if (state.ok) return <p className="mt-2 text-[13px] text-lime">{state.ok}</p>;
  return null;
}

export function AddToBasketForm({ productId, unit = "mg" }: { productId: string; unit?: string }) {
  const [state, action] = useActionState(addToBasketAction, {});
  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="unit" value={unit} />
      <input type="number" name="quantityMinor" defaultValue={1000} min={1} aria-label="Quantity (milli-units)" className="h-9 w-24 rounded-md border border-border bg-bg px-2 text-sm text-ink focus:border-cobalt focus:outline-none" />
      <span className="mono text-[12px] text-muted">{unit}</span>
      <Btn label="Add to basket" small />
      <Note state={state} />
    </form>
  );
}

export function RemoveBasketForm({ itemId }: { itemId: string }) {
  const [state, action] = useActionState(removeBasketItemAction, {});
  return (
    <form action={action}>
      <input type="hidden" name="itemId" value={itemId} />
      <button type="submit" className="text-[13px] font-medium text-danger hover:underline">Remove</button>
      <Note state={state} />
    </form>
  );
}

export function SubmitRfqForm({ country }: { country: string }) {
  const [state, action] = useActionState(submitRfqAction, {});
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="country" value={country} />
      <textarea name="notes" rows={2} placeholder="Notes for the procurement desk (optional)" className="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-cobalt focus:outline-none" />
      <Btn label="Submit request for quote" />
      <Note state={state} />
    </form>
  );
}

export function SaveDossierForm({ productId }: { productId: string }) {
  const [state, action] = useActionState(saveDossierAction, {});
  return (
    <form action={action}>
      <input type="hidden" name="productId" value={productId} />
      <Btn label="Save dossier" small />
      <Note state={state} />
    </form>
  );
}

export function SaveComparisonForm({ productIds }: { productIds: string }) {
  const [state, action] = useActionState(saveComparisonAction, {});
  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="productIds" value={productIds} />
      <input name="name" defaultValue="Comparison" aria-label="Comparison name" className="h-9 rounded-md border border-border bg-bg px-2 text-sm text-ink focus:border-cobalt focus:outline-none" />
      <Btn label="Save comparison" small />
      <Note state={state} />
    </form>
  );
}

export function UploadPoForm({ revisionId }: { revisionId: string }) {
  const [state, action] = useActionState(uploadPoAction, {});
  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="revisionId" value={revisionId} />
      <input name="poNumber" required placeholder="PO number" aria-label="PO number" className="h-9 rounded-md border border-border bg-bg px-2 text-sm text-ink placeholder:text-muted focus:border-cobalt focus:outline-none" />
      <Btn label="Upload PO" small />
      <Note state={state} />
    </form>
  );
}