import Link from "next/link";
import type { Metadata } from "next";
import { SiteShell } from "@/components/site-shell";
import { Card, DemoBanner, PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "Procurement" };

const STEPS = [
  { n: "01", title: "Saved list", body: "Browse eligible dossiers and add materials to a saved list with quantities and lot constraints." },
  { n: "02", title: "RFQ basket", body: "Convert a saved list into a request for quote. The server re-checks jurisdiction eligibility before submission." },
  { n: "03", title: "Review & quote", body: "Staff review the request, then issue an immutable priced quote. Revisions are snapshotted, never edited in place." },
  { n: "04", title: "PO & approval", body: "Upload a purchase order against a quote. Staff approve it before an order is confirmed." },
  { n: "05", title: "Order & shipment", body: "Confirmed orders track shipment milestones. No card payment is taken in v1." },
];

export default function ProcurementPage() {
  return (
    <SiteShell>
      <PageHeader eyebrow="Procurement" title="Request for quote, gated by eligibility" description="A controlled RFQ to order workflow for verified institutions. Every step is authorized, audited and jurisdiction-gated." />
      <div className="mx-auto w-full max-w-6xl px-5 py-8">
        <DemoBanner className="mb-6">Demo mode cannot order, invoice, charge or fulfil. No payment is taken in v1.</DemoBanner>
        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {STEPS.map((step) => (
            <Card key={step.n} className="p-6">
              <span className="mono text-[12px] text-cobalt">{step.n}</span>
              <h2 className="mt-2 text-base font-semibold text-ink">{step.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{step.body}</p>
            </Card>
          ))}
        </ol>
        <Card className="mt-8 p-6">
          <h2 className="text-base font-semibold text-ink">Who can procure</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">
            Only verified institutions with an active jurisdiction approval for the specific product-country
            pair may submit an RFQ. Consumer destinations are flagged and blocked. Candidates default to not
            approved and are never purchasable.
          </p>
          <div className="mt-4 flex gap-3">
            <Link href="/login" className="rounded-md bg-cobalt px-4 py-2 text-sm font-medium text-on-cobalt hover:opacity-90">Institution access</Link>
            <Link href="/materials" className="rounded-md border border-border-strong bg-surface px-4 py-2 text-sm font-medium text-ink hover:border-cobalt">Browse materials</Link>
          </div>
        </Card>
      </div>
    </SiteShell>
  );
}