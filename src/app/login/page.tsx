import Link from "next/link";
import type { Metadata } from "next";
import { SiteShell } from "@/components/site-shell";
import { LoginForm } from "@/components/auth-forms";
import { Card } from "@/components/ui";
import { isDemoMode } from "@/env";
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from "@/demo/seed";

export const metadata: Metadata = { title: "Sign in" };
export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const demo = isDemoMode();
  return (
    <SiteShell>
      <div className="mx-auto w-full max-w-md px-5 py-16">
        <p className="mono mb-3 text-[12px] uppercase tracking-[0.25em] text-cobalt">Institution access</p>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Sign in</h1>
        <p className="mt-2 text-sm text-ink-soft">Access is restricted to verified institutions and staff.</p>
        <Card className="mt-6 p-6"><LoginForm /></Card>
        {demo && (
          <div className="mt-4 rounded-lg border border-warn/40 bg-warn/10 p-4 text-sm">
            <p className="mono text-[11px] font-semibold uppercase tracking-wide text-warn">Demo accounts (synthetic)</p>
            <ul className="mono mt-2 space-y-1 text-[12px] text-ink-soft">
              <li>Buyer: {DEMO_ACCOUNTS.buyer}</li>
              <li>Compliance admin: {DEMO_ACCOUNTS.admin}</li>
              <li>Research admin: {DEMO_ACCOUNTS.research}</li>
              <li>Password: {DEMO_PASSWORD}</li>
            </ul>
            <p className="mt-2 text-[12px] text-ink-soft">Demo accounts exist only in demo mode and cannot order or invoice.</p>
          </div>
        )}
        <p className="mt-6 text-sm text-ink-soft">
          New institution? <Link href="/signup" className="font-medium text-cobalt hover:underline">Apply for access</Link>
        </p>
      </div>
    </SiteShell>
  );
}