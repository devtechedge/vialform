import { eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import * as schema from "@/db/schema";
import { getSessionUser } from "@/server/auth/sessions";

export const dynamic = "force-dynamic";

function esc(value: unknown): string {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

/** Staff-only watchlist export. Preserves full signal provenance. */
export async function GET() {
  const user = await getSessionUser();
  if (!user || !user.staffRole) return new Response("Forbidden", { status: 403 });
  const db = await getDb();
  const rows = await db
    .select({ signal: schema.marketSignals, candidate: schema.candidates })
    .from(schema.marketSignals)
    .innerJoin(schema.candidates, eq(schema.marketSignals.candidateId, schema.candidates.id));

  const header = ["candidate", "classification", "metric", "source_url", "publisher", "observed_at", "geography", "observation", "value", "confidence", "limitations", "is_demo"];
  const lines = [header.map(esc).join(",")];
  for (const { signal, candidate } of rows) {
    lines.push([
      candidate.canonicalName,
      candidate.classification,
      signal.metric,
      signal.sourceUrl,
      signal.publisher,
      signal.observedAt.toISOString(),
      signal.geography,
      signal.observation,
      signal.valueText,
      signal.confidence,
      signal.limitations,
      signal.isDemo,
    ].map(esc).join(","));
  }
  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="vialform-watchlist.csv"',
      "Cache-Control": "private, no-store",
    },
  });
}