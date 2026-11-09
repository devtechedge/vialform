import Link from "next/link";
import { Wordmark } from "@/components/wordmark";

export default function NotFound() {
  return (
    <div className="calibrated-grid flex min-h-dvh flex-col items-center justify-center px-5 text-center">
      <Wordmark />
      <p className="mono mt-8 text-[12px] uppercase tracking-[0.25em] text-cobalt">404</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-ink">Record not found</h1>
      <p className="mt-3 max-w-md text-ink-soft">
        The dossier or page you requested does not exist, or is not eligible in your jurisdiction.
      </p>
      <div className="mt-8 flex gap-3">
        <Link href="/materials" className="rounded-md bg-cobalt px-4 py-2 text-sm font-medium text-on-cobalt hover:opacity-90">Browse materials</Link>
        <Link href="/" className="rounded-md border border-border-strong bg-surface px-4 py-2 text-sm font-medium text-ink hover:border-cobalt">Home</Link>
      </div>
    </div>
  );
}