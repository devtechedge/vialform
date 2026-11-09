"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  addShipmentAction,
  confirmOrderAction,
  issueQuoteAction,
  reviewPoAction,
  reviewVerificationAction,
  setSystemFlagAction,
  transitionApprovalAction,
} from "@/server/admin-actions";
import type { ActionState } from "@/server/workspace-actions";
import { APPROVAL_TRANSITIONS, SHIPMENT_MILESTONES, type ApprovalStatus } from "@/domain/enums";

const input = "h-9 rounded-md border border-border bg-bg px-2 text-sm text-ink focus:border-cobalt focus:outline-none";

function Btn({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return <button type="submit" disabled={pending} className="h-9 rounded-md bg-cobalt px-3 text-[13px] font-medium text-on-cobalt hover:opacity-90 disabled:opacity-60">{pending ? "Working…" : label}</button>;
}
function Note({ state }: { state: ActionState }) {
  if (state.error) return <p role="alert" className="mt-1 text-[12px] text-danger">{state.error}</p>;
  if (state.ok) return <p className="mt-1 text-[12px] text-lime">{state.ok}</p>;
  return null;
}

export function SystemFlagForm({ flag, value }: { flag: string; value: boolean }) {
  const [state, action] = useActionState(setSystemFlagAction, {});
  return (
    <form action={action} className="flex items-center gap-2">
      <input type="hidden" name="key" value={flag} />
      <input type="hidden" name="value" value={value ? "false" : "true"} />
      <Btn label={value ? "Disable" : "Enable"} />
      <Note state={state} />
    </form>
  );
}

export function TransitionApprovalForm({ approvalId, current }: { approvalId: string; current: ApprovalStatus }) {
  const [state, action] = useActionState(transitionApprovalAction, {});
  const options = APPROVAL_TRANSITIONS[current];
  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="approvalId" value={approvalId} />
      <select name="to" className={input} defaultValue={options[0]}>
        {options.map((status) => <option key={status} value={status}>{status}</option>)}
      </select>
      <input name="legalBasis" placeholder="Legal basis" aria-label="Legal basis" className={`${input} w-36`} />
      <input name="lawfulPurpose" placeholder="Lawful purpose" aria-label="Lawful purpose" className={`${input} w-36`} />
      <Btn label="Apply" />
      <Note state={state} />
    </form>
  );
}

export function VerificationForm({ requestId }: { requestId: string }) {
  const [state, action] = useActionState(reviewVerificationAction, {});
  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="requestId" value={requestId} />
      <button type="submit" name="approve" value="true" className="h-9 rounded-md bg-lime-signal px-3 text-[13px] font-medium text-ink hover:opacity-90">Verify</button>
      <button type="submit" name="approve" value="false" className="h-9 rounded-md border border-danger/40 px-3 text-[13px] font-medium text-danger hover:bg-danger/10">Reject</button>
      <Note state={state} />
    </form>
  );
}

export function IssueQuoteForm({ rfqId }: { rfqId: string }) {
  const [state, action] = useActionState(issueQuoteAction, {});
  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="rfqId" value={rfqId} />
      <input type="number" name="unitPriceMinor" min={0} defaultValue={10000} aria-label="Unit price (minor units)" className={`${input} w-28`} />
      <span className="mono text-[11px] text-muted">minor/unit</span>
      <Btn label="Issue quote" />
      <Note state={state} />
    </form>
  );
}

export function ReviewPoForm({ poId }: { poId: string }) {
  const [state, action] = useActionState(reviewPoAction, {});
  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="poId" value={poId} />
      <button type="submit" name="approve" value="true" className="h-9 rounded-md bg-lime-signal px-3 text-[13px] font-medium text-ink hover:opacity-90">Approve</button>
      <button type="submit" name="approve" value="false" className="h-9 rounded-md border border-danger/40 px-3 text-[13px] font-medium text-danger hover:bg-danger/10">Reject</button>
      <Note state={state} />
    </form>
  );
}

export function ConfirmOrderForm({ poId }: { poId: string }) {
  const [state, action] = useActionState(confirmOrderAction, {});
  return (
    <form action={action} className="flex items-center gap-2">
      <input type="hidden" name="poId" value={poId} />
      <Btn label="Confirm order" />
      <Note state={state} />
    </form>
  );
}

export function ShipmentForm({ orderId }: { orderId: string }) {
  const [state, action] = useActionState(addShipmentAction, {});
  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="orderId" value={orderId} />
      <select name="milestone" className={input}>{SHIPMENT_MILESTONES.map((m) => <option key={m} value={m}>{m}</option>)}</select>
      <input name="description" placeholder="Description" aria-label="Description" className={`${input} w-40`} />
      <Btn label="Record" />
      <Note state={state} />
    </form>
  );
}