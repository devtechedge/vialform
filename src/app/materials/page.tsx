import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, Search } from "lucide-react";
import { SiteShell } from "@/components/site-shell";
import { ApprovalBadge, Badge, DemoBanner, EmptyState, PageHeader } from "@/components/ui";
import { catalogueFacets, JURISDICTIONS, jurisdictionLabel, listEligibleProducts } from "@/server/catalogue";
import { MOLECULE_TYPES } from "@/domain/enums";

export const metadata: Metadata = { title: "Materials" };
export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

function param(sp: SearchParams, key: string): string | undefined {
  const value = sp[key];
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

export default async function MaterialsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const country = param(sp, "country") ?? "US";
  const q = param(sp, "q");
  const family = param(sp, "family");
  const moleculeType = param(sp, "type");
  const modified = sp.modified === "1";
  const [items, facets] = await Promise.all([
    listEligibleProducts({ country, q, family, moleculeType, modified }),
    catalogueFacets(country),
  ]);

  return (
    <SiteShell>
      <PageHeader
        eyebrow="Catalogue"
        title="Materials"
        description="Search eligible research materials by name, synonym, SKU, sequence and molecular metadata. Only materials active in your jurisdiction are shown."
      />
      <div className="mx-auto w-full max-w-6xl px-5 py-8">
        <DemoBanner className="mb-6">
          Eligibility shown here uses synthetic demonstration approvals, not regulatory determinations. Demo mode cannot order or invoice.
        </DemoBanner>

        <form action="/materials" method="get" className="mb-6 grid gap-3 rounded-xl border border-border bg-surface p-4 sm:grid-cols-2 lg:grid-cols-6">
          <label className="relative sm:col-span-2 lg:col-span-2">
            <span className="sr-only">Search materials</span>
            <Search size={15} aria-hidden className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input type="search" name="q" defaultValue={q} placeholder="Name, synonym, SKU, sequence" className="h-10 w-full rounded-md border border-border bg-bg pl-9 pr-3 text-sm text-ink placeholder:text-muted focus:border-cobalt focus:outline-none" />
          </label>
          <label className="flex flex-col gap-1">
            <span className="mono text-[11px] uppercase tracking-wide text-muted">Jurisdiction</span>
            <select name="country" defaultValue={country} className="h-10 rounded-md border border-border bg-bg px-2 text-sm text-ink focus:border-cobalt focus:outline-none">
              {JURISDICTIONS.map((entry) => <option key={entry.code} value={entry.code}>{entry.label}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="mono text-[11px] uppercase tracking-wide text-muted">Family</span>
            <select name="family" defaultValue={family ?? ""} className="h-10 rounded-md border border-border bg-bg px-2 text-sm text-ink focus:border-cobalt focus:outline-none">
              <option value="">All families</option>
              {facets.families.map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="mono text-[11px] uppercase tracking-wide text-muted">Molecule</span>
            <select name="type" defaultValue={moleculeType ?? ""} className="h-10 rounded-md border border-border bg-bg px-2 text-sm text-ink focus:border-cobalt focus:outline-none">
              <option value="">All types</option>
              {MOLECULE_TYPES.map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          </label>
          <div className="flex items-end gap-3">
            <label className="flex h-10 items-center gap-2 text-sm text-ink-soft">
              <input type="checkbox" name="modified" value="1" defaultChecked={modified} className="h-4 w-4 accent-[var(--cobalt)]" />
              Modified
            </label>
            <button type="submit" className="h-10 rounded-md bg-cobalt px-4 text-sm font-medium text-white hover:opacity-90">Apply</button>
          </div>
        </form>

        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-ink-soft">
            <span className="mono font-semibold text-ink">{items.length}</span> eligible in {jurisdictionLabel(country)}
            {q && <> for <span className="mono">&ldquo;{q}&rdquo;</span></>}
          </p>
          <Link href={`/compare?country=${country}`} className="text-sm font-medium text-cobalt hover:underline">Compare dossiers</Link>
        </div>

        {items.length === 0 ? (
          <EmptyState title="No eligible materials" body="No published material has an active approval in this jurisdiction for the current filters. Try another jurisdiction or clear filters." />
        ) : (
          <div className="scroll-pane overflow-x-auto rounded-xl border border-border">
            <table className="w-full min-w-[720px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-2 text-left">
                  <th className="mono px-4 py-3 text-[11px] uppercase tracking-wide text-muted">Material / SKU</th>
                  <th className="mono px-4 py-3 text-[11px] uppercase tracking-wide text-muted">Family</th>
                  <th className="mono px-4 py-3 text-[11px] uppercase tracking-wide text-muted">Type</th>
                  <th className="mono px-4 py-3 text-[11px] uppercase tracking-wide text-muted">Length</th>
                  <th className="mono px-4 py-3 text-[11px] uppercase tracking-wide text-muted">Eligibility</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b border-border bg-surface last:border-0 hover:bg-surface-2">
                    <td className="px-4 py-3">
                      <Link href={`/materials/${item.id}?country=${country}`} className="font-medium text-ink hover:text-cobalt">{item.name}</Link>
                      <span className="mono ml-2 text-[12px] text-muted">{item.sku}</span>
                      {item.modifications && <Badge tone="cobalt" className="ml-2">Modified</Badge>}
                    </td>
                    <td className="px-4 py-3 text-ink-soft">{item.family}</td>
                    <td className="mono px-4 py-3 text-[12px] text-ink-soft">{item.moleculeType}</td>
                    <td className="mono px-4 py-3 text-ink-soft">{item.lengthAa !== null ? `${item.lengthAa} aa` : "n/a"}</td>
                    <td className="px-4 py-3"><ApprovalBadge status={item.approvalStatus} /></td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/materials/${item.id}?country=${country}`} className="inline-flex items-center gap-1 text-sm font-medium text-cobalt hover:underline">
                        Dossier <ArrowRight size={14} aria-hidden />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </SiteShell>
  );
}