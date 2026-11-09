import type { Metadata } from "next";
import { SiteShell } from "@/components/site-shell";
import { Card, DemoBanner, PageHeader } from "@/components/ui";
import { SyntheticChromatogram, SyntheticSpectrum } from "@/components/analytical-plot";

export const metadata: Metadata = { title: "Quality & Testing" };

const POINTS = [
  { title: "Identity first", body: "Every dossier separates verified identity facts from supplier claims and demo data. Sequence, formula and weight are never inferred; a sourced sequence is required before verification." },
  { title: "Analytical evidence", body: "HPLC and mass-spec data are shown only from source records, with method, date, lot, units and reviewer. Supplier-issued and independent tests are distinguished." },
  { title: "Lot integrity", body: "Lots carry immutable identifiers, custody chains, status and expiry. Documents are versioned, SHA-256 verified and served through private expiring downloads." },
  { title: "Honest demo data", body: "Demonstration plots are labelled synthetic illustrative data, not a test result. Demo certificates of analysis are marked SYNTHETIC DEMO - NOT VALID." },
];

export default function QualityPage() {
  return (
    <SiteShell>
      <PageHeader eyebrow="Quality & Testing" title="Analytical evidence, not claims" description="How identity, purity and provenance are recorded and reviewed before a material can be procured." />
      <div className="mx-auto w-full max-w-6xl px-5 py-8">
        <DemoBanner className="mb-6">The plots below are synthetic illustrative data, not a test result.</DemoBanner>
        <div className="grid gap-4 sm:grid-cols-2">
          {POINTS.map((point) => (
            <Card key={point.title} className="p-6">
              <h2 className="text-base font-semibold text-ink">{point.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{point.body}</p>
            </Card>
          ))}
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <SyntheticChromatogram seed="quality-hplc" label="Illustrative HPLC purity trace" />
          <SyntheticSpectrum seed="quality-ms" label="Illustrative ESI-MS spectrum" />
        </div>
      </div>
    </SiteShell>
  );
}