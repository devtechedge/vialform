import { clsx } from "clsx";

/** Distinct VIALFORM wordmark: a calibrated vial + molecular bond linework. */
export function Wordmark({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <span className={clsx("inline-flex items-center gap-2.5", className)}>
      <svg width="26" height="26" viewBox="0 0 26 26" fill="none" aria-hidden className="shrink-0">
        <rect x="1" y="1" width="24" height="24" rx="5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M10 6h6M11 6v5.2L7.6 17.4A2 2 0 0 0 9.3 20.5h7.4a2 2 0 0 0 1.7-3.1L15 11.2V6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M9.2 15.5h7.6" stroke="var(--cobalt)" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="13" cy="17.6" r="1.1" fill="var(--lime-signal)" />
      </svg>
      {!compact && (
        <span className="text-[15px] font-semibold tracking-[0.18em] text-ink">VIALFORM</span>
      )}
    </span>
  );
}