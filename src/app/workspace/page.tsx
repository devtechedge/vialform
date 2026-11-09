import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { SiteShell } from "@/components/site-shell";
import { ApprovalBadge, Badge, Card, DemoBanner, EmptyState, PageHeader } from "@/components/ui";
import { RemoveBasketForm, SubmitRfqForm, UploadPoForm } from "@/components/workspace-forms";
import { getSessionContext } from "@/server/auth/sessions";
import { primaryMembership } from "@/server/auth/rbac";
import { getWorkspaceData } from "@/server/workspace";
import { formatMoney } from "@/domain/money";

export const metadata: Metadata = { title: "Workspace" };
export const dynamic = "force-dynamic";

export default async function WorkspacePage() {
  const context = await getSessionContext();
  if (!context) redirect("/login");
  const membership = primaryMembership(context);
  if (!membership) {
    return (
      <SiteShell>
        <PageHeader eyebrow="Workspace" title="Staff account" description="Your account is a staff account without an institution membership." />
        <div className="mx-auto max-w-3xl px-5 py-8"><Link href="/admin" className="font-medium text-cobalt hover:underline">Go to the admin console</Link></div>
      </SiteShell>
    );
  }

  const data = await getWorkspaceData(membership.organizationId, context.user.id);
  const verified = membership.verificationStatus === "VERIFIED";
  const activeQuotes = data.quotes.filter((quote) => quote.status === "SENT");

  return (
    <SiteShell>
      <PageHeader eyebrow="Buyer workspace" title={membership.organizationName} description={`Signed in as ${context.user.fullName}. Country ${membership.country} · delivery ${membership.deliveryCountry}.`} />
      <div className="mx-auto w-full max-w-6xl space-y-8 px-5 py-8">
        <DemoBanner />

        <Card className="p-5">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-base font-semibold text-ink">Institution verification</h2>
            <Badge tone={verified ? "lime" : membership.verificationStatus === "REJECTED" ? "danger" : "warn"}>{membership.verificationStatus}</Badge>
            {membership.isConsumerDestination && <Badge tone="danger">Consumer destination flagged</Badge>}
          </div>
          <p className="mt-2 text-sm text-ink-soft">
            {verified
              ? "Your institution is verified. You may submit RFQs for materials active in your jurisdiction."
              : "Procurement is disabled until compliance staff verify your institution. You can still browse and save dossiers."}
          </p>
        </Card>

        {data.notifications.length > 0 && (
          <section>
            <h2 className="mb-3 text-lg font-semibold text-ink">Alerts</h2>
            <div className="space-y-2">
              {data.notifications.map((note) => (
                <Card key={note.id} className="p-4">
                  <p className="text-sm font-medium text-ink">{note.title}</p>
                  <p className="mt-1 text-sm text-ink-soft">{note.body}</p>
                </Card>
              ))}
            </div>
          </section>
        )}

        <section>
          <h2 className="mb-3 text-lg font-semibold text-ink">RFQ basket</h2>
          {data.basket.length === 0 ? (
            <EmptyState title="Basket is empty" body="Open a dossier and add a material to start a request for quote." />
          ) : (
            <Card className="p-5">
              <div className="scroll-pane overflow-x-auto">
                <table className="w-full min-w-[520px] text-sm">
                  <thead><tr className="border-b border-border text-left"><th className="mono py-2 text-[11px] uppercase tracking-wide text-muted">Material</th><th className="mono py-2 text-[11px] uppercase tracking-wide text-muted">Quantity</th><th className="py-2" /></tr></thead>
                  <tbody>
                    {data.basket.map((row) => (
                      <tr key={row.item.id} className="border-b border-border last:border-0">
                        <td className="py-2 font-medium text-ink">{row.product.name} <span className="mono text-[12px] text-muted">{row.product.sku}</span></td>
                        <td className="mono py-2 text-ink-soft">{row.item.quantityMinor} {row.item.unit}</td>
                        <td className="py-2 text-right"><RemoveBasketForm itemId={row.item.id} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {verified ? (
                <div className="mt-4 border-t border-border pt-4"><SubmitRfqForm country={membership.deliveryCountry} /></div>
              ) : (
                <p className="mt-4 text-sm text-warn">Verification required before submitting an RFQ.</p>
              )}
            </Card>
          )}
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-ink">Requests for quote</h2>
          {data.rfqs.length === 0 ? (
            <p className="text-sm text-ink-soft">No requests yet.</p>
          ) : (
            <div className="space-y-3">
              {data.rfqs.map((rfq) => {
                const quotes = data.quotes.filter((quote) => quote.quoteRequestId === rfq.id);
                return (
                  <Card key={rfq.id} className="p-5">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="mono text-[12px] text-muted">{rfq.id.slice(0, 8)}</span>
                      <Badge tone="cobalt">{rfq.status}</Badge>
                      <span className="mono text-[12px] text-muted">{rfq.destinationCountry}</span>
                      <span className="mono ml-auto text-[12px] text-muted">{rfq.createdAt.toISOString().slice(0, 10)}</span>
                    </div>
                    {quotes.map((quote) => (
                      <div key={quote.id} className="mt-3 rounded-md border border-border bg-bg p-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-medium text-ink">Quote rev {quote.revisionNumber}</span>
                          <Badge tone={quote.status === "SENT" ? "lime" : "neutral"}>{quote.status}</Badge>
                          <span className="mono ml-auto text-sm text-ink">{formatMoney(quote.totalMinor, quote.currency)}</span>
                        </div>
                        {quote.status === "SENT" && verified && <div className="mt-3"><UploadPoForm revisionId={quote.id} /></div>}
                      </div>
                    ))}
                  </Card>
                );
              })}
            </div>
          )}
        </section>

        <div className="grid gap-8 lg:grid-cols-2">
          <section>
            <h2 className="mb-3 text-lg font-semibold text-ink">Purchase orders</h2>
            {data.pos.length === 0 ? <p className="text-sm text-ink-soft">No purchase orders.</p> : (
              <div className="space-y-2">{data.pos.map((po) => (
                <Card key={po.id} className="flex items-center gap-3 p-4">
                  <span className="mono text-sm text-ink">{po.poNumber}</span>
                  <Badge tone={po.status === "APPROVED" ? "lime" : po.status === "REJECTED" ? "danger" : "warn"}>{po.status}</Badge>
                  <span className="mono ml-auto text-sm text-ink-soft">{formatMoney(po.totalMinor, po.currency)}</span>
                </Card>
              ))}</div>
            )}
          </section>
          <section>
            <h2 className="mb-3 text-lg font-semibold text-ink">Saved dossiers</h2>
            {data.saved.length === 0 ? <p className="text-sm text-ink-soft">Nothing saved yet.</p> : (
              <div className="space-y-2">{data.saved.map((row) => (
                <Card key={row.saved.id} className="p-4">
                  <Link href={`/materials/${row.product.id}`} className="text-sm font-medium text-ink hover:text-cobalt">{row.product.name}</Link>
                  <span className="mono ml-2 text-[12px] text-muted">{row.product.sku}</span>
                </Card>
              ))}</div>
            )}
          </section>
        </div>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-ink">Orders & shipment</h2>
          {data.orders.length === 0 ? (
            <p className="text-sm text-ink-soft">No orders. Demo mode cannot create orders or invoices; confirmed orders appear here in a live deployment.</p>
          ) : (
            <div className="space-y-3">{data.orders.map((order) => (
              <Card key={order.id} className="p-5">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="mono text-sm font-medium text-ink">{order.orderNumber}</span>
                  <Badge tone="cobalt">{order.status}</Badge>
                  <span className="mono ml-auto text-sm text-ink-soft">{formatMoney(order.totalMinor, order.currency)}</span>
                </div>
                <ol className="mt-3 space-y-1">
                  {data.shipments.filter((event) => event.orderId === order.id).map((event) => (
                    <li key={event.id} className="mono text-[12px] text-ink-soft">{event.occurredAt.toISOString().slice(0, 10)} · {event.milestone} · {event.description}</li>
                  ))}
                </ol>
              </Card>
            ))}</div>
          )}
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-ink">Team</h2>
          <Card className="p-5">
            <ul className="space-y-2">
              {data.team.map((entry) => (
                <li key={entry.membership.id} className="flex items-center gap-3 text-sm">
                  <span className="font-medium text-ink">{entry.user.fullName}</span>
                  <span className="mono text-[12px] text-muted">{entry.user.email}</span>
                  <Badge tone="neutral" className="ml-auto">{entry.membership.role}</Badge>
                </li>
              ))}
            </ul>
          </Card>
        </section>
      </div>
    </SiteShell>
  );
}