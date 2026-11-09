import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Download, GitCompare, ShieldAlert } from "lucide-react";
import { SiteShell } from "@/components/site-shell";
import { ApprovalBadge, Badge, Card, DemoBanner, Field, PageHeader } from "@/components/ui";
import { SyntheticChromatogram, SyntheticSpectrum } from "@/components/analytical-plot";
import { getDossier, jurisdictionLabel } from "@/server/catalogue";
import { checkEligibility } from "@/server/compliance";
import { getSessionUser } from "@/server/auth/sessions";
import { FILE_TOKEN_TTL_MS, signFileToken } from "@/server/files";

export const dynamic = "force-dynamic";

type Params = { id: string };
type SearchParams = Record<string, string | string[] | undefined>;

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { id } = await params;
  const dossier = await getDossier(id, "US");
  return { title: dossier ? `${dossier.product.name} dossier` : "Dossier" };
}

function notAsserted(value: string | null): string {
  return value ?? "Not asserted in this demonstration record";
}

export default async function DossierPage({ params, searchParams }: { params: Promise<Params>; searchParams: Promise<SearchParams> }) {
  const { id } = await params;
  const sp = await searchParams;
  const country = typeof sp.country === "string" ? sp.country : "US";
  const dossier = await getDossier(id, country);
  if (!dossier) notFound();
  const { product, aliases, candidate, approval, lots, documents } = dossier;
  const eligibility = await checkEligibility(id, country);
  const user = await getSessionUser();
  const expires = Date.now() + FILE_TOKEN_TTL_MS;

  return (
    <SiteShell>
      <PageHeader eyebrow={`Dossier · ${product.sku}`} title={product.name} description={product.family} />
      <div className="mx-auto w-full max-w-6xl px-5 py-8">
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <ApprovalBadge status={approval?.status ?? "DISCOVERY"} />
          <Badge tone="neutral">{jurisdictionLabel(country)}</Badge>
          {product.isDemo && <Badge tone="warn">Demo record</Badge>}
          <div className="ml-auto flex gap-2">
            <Link href={`/compare?add=${product.id}&country=${country}`} className="inline-flex items-center gap-2 rounded-md border border-border-strong bg-surface px-3 py-2 text-sm font-medium text-ink hover:border-cobalt">
              <GitCompare size={15} aria-hidden /> Compare
            </Link>
            <Link href={user ? `/procurement?product=${product.id}&country=${country}` : "/login"} className="inline-flex items-center gap-2 rounded-md bg-cobalt px-3 py-2 text-sm font-medium text-white hover:opacity-90">
              {user ? "Request quote" : "Sign in to procure"}
            </Link>
          </div>
        </div>

        <DemoBanner className="mb-6">
          Identity classification is grounded in public chemistry; sequence, formula, weight and assays are not asserted. Any approval shown is a synthetic demonstration, not a regulatory determination.
        </DemoBanner>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="p-6 lg:col-span-2">
            <h2 className="text-lg font-semibold text-ink">Verified identity</h2>
            <p className="mt-1 text-sm text-ink-soft">Facts are separated from supplier claims and demo data. A sourced sequence is required before verification.</p>
            <dl className="mt-4">
              <Field label="Canonical name" value={product.name} />
              <Field label="SKU" value={product.sku} mono />
              <Field label="Molecule type" value={product.moleculeType} mono />
              <Field label="Length" value={product.lengthAa !== null ? `${product.lengthAa} amino acids (approx.)` : "Not asserted"} />
              <Field label="Sourced sequence" value={notAsserted(product.sequence)} mono />
              <Field label="Formula" value={notAsserted(product.formula)} mono />
              <Field label="Molecular weight" value={notAsserted(product.molecularWeight)} mono />
              <Field label="Modifications" value={notAsserted(product.modifications)} />
              <Field label="Identifiers" value={product.identifiers.length > 0 ? product.identifiers.join(", ") : "None asserted"} mono />
              <Field label="Synonyms" value={aliases.length > 0 ? aliases.join(", ") : "None"} />
              <Field label="Grade / spec" value={notAsserted(product.grade)} />
              {candidate && <Field label="Classification" value={candidate.classification} mono />}
              {candidate?.regulatoryCaution && <Field label="Regulatory caution" value={candidate.regulatoryCaution} />}
            </dl>
          </Card>

          <Card className="h-fit p-6">
            <h2 className="text-lg font-semibold text-ink">Jurisdiction eligibility</h2>
            <div className="mt-4 flex items-center gap-2">
              {eligibility.eligible ? <Badge tone="lime">Eligible for RFQ</Badge> : <Badge tone="danger">Not eligible</Badge>}
            </div>
            <dl className="mt-4">
              <Field label="Status" value={<ApprovalBadge status={approval?.status ?? "DISCOVERY"} />} />
              <Field label="Legal basis" value={approval?.legalBasis ?? "Not recorded"} />
              <Field label="Lawful purpose" value={approval?.lawfulPurpose ?? "Not recorded"} />
              <Field label="Expires" value={approval?.expiresAt ? approval.expiresAt.toISOString().slice(0, 10) : "Not set"} mono />
            </dl>
            {!eligibility.eligible && (
              <div className="mt-4 rounded-md border border-danger/30 bg-danger/10 p-3">
                <p className="flex items-center gap-2 text-sm font-medium text-danger"><ShieldAlert size={15} aria-hidden /> Procurement blocked</p>
                <ul className="mt-2 list-disc pl-5 text-[13px] text-ink-soft">
                  {eligibility.reasons.map((reason) => <li key={reason}>{reason}</li>)}
                </ul>
              </div>
            )}
          </Card>
        </div>

        <section className="mt-8">
          <h2 className="text-lg font-semibold text-ink">Lot passport</h2>
          <p className="mt-1 text-sm text-ink-soft">Immutable lot records with custody, status and expiry. Documents distinguish supplier-issued, independent and demo origin.</p>
          <div className="mt-4 space-y-6">
            {lots.length === 0 && <p className="text-sm text-ink-soft">No lots in this demonstration record.</p>}
            {lots.map((lot) => {
              const lotDocs = documents.filter((doc) => doc.lotId === lot.id);
              return (
                <Card key={lot.id} className="p-6">
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="mono text-base font-semibold text-ink">{lot.lotNumber}</h3>
                    <Badge tone={lot.status === "RELEASED" ? "lime" : "neutral"}>{lot.status}</Badge>
                    {lot.isDemo && <Badge tone="warn">Demo lot</Badge>}
                    <span className="mono ml-auto text-[12px] text-muted">
                      Expires {lot.expiryDate ? lot.expiryDate.toISOString().slice(0, 10) : "n/a"}
                    </span>
                  </div>
                  <dl className="mt-3 grid gap-x-8 sm:grid-cols-2">
                    <Field label="Quantity" value={`${lot.quantityMinor - lot.reservedMinor} ${lot.unit} available`} mono />
                    <Field label="Storage" value={lot.storageConditions ?? "Not set"} />
                  </dl>

                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <SyntheticChromatogram seed={lot.lotNumber} label="HPLC purity trace" />
                    <SyntheticSpectrum seed={lot.lotNumber} label="ESI-MS spectrum" />
                  </div>

                  <div className="mt-4 overflow-x-auto scroll-pane">
                    <table className="w-full min-w-[560px] text-sm">
                      <thead>
                        <tr className="border-b border-border text-left">
                          <th className="mono py-2 pr-4 text-[11px] uppercase tracking-wide text-muted">Document</th>
                          <th className="mono py-2 pr-4 text-[11px] uppercase tracking-wide text-muted">Origin</th>
                          <th className="mono py-2 pr-4 text-[11px] uppercase tracking-wide text-muted">Method / date</th>
                          <th className="mono py-2 pr-4 text-[11px] uppercase tracking-wide text-muted">SHA-256</th>
                          <th className="py-2" />
                        </tr>
                      </thead>
                      <tbody>
                        {lotDocs.map((doc) => (
                          <tr key={doc.id} className="border-b border-border last:border-0">
                            <td className="py-2 pr-4 font-medium text-ink">{doc.kind}{doc.isDemo && <span className="mono ml-2 text-[11px] text-warn">SYNTHETIC DEMO - NOT VALID</span>}</td>
                            <td className="mono py-2 pr-4 text-[12px] text-ink-soft">{doc.origin}</td>
                            <td className="py-2 pr-4 text-ink-soft">{doc.method ?? "n/a"}{doc.assayDate ? ` · ${doc.assayDate.toISOString().slice(0, 10)}` : ""}</td>
                            <td className="mono py-2 pr-4 text-[11px] text-muted">{doc.sha256.slice(0, 12)}…</td>
                            <td className="py-2 text-right">
                              <a href={`/api/files/${doc.id}?token=${signFileToken(doc.id, expires)}`} className="inline-flex items-center gap-1 text-sm font-medium text-cobalt hover:underline">
                                <Download size={14} aria-hidden /> Download
                              </a>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              );
            })}
          </div>
        </section>
      </div>
    </SiteShell>
  );
}