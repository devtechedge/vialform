import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { Download } from "lucide-react";
import { SiteShell } from "@/components/site-shell";
import { ApprovalBadge, Badge, Card, DemoBanner, PageHeader } from "@/components/ui";
import { ConfirmOrderForm, IssueQuoteForm, ReviewPoForm, ShipmentForm, SystemFlagForm, TransitionApprovalForm, VerificationForm } from "@/components/admin-forms";
import { getSessionUser } from "@/server/auth/sessions";
import { getAdminData } from "@/server/admin";
import { signedDownloadUrl } from "@/server/files";
import { formatMoney } from "@/domain/money";

export const metadata: Metadata = { title: "Admin" };
export const dynamic = "force-dynamic";

function Section({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between"><h2 className="text-lg font-semibold text-ink">{title}</h2>{action}</div>
      {children}
    </section>
  );
}

export default async function AdminPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (!user.staffRole) redirect("/workspace");
  const data = await getAdminData();
  const isCompliance = user.staffRole === "COMPLIANCE_ADMIN" || user.staffRole === "PLATFORM_ADMIN";

  return (
    <SiteShell>
      <PageHeader eyebrow={`Admin · ${user.staffRole}`} title="Compliance & operations console" description="Every privileged action is authorized and logged. Candidates default to not approved and are never purchasable." />
      <div className="mx-auto w-full max-w-6xl space-y-10 px-5 py-8">
        <DemoBanner />

        <Section title="Global controls">
          <div className="grid gap-3 sm:grid-cols-3">
            <Card className="p-4">
              <p className="text-sm font-medium text-ink">Sales pause</p>
              <Badge tone={data.flags.salesPaused ? "danger" : "lime"} className="my-2">{data.flags.salesPaused ? "Paused" : "Open"}</Badge>
              {isCompliance && <SystemFlagForm flag="sales_paused" value={data.flags.salesPaused} />}
            </Card>
            <Card className="p-4">
              <p className="text-sm font-medium text-ink">Kill switch</p>
              <Badge tone={data.flags.killSwitch ? "danger" : "lime"} className="my-2">{data.flags.killSwitch ? "Engaged" : "Off"}</Badge>
              {isCompliance && <SystemFlagForm flag="kill_switch" value={data.flags.killSwitch} />}
            </Card>
            <Card className="p-4">
              <p className="text-sm font-medium text-ink">Fulfilment gate</p>
              <Badge tone={data.flags.fulfilmentEnabled ? "lime" : "warn"} className="my-2">{data.flags.fulfilmentEnabled ? "Enabled" : "Disabled"}</Badge>
              {user.staffRole === "PLATFORM_ADMIN" && <SystemFlagForm flag="fulfilment_enabled" value={data.flags.fulfilmentEnabled} />}
            </Card>
          </div>
        </Section>

        <Section title="Expiry alerts (next 30 days)">
          {data.expiring.length === 0 ? (
            <p className="text-sm text-ink-soft">No active approvals expire within 30 days.</p>
          ) : (
            <div className="space-y-2">
              {data.expiring.map((approval) => {
                const product = data.approvals.find((row) => row.approval.id === approval.id)?.product;
                return (
                  <Card key={approval.id} className="flex flex-wrap items-center gap-3 p-4">
                    <span className="text-sm font-medium text-ink">{product?.name ?? approval.productId}</span>
                    <Badge tone="warn">{approval.country}</Badge>
                    <span className="mono ml-auto text-[12px] text-warn">expires {approval.expiresAt?.toISOString().slice(0, 10)}</span>
                  </Card>
                );
              })}
            </div>
          )}
        </Section>

        <Section title="Institution verification">
          <div className="space-y-2">
            {data.verifications.map(({ request, organization }) => (
              <Card key={request.id} className="flex flex-wrap items-center gap-3 p-4">
                <span className="text-sm font-medium text-ink">{organization.name}</span>
                <Badge tone={request.status === "APPROVED" ? "lime" : request.status === "REJECTED" ? "danger" : "warn"}>{request.status}</Badge>
                <span className="mono text-[12px] text-muted">{organization.country}</span>
                {request.status === "PENDING" && isCompliance && <div className="ml-auto"><VerificationForm requestId={request.id} /></div>}
              </Card>
            ))}
          </div>
        </Section>

        <Section title="Jurisdiction approvals">
          <div className="scroll-pane overflow-x-auto rounded-xl border border-border">
            <table className="w-full min-w-[760px] text-sm">
              <thead><tr className="border-b border-border bg-surface-2 text-left"><th className="mono px-3 py-2 text-[11px] uppercase tracking-wide text-muted">Product</th><th className="mono px-3 py-2 text-[11px] uppercase tracking-wide text-muted">Country</th><th className="mono px-3 py-2 text-[11px] uppercase tracking-wide text-muted">Status</th><th className="px-3 py-2 text-[11px] uppercase tracking-wide text-muted">Transition</th></tr></thead>
              <tbody>
                {data.approvals.map(({ approval, product }) => (
                  <tr key={approval.id} className="border-b border-border bg-surface last:border-0">
                    <td className="px-3 py-2 font-medium text-ink">{product.name}</td>
                    <td className="mono px-3 py-2 text-ink-soft">{approval.country}</td>
                    <td className="px-3 py-2"><ApprovalBadge status={approval.status} /></td>
                    <td className="px-3 py-2">{isCompliance ? <TransitionApprovalForm approvalId={approval.id} current={approval.status} /> : <span className="text-[12px] text-muted">Compliance role required</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        <Section title="Requests for quote">
          <div className="space-y-2">
            {data.rfqs.length === 0 && <p className="text-sm text-ink-soft">No RFQs.</p>}
            {data.rfqs.map(({ rfq, organization }) => (
              <Card key={rfq.id} className="flex flex-wrap items-center gap-3 p-4">
                <span className="mono text-[12px] text-muted">{rfq.id.slice(0, 8)}</span>
                <span className="text-sm font-medium text-ink">{organization.name}</span>
                <Badge tone="cobalt">{rfq.status}</Badge>
                <span className="mono text-[12px] text-muted">{rfq.destinationCountry}</span>
                {(rfq.status === "SUBMITTED" || rfq.status === "UNDER_REVIEW") && <div className="ml-auto"><IssueQuoteForm rfqId={rfq.id} /></div>}
              </Card>
            ))}
          </div>
        </Section>

        <Section title="Purchase orders & orders">
          <div className="space-y-2">
            {data.pos.map((po) => (
              <Card key={po.id} className="flex flex-wrap items-center gap-3 p-4">
                <span className="mono text-sm text-ink">{po.poNumber}</span>
                <Badge tone={po.status === "APPROVED" ? "lime" : po.status === "REJECTED" ? "danger" : "warn"}>{po.status}</Badge>
                <span className="mono text-sm text-ink-soft">{formatMoney(po.totalMinor, po.currency)}</span>
                <div className="ml-auto flex gap-3">
                  {po.status === "UPLOADED" && <ReviewPoForm poId={po.id} />}
                  {po.status === "APPROVED" && <ConfirmOrderForm poId={po.id} />}
                </div>
              </Card>
            ))}
            {data.orders.map((order) => (
              <Card key={order.id} className="flex flex-wrap items-center gap-3 p-4">
                <span className="mono text-sm font-medium text-ink">{order.orderNumber}</span>
                <Badge tone="cobalt">{order.status}</Badge>
                <div className="ml-auto"><ShipmentForm orderId={order.id} /></div>
              </Card>
            ))}
          </div>
        </Section>

        <Section title="Suppliers, lots & stock">
          <div className="mb-4 grid gap-3 sm:grid-cols-2">
            {data.suppliers.map((supplier) => (
              <Card key={supplier.id} className="p-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-ink">{supplier.name}</span>
                  <Badge tone={supplier.qualificationStatus === "QUALIFIED" ? "lime" : "warn"}>{supplier.qualificationStatus}</Badge>
                </div>
                <p className="mono mt-1 text-[12px] text-muted">{supplier.country} · {supplier.licenseNumber ?? "no licence"}</p>
              </Card>
            ))}
          </div>
          <div className="scroll-pane overflow-x-auto rounded-xl border border-border">
            <table className="w-full min-w-[720px] text-sm">
              <thead><tr className="border-b border-border bg-surface-2 text-left"><th className="mono px-3 py-2 text-[11px] uppercase tracking-wide text-muted">Lot</th><th className="mono px-3 py-2 text-[11px] uppercase tracking-wide text-muted">Product</th><th className="mono px-3 py-2 text-[11px] uppercase tracking-wide text-muted">Status</th><th className="mono px-3 py-2 text-[11px] uppercase tracking-wide text-muted">Expires</th><th className="mono px-3 py-2 text-[11px] uppercase tracking-wide text-muted">Available</th><th className="mono px-3 py-2 text-[11px] uppercase tracking-wide text-muted">COA</th></tr></thead>
              <tbody>
                {data.lots.map(({ lot, product }) => (
                  <tr key={lot.id} className="border-b border-border bg-surface last:border-0">
                    <td className="mono px-3 py-2 text-ink">{lot.lotNumber}</td>
                    <td className="px-3 py-2 text-ink-soft">{product.name}</td>
                    <td className="px-3 py-2"><Badge tone={lot.status === "RELEASED" ? "lime" : "neutral"}>{lot.status}</Badge></td>
                    <td className="mono px-3 py-2 text-[12px] text-ink-soft">{lot.expiryDate ? lot.expiryDate.toISOString().slice(0, 10) : "n/a"}</td>
                    <td className="mono px-3 py-2 text-ink-soft">{lot.quantityMinor - lot.reservedMinor} {lot.unit}</td>
                    <td className="px-3 py-2">{lot.primaryCoaId ? <a href={signedDownloadUrl(lot.primaryCoaId)} className="text-sm font-medium text-cobalt hover:underline">COA</a> : <span className="text-muted">—</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        <Section title="Private market watchlist" action={<Link href="/api/admin/watchlist.csv" className="inline-flex items-center gap-1 text-sm font-medium text-cobalt hover:underline"><Download size={14} aria-hidden /> Export CSV</Link>}>
          <p className="mb-3 text-sm text-ink-soft">Public visibility and supplier coverage, never sales. {data.candidates.length} candidates · {data.signals.length} dated signals. Approved medicines are excluded from RUO.</p>
          <div className="scroll-pane overflow-x-auto rounded-xl border border-border">
            <table className="w-full min-w-[720px] text-sm">
              <thead><tr className="border-b border-border bg-surface-2 text-left"><th className="mono px-3 py-2 text-[11px] uppercase tracking-wide text-muted">Candidate</th><th className="mono px-3 py-2 text-[11px] uppercase tracking-wide text-muted">Type</th><th className="mono px-3 py-2 text-[11px] uppercase tracking-wide text-muted">Class</th><th className="mono px-3 py-2 text-[11px] uppercase tracking-wide text-muted">Status</th><th className="mono px-3 py-2 text-[11px] uppercase tracking-wide text-muted">RUO</th></tr></thead>
              <tbody>
                {data.candidates.map((candidate) => (
                  <tr key={candidate.id} className="border-b border-border bg-surface last:border-0">
                    <td className="px-3 py-2 font-medium text-ink">{candidate.canonicalName}</td>
                    <td className="mono px-3 py-2 text-[12px] text-ink-soft">{candidate.moleculeType}</td>
                    <td className="mono px-3 py-2 text-[12px] text-ink-soft">{candidate.classification}</td>
                    <td className="px-3 py-2"><Badge tone={candidate.status === "EXCLUDED" ? "danger" : "neutral"}>{candidate.status}</Badge></td>
                    <td className="px-3 py-2">{candidate.excludedFromRuo ? <Badge tone="danger">Excluded</Badge> : <Badge tone="neutral">Candidate</Badge>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        <Section title="Audit trail (recent)">
          <Card className="p-4">
            <ul className="space-y-1">
              {data.audit.map((event) => (
                <li key={event.id} className="mono text-[12px] text-ink-soft">
                  {event.createdAt.toISOString().replace("T", " ").slice(0, 19)} · {event.action} · {event.entityType}/{event.entityId.slice(0, 8)} · {event.summary}
                </li>
              ))}
            </ul>
          </Card>
        </Section>
      </div>
    </SiteShell>
  );
}