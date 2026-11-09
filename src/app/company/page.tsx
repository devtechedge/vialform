import type { Metadata } from "next";
import { SiteShell } from "@/components/site-shell";
import { Card, DemoBanner, PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "Company" };

export default function CompanyPage() {
  return (
    <SiteShell>
      <PageHeader eyebrow="Company" title="A single-supplier scientific procurement business" description="VIALFORM supplies analytical reference materials to verified institutions. It is not a marketplace, formulation studio or telehealth product." />
      <div className="mx-auto w-full max-w-3xl px-5 py-8">
        <DemoBanner className="mb-6">This is a demonstration of a lawful institution-facing research workflow. No material is offered for human or veterinary use.</DemoBanner>
        <div className="space-y-4">
          <Card className="p-6">
            <h2 className="text-base font-semibold text-ink">What we do</h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">
              We establish identity, analytical evidence, provenance, lot and jurisdiction eligibility before
              procurement. Compliance admins record lawful purpose, legal basis, licences, supplier evidence,
              reviewer and review/expiry dates for each product-country pair. Nothing is purchasable without an
              active approval.
            </p>
          </Card>
          <Card className="p-6">
            <h2 className="text-base font-semibold text-ink">What we do not do</h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">
              We do not promote or enable self-experimentation, dosing, administration or clinical protocols.
              We make no therapeutic, bodybuilding or anti-ageing claims. Research-use-only wording is not
              treated as proof of legality. Prescription medicines and approved drugs are excluded from RUO
              sale unless cleared for a proper licensed channel.
            </p>
          </Card>
          <Card className="p-6">
            <h2 className="text-base font-semibold text-ink">Governance</h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">
              Every privileged action is authorized and logged. The platform carries a global sales pause, a
              kill switch, expiry alerts and an append-only audit trail. Unclear regulatory evidence keeps the
              related approval disabled.
            </p>
          </Card>
        </div>
      </div>
    </SiteShell>
  );
}