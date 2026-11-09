import type { Metadata } from "next";
import { ExternalLink } from "lucide-react";
import { SiteShell } from "@/components/site-shell";
import { Badge, Card, DemoBanner, PageHeader } from "@/components/ui";
import { getDb } from "@/db/client";
import * as schema from "@/db/schema";
import type { ConfidenceLevel } from "@/domain/enums";

export const metadata: Metadata = { title: "Research Notes" };
export const dynamic = "force-dynamic";

const confidenceTone: Record<ConfidenceLevel, "lime" | "cobalt" | "warn" | "danger"> = {
  HIGH: "lime",
  MEDIUM: "cobalt",
  LOW: "warn",
  INSUFFICIENT: "danger",
};

export default async function ResearchNotesPage() {
  const db = await getDb();
  const sources = await db.select().from(schema.regulatorySources);
  const jurisdictions = [...new Set(sources.map((source) => source.jurisdiction))].sort();

  return (
    <SiteShell>
      <PageHeader eyebrow="Research Notes" title="Regulatory framework and method" description="Official references and the evidence rules behind the watchlist. These are references, not legal advice." />
      <div className="mx-auto w-full max-w-4xl px-5 py-8">
        <DemoBanner className="mb-6">
          The private watchlist ranks public market visibility and supplier coverage, never sales. Search interest, seller counts and advertised prices are not verified units sold or audited revenue.
        </DemoBanner>

        <Card className="mb-8 p-6">
          <h2 className="text-base font-semibold text-ink">How candidates are treated</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">
            Candidates default to not approved and unpurchasable. Sale, import and export legality is never
            inferred from competitor listings or an RUO label. Approved medicines, APIs and pharmacy-licensed
            compounds are excluded from RUO sale unless cleared for a proper licensed channel. Each signal
            stores source URL, publisher, date, geography, metric, observation, confidence and limitations.
            Unclear or stale evidence is flagged and keeps the related approval disabled.
          </p>
        </Card>

        {jurisdictions.map((jurisdiction) => (
          <section key={jurisdiction} className="mb-8">
            <h2 className="mono mb-3 text-sm font-semibold uppercase tracking-widest text-muted">{jurisdiction}</h2>
            <div className="space-y-3">
              {sources.filter((source) => source.jurisdiction === jurisdiction).map((source) => (
                <Card key={source.id} className="p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-semibold text-ink">{source.title}</h3>
                    <Badge tone={confidenceTone[source.confidence]}>{source.confidence}</Badge>
                  </div>
                  <p className="mt-1 text-[13px] text-muted">{source.publisher} · accessed {source.accessedAt.toISOString().slice(0, 10)}</p>
                  <p className="mt-2 text-sm text-ink-soft">{source.scope}</p>
                  <p className="mt-2 text-[13px] text-warn">{source.uncertainty}</p>
                  <a href={source.sourceUrl} target="_blank" rel="noopener noreferrer" className="mono mt-3 inline-flex items-center gap-1 text-[13px] text-cobalt hover:underline">
                    Official source <ExternalLink size={13} aria-hidden />
                  </a>
                </Card>
              ))}
            </div>
          </section>
        ))}
      </div>
    </SiteShell>
  );
}