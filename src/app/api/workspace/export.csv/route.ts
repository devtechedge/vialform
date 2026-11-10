import { getSessionContext } from "@/server/auth/sessions";
import { primaryMembership } from "@/server/auth/rbac";
import { buildWorkspaceCsv } from "@/server/export";

export const dynamic = "force-dynamic";

/** Buyer export, scoped to the session's institution; never leaks other tenants. */
export async function GET() {
  const context = await getSessionContext();
  const membership = context ? primaryMembership(context) : null;
  if (!membership) return new Response("Authentication required", { status: 401 });
  const csv = await buildWorkspaceCsv(membership.organizationId);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="vialform-workspace.csv"',
      "Cache-Control": "private, no-store",
    },
  });
}