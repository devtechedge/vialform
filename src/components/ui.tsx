import type { ReactNode } from "react";
import { AlertTriangle, FlaskConical } from "lucide-react";
import type { ApprovalStatus } from "@/domain/enums";
import { cn } from "@/lib/cn";

type Tone = "neutral" | "cobalt" | "lime" | "warn" | "danger";

const toneClasses: Record<Tone, string> = {
  neutral: "bg-surface-2 text-ink-soft border-border",
  cobalt: "bg-cobalt/10 text-cobalt-ink border-cobalt/30",
  lime: "bg-lime-signal/15 text-lime border-lime/40",
  warn: "bg-warn/10 text-warn border-warn/30",
  danger: "bg-danger/10 text-danger border-danger/30",
};

export function Badge({ children, tone = "neutral", className }: { children: ReactNode; tone?: Tone; className?: string }) {
  return (
    <span className={cn("mono inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide", toneClasses[tone], className)}>
      {children}
    </span>
  );
}

const approvalMeta: Record<ApprovalStatus, { label: string; tone: Tone }> = {
  DISCOVERY: { label: "Discovery", tone: "neutral" },
  LEGAL_REVIEW: { label: "Legal review", tone: "warn" },
  DOCUMENT_REVIEW: { label: "Document review", tone: "warn" },
  JURISDICTION_APPROVED: { label: "Jurisdiction approved", tone: "cobalt" },
  ACTIVE: { label: "Active", tone: "lime" },
  REJECTED: { label: "Rejected", tone: "danger" },
  SUSPENDED: { label: "Suspended", tone: "danger" },
  EXPIRED: { label: "Expired", tone: "neutral" },
};

export function ApprovalBadge({ status }: { status: ApprovalStatus }) {
  const meta = approvalMeta[status];
  return <Badge tone={meta.tone}>{meta.label}</Badge>;
}

export function DemoBanner({ className, children }: { className?: string; children?: ReactNode }) {
  return (
    <div className={cn("flex items-start gap-2.5 rounded-lg border border-warn/40 bg-warn/10 px-4 py-3 text-sm text-ink-soft", className)} role="note">
      <FlaskConical size={16} aria-hidden className="mt-0.5 shrink-0 text-warn" />
      <p>
        <span className="mono font-semibold uppercase tracking-wide text-warn">Synthetic demo. </span>
        {children ?? "All organizations, lots, prices, assays and documents are demonstration data. Demo mode cannot order, invoice or fulfil."}
      </p>
    </div>
  );
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("rounded-xl border border-border bg-surface", className)}>{children}</div>;
}

export function EmptyState({ title, body, icon }: { title: string; body: string; icon?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border-strong bg-surface px-6 py-16 text-center">
      <div className="text-muted">{icon ?? <AlertTriangle size={28} aria-hidden />}</div>
      <h3 className="mt-4 text-base font-semibold text-ink">{title}</h3>
      <p className="mt-2 max-w-md text-sm text-ink-soft">{body}</p>
    </div>
  );
}

export function PageHeader({ eyebrow, title, description }: { eyebrow?: string; title: string; description?: string }) {
  return (
    <div className="border-b border-border bg-surface">
      <div className="mx-auto w-full max-w-6xl px-5 py-10">
        {eyebrow && <p className="mono mb-3 text-[12px] uppercase tracking-[0.25em] text-cobalt">{eyebrow}</p>}
        <h1 className="text-3xl font-semibold tracking-tight text-ink">{title}</h1>
        {description && <p className="mt-3 max-w-2xl text-ink-soft">{description}</p>}
      </div>
    </div>
  );
}

export function Field({ label, value, mono = false }: { label: string; value: ReactNode; mono?: boolean }) {
  return (
    <div className="flex flex-col gap-1 border-b border-border py-3 last:border-0 sm:flex-row sm:items-baseline sm:gap-4">
      <dt className="mono w-48 shrink-0 text-[12px] uppercase tracking-wide text-muted">{label}</dt>
      <dd className={cn("text-sm text-ink", mono && "mono")}>{value}</dd>
    </div>
  );
}