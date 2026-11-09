import Link from "next/link";
import { ThemeToggle } from "@/components/theme";
import { Wordmark } from "@/components/wordmark";
import { ArrowRight, FileCheck2, FlaskConical, Globe2, ShieldCheck } from "lucide-react";

const pipeline = ["Discovery", "Legal review", "Document review", "Jurisdiction approved", "Active"];

const principles = [
  {
    icon: FlaskConical,
    title: "Verified identity",
    body: "Sourced sequence, molecule type, length, formula and identifiers. Verified facts are separated from supplier claims and demo data.",
  },
  {
    icon: FileCheck2,
    title: "Analytical evidence",
    body: "HPLC and mass-spec lot passports with method, date, units and reviewer. Supplier-issued and independent tests are distinguished.",
  },
  {
    icon: ShieldCheck,
    title: "Provenance and custody",
    body: "Immutable lot records, signed expiring downloads, SHA-256 integrity, document versions and a complete custody chain.",
  },
  {
    icon: Globe2,
    title: "Jurisdiction eligibility",
    body: "Every product-country pair is reviewed against recorded legal basis, licences and expiry before a request for quote is allowed.",
  },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-30 border-b border-border bg-bg/85 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5">
          <Wordmark />
          <div className="flex items-center gap-3">
            <span className="mono hidden text-[11px] uppercase tracking-widest text-muted sm:inline">Research procurement</span>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="calibrated-grid border-b border-border">
          <div className="mx-auto w-full max-w-6xl px-5 py-20 sm:py-28">
            <p className="mono mb-5 text-[12px] uppercase tracking-[0.25em] text-cobalt">Institution-facing · RUO workflow</p>
            <h1 className="max-w-3xl text-4xl font-semibold leading-[1.08] tracking-tight text-ink sm:text-6xl">
              Evidence before procurement.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink-soft">
              VIALFORM is a single-supplier scientific procurement portal. Identity, analytical evidence,
              provenance, lot and jurisdiction eligibility are established before any request for quote.
              No therapeutic claims. No human or veterinary use.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link href="/materials" className="inline-flex items-center gap-2 rounded-md bg-cobalt px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90">
                Browse materials <ArrowRight size={16} aria-hidden />
              </Link>
              <a href="#approach" className="inline-flex items-center gap-2 rounded-md border border-border-strong bg-surface px-5 py-2.5 text-sm font-medium text-ink transition-colors hover:border-cobalt">
                How eligibility works
              </a>
            </div>
          </div>
        </section>

        <section id="approach" className="border-b border-border bg-surface">
          <div className="mx-auto w-full max-w-6xl px-5 py-16">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-muted">Compliance pipeline</h2>
            <p className="mt-3 max-w-2xl text-ink-soft">
              Candidates default to not approved and unpurchasable. A product-country pair advances only
              through recorded server-side review states.
            </p>
            <ol className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-stretch">
              {pipeline.map((step, index) => (
                <li key={step} className="flex flex-1 items-center gap-3">
                  <div className="flex-1 rounded-lg border border-border bg-bg px-4 py-3">
                    <span className="mono text-[11px] text-cobalt">{String(index + 1).padStart(2, "0")}</span>
                    <p className="mt-1 text-sm font-medium text-ink">{step}</p>
                  </div>
                  {index < pipeline.length - 1 && <ArrowRight size={16} aria-hidden className="hidden shrink-0 text-border-strong sm:block" />}
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="evidence" className="border-b border-border">
          <div className="mx-auto w-full max-w-6xl px-5 py-16">
            <h2 className="text-2xl font-semibold tracking-tight text-ink">The scientific dossier</h2>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {principles.map(({ icon: Icon, title, body }) => (
                <div key={title} className="rounded-xl border border-border bg-surface p-6">
                  <Icon size={20} aria-hidden className="text-cobalt" />
                  <h3 className="mt-4 text-base font-semibold text-ink">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-soft">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-surface-2">
          <div className="mx-auto w-full max-w-6xl px-5 py-12">
            <div className="rounded-xl border border-border-strong bg-surface p-6">
              <p className="mono text-[11px] uppercase tracking-widest text-warn">Demonstration environment</p>
              <p className="mt-3 text-sm leading-relaxed text-ink-soft">
                All organizations, lots, prices, assays and documents shown here are synthetic demo data,
                clearly labelled. No candidate is approved for sale. Demo mode cannot order, invoice, charge
                or fulfil. Research-use-only wording is not a determination of legality.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border bg-bg">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-5 py-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
          <Wordmark compact />
          <p className="mono text-[12px">Precision instrument for scientific procurement · WCAG 2.2 AA</p>
        </div>
      </footer>
    </div>
  );
}