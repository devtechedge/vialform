import Link from "next/link";
import { Search } from "lucide-react";
import { getSessionUser } from "@/server/auth/sessions";
import { ThemeToggle } from "./theme";
import { Wordmark } from "./wordmark";

const NAV = [
  { href: "/materials", label: "Materials" },
  { href: "/quality", label: "Quality & Testing" },
  { href: "/procurement", label: "Procurement" },
  { href: "/research-notes", label: "Research Notes" },
  { href: "/company", label: "Company" },
  { href: "/contact", label: "Contact" },
];

export async function SiteHeader() {
  const user = await getSessionUser();
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-bg/85 backdrop-blur">
      <div className="mx-auto w-full max-w-6xl px-5">
        <div className="flex h-16 items-center gap-3">
          <Link href="/" aria-label="VIALFORM home" className="shrink-0">
            <Wordmark />
          </Link>
          <form action="/materials" method="get" role="search" className="relative ml-auto hidden min-w-0 flex-1 sm:block sm:max-w-xs">
            <Search size={15} aria-hidden className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="search"
              name="q"
              placeholder="Search name, synonym, SKU, sequence"
              aria-label="Search materials"
              className="h-9 w-full rounded-md border border-border bg-surface pl-9 pr-3 text-sm text-ink placeholder:text-muted focus:border-cobalt focus:outline-none"
            />
          </form>
          <ThemeToggle />
          {user ? (
            <div className="flex shrink-0 items-center gap-2">
              {user.staffRole && (
                <Link href="/admin" className="hidden rounded-md px-3 py-2 text-sm font-medium text-ink-soft hover:text-ink sm:inline">
                  Admin
                </Link>
              )}
              <Link href="/workspace" className="rounded-md bg-cobalt px-3 py-2 text-sm font-medium text-white hover:opacity-90">
                Workspace
              </Link>
            </div>
          ) : (
            <Link href="/login" className="shrink-0 rounded-md border border-border-strong bg-surface px-3 py-2 text-sm font-medium text-ink hover:border-cobalt">
              <span className="hidden sm:inline">Institution access</span>
              <span className="sm:hidden">Sign in</span>
            </Link>
          )}
        </div>
        <nav aria-label="Primary" className="scroll-pane -mx-1 flex gap-1 overflow-x-auto pb-2">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium text-ink-soft transition-colors hover:bg-surface-2 hover:text-ink"
            >
              {item.label}
            </Link>
          ))}
          <Link href="/materials" className="whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium text-cobalt hover:bg-surface-2 sm:hidden">
            Search
          </Link>
        </nav>
      </div>
    </header>
  );
}