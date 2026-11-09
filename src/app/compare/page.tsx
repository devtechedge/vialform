import Link from "next/link";
import type { Metadata } from "next";
import { Plus, X } from "lucide-react";
import { SiteShell } from "@/components/site-shell";
import { ApprovalBadge, Badge, DemoBanner, EmptyState, PageHeader } from "@/components/ui";
import { getDossier, jurisdictionLabel, listEligibleProducts, type Dossier } from "@/server/catalogue";
import { getSessionUser } from "@/server/auth/sessions";

export const metadata: Metadata = { title: "Compare" };
export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

const ROWS: Array<{ label: string; get: (d: Dossier) => string }> = [
  { label: "SKU", get: (d) => d.product.sku },
  { label: "Family", get: (d) => d.product.family },
  { label: "Molecule type", get: (d) => d.product.moleculeType },
  { label: "Length", get: (d) => (d.product.lengthAa !== null ? `${d.product.lengthAa} aa` : "Not asserted") },
  { label: "Sourced sequence", get: (d) => d.product.sequence ?? "Not asserted" },
  { label: "Formula", get: (d) => d.product.formula ?? "Not asserted" },
  { label: "Molecular weight", get: (d) => d.product.molecularWeight ?? "Not asserted" },
  { label: "Modifications", get: (d) => d.product.modifications ?? "None asserted" },
  { label: "Grade", get: (d) => d.product.grade ?? "Not asserted" },
  { label: "Lots", get: (d) => String(d.lots.length) },
  { label: "Documents", get: (d) => String(d.documents.length) },
];

export default async function ComparePage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const country = typeof sp.country === "string" ? sp.country : "US";
  const base = typeof sp.ids === "string" ? sp.ids.split(",").filter(Boolean) : [];
  const add = typeof sp.add === "string" ? sp.add : null;
  const ids = [...new Set(add ? [...base, add] : base)].slice(0, 4);
  const dossiers = (await Promise.all(ids.map((id) => getDossier(id, country)))).filter((d): d is Dossier => d !== null);
  const eligible = await listEligibleProducts({ country });
  const available = eligible.filter((item) => !ids.includes(item.id));
  const user = await getSessionUser();
  const removeIds = (id: string) => ids.filter((entry) => entry !== id).join(",");

  return (
    <SiteShell>
      <PageHeader eyebrow="Compare" title="Compare dossiers" description="Place up to four dossiers side by side. Missing or unasserted fields are exposed rather than hidden." />
      <div className="mx-auto w-full max-w-6xl px-5 py-8">
        <DemoBanner className="mb-6" />
        <div className="mb-6 flex flex-wrap items-end gap-3">
          <form action="/compare" method="get" className="flex items-end gap-2">
            <input type="hidden" name="country" value={country} />
            <input type="hidden" name="ids" value={ids.join(",")} />
            <label className="flex flex-col gap-1">
              <span className="mono text-[11px] uppercase tracking-wide text-muted">Add material ({dossiers.length}/4)</span>
              <select name="add" defaultValue="" disabled={dossiers.length >= 4 || available.length === 0} className="h-10 rounded-md border border-border bg-surface px-2 text-sm text-ink focus:border-cobalt focus:outline-none disabled:opacity-50">
                <option value="">Select a material</option>
                {available.map((item) => <option key={item.id} value={item.id}>{item.name} ({item.sku})</option>)}
              </select>
            </label>
            <button type="submit" className="inline-flex h-10 items-center gap-1 rounded-md bg-cobalt px-3 text-sm font-medium text-on-cobalt hover:opacity-90 disabled:opacity-50" disabled={dossiers.length >= 4}>
              <Plus size={15} aria-hidden /> Add
            </button>
          </form>
          <form action="/compare" method="get" className="flex items-end gap-2">
            <input type="hidden" name="ids" value={ids.join(",")} />
            <label className="flex flex-col gap-1">
              <span className="mono text-[11px] uppercase tracking-wide text-muted">Jurisdiction</span>
              <select name="country" defaultValue={country} className="h-10 rounded-md border border-border bg-surface px-2 text-sm text-ink focus:border-cobalt focus:outline-none">
                <option value="US">United States</option>
                <option value="IN">India</option>
                <option value="EU">European Union</option>
              </select>
            </label>
            <button type="submit" className="h-10 rounded-md border border-border-strong bg-surface px-3 text-sm font-medium text-ink hover:border-cobalt">Apply</button>
          </form>
          {user && dossiers.length > 0 && (
            <Link href={`/workspace?saveComparison=${ids.join(",")}&country=${country}`} className="ml-auto h-10 rounded-md border border-border-strong bg-surface px-3 text-sm font-medium leading-10 text-ink hover:border-cobalt">
              Save comparison
            </Link>
          )}
        </div>

        {dossiers.length === 0 ? (
          <EmptyState title="Nothing to compare yet" body="Add up to four eligible materials from the catalogue, or open a dossier and choose Compare." />
        ) : (
          <div className="scroll-pane overflow-x-auto rounded-xl border border-border">
            <table className="w-full min-w-[640px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-2">
                  <th className="mono w-44 px-4 py-3 text-left text-[11px] uppercase tracking-wide text-muted">Field</th>
                  {dossiers.map((d) => (
                    <th key={d.product.id} className="px-4 py-3 text-left">
                      <div className="flex items-center gap-2">
                        <Link href={`/materials/${d.product.id}?country=${country}`} className="font-semibold text-ink hover:text-cobalt">{d.product.name}</Link>
                        <Link href={`/compare?ids=${removeIds(d.product.id)}&country=${country}`} aria-label={`Remove ${d.product.name}`} className="text-muted hover:text-danger"><X size={14} aria-hidden /></Link>
                      </div>
                      <div className="mt-1"><ApprovalBadge status={d.approval?.status ?? "DISCOVERY"} /></div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ROWS.map((row) => (
                  <tr key={row.label} className="border-b border-border last:border-0">
                    <td className="mono px-4 py-3 text-[12px] uppercase tracking-wide text-muted">{row.label}</td>
                    {dossiers.map((d) => {
                      const value = row.get(d);
                      const missing = value === "Not asserted";
                      return <td key={d.product.id} className={`px-4 py-3 ${missing ? "text-muted italic" : "text-ink"}`}>{value}</td>;
                    })}
                  </tr>
                ))}
                <tr>
                  <td className="mono px-4 py-3 text-[12px] uppercase tracking-wide text-muted">Eligibility</td>
                  {dossiers.map((d) => <td key={d.product.id} className="px-4 py-3"><Badge tone="neutral">{jurisdictionLabel(country)}</Badge></td>)}
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </SiteShell>
  );
}