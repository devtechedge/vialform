import Link from "next/link";
import { Wordmark } from "./wordmark";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border bg-bg">
      <div className="mx-auto w-full max-w-6xl px-5 py-10">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-sm">
            <Wordmark />
            <p className="mt-3 text-sm text-ink-soft">
              Evidence before procurement. A single-supplier scientific procurement portal for verified
              institutions. Research use only; no human or veterinary use.
            </p>
          </div>
          <nav aria-label="Footer" className="grid grid-cols-2 gap-x-10 gap-y-2 text-sm">
            <Link href="/materials" className="text-ink-soft hover:text-ink">Materials</Link>
            <Link href="/quality" className="text-ink-soft hover:text-ink">Quality & Testing</Link>
            <Link href="/procurement" className="text-ink-soft hover:text-ink">Procurement</Link>
            <Link href="/research-notes" className="text-ink-soft hover:text-ink">Research Notes</Link>
            <Link href="/company" className="text-ink-soft hover:text-ink">Company</Link>
            <Link href="/contact" className="text-ink-soft hover:text-ink">Contact</Link>
          </nav>
        </div>
        <div className="mt-8 border-t border-border pt-6">
          <p className="mono text-[12px] text-muted">
            Demonstration environment. Synthetic data only. No product is approved for sale; demo cannot order or invoice.
          </p>
        </div>
      </div>
    </footer>
  );
}