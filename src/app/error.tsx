"use client";

import Link from "next/link";

export default function ErrorBoundary({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-5 text-center">
      <p className="mono text-[12px] uppercase tracking-[0.25em] text-danger">Error</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-ink">Something went wrong</h1>
      <p className="mt-3 max-w-md text-ink-soft">
        The request could not be completed. Details are redacted; retry or return to the catalogue.
      </p>
      <div className="mt-8 flex gap-3">
        <button type="button" onClick={reset} className="rounded-md bg-cobalt px-4 py-2 text-sm font-medium text-on-cobalt hover:opacity-90">Try again</button>
        <Link href="/materials" className="rounded-md border border-border-strong bg-surface px-4 py-2 text-sm font-medium text-ink hover:border-cobalt">Browse materials</Link>
      </div>
    </div>
  );
}