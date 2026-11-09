import type { Metadata } from "next";
import { Mail, MapPin } from "lucide-react";
import { SiteShell } from "@/components/site-shell";
import { Card, DemoBanner, PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "Contact" };

export default function ContactPage() {
  return (
    <SiteShell>
      <PageHeader eyebrow="Contact" title="Talk to the procurement desk" description="For institution verification, jurisdiction questions and request-for-quote support." />
      <div className="mx-auto w-full max-w-3xl px-5 py-8">
        <DemoBanner className="mb-6">Demonstration contact details. The demo does not send messages or process real enquiries.</DemoBanner>
        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="p-6">
            <Mail size={18} aria-hidden className="text-cobalt" />
            <h2 className="mt-3 text-base font-semibold text-ink">Procurement desk</h2>
            <p className="mt-2 text-sm text-ink-soft">Institution access, RFQs and quotes.</p>
            <a href="mailto:procurement@vialform.example" className="mono mt-3 inline-block text-sm text-cobalt hover:underline">procurement@vialform.example</a>
          </Card>
          <Card className="p-6">
            <MapPin size={18} aria-hidden className="text-cobalt" />
            <h2 className="mt-3 text-base font-semibold text-ink">Compliance office</h2>
            <p className="mt-2 text-sm text-ink-soft">Jurisdiction eligibility and legal basis.</p>
            <a href="mailto:compliance@vialform.example" className="mono mt-3 inline-block text-sm text-cobalt hover:underline">compliance@vialform.example</a>
          </Card>
        </div>
        <p className="mt-6 text-sm text-ink-soft">
          Verified institutions can also manage contacts and team roles from the buyer workspace after signing in.
        </p>
      </div>
    </SiteShell>
  );
}