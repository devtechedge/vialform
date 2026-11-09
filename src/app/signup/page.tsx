import Link from "next/link";
import type { Metadata } from "next";
import { SiteShell } from "@/components/site-shell";
import { SignupForm } from "@/components/auth-forms";
import { Card, DemoBanner } from "@/components/ui";

export const metadata: Metadata = { title: "Apply for access" };

export default function SignupPage() {
  return (
    <SiteShell>
      <div className="mx-auto w-full max-w-md px-5 py-16">
        <p className="mono mb-3 text-[12px] uppercase tracking-[0.25em] text-cobalt">Institution access</p>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Apply for access</h1>
        <p className="mt-2 text-sm text-ink-soft">
          Create an institution account. Verification is reviewed by compliance staff before procurement is enabled.
        </p>
        <DemoBanner className="mt-4">In demo mode, submitted applications are stored as demonstration data and reset on cold start.</DemoBanner>
        <Card className="mt-6 p-6"><SignupForm /></Card>
        <p className="mt-6 text-sm text-ink-soft">
          Already verified? <Link href="/login" className="font-medium text-cobalt hover:underline">Sign in</Link>
        </p>
      </div>
    </SiteShell>
  );
}