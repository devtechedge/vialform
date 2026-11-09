import type { Database } from "@/db/client";
import * as schema from "@/db/schema";

type Inserter = Pick<Database, "insert">;

export type AuditInput = {
  organizationId?: string | null;
  actorId?: string | null;
  actorRole?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  summary: string;
  metadata?: Record<string, unknown>;
  ipHash?: string | null;
};

/**
 * Append an audit event. Accepts a database or transaction so a privileged
 * write and its audit trail commit atomically. The audit table is append-only.
 */
export async function recordAudit(db: Inserter, input: AuditInput): Promise<void> {
  await db.insert(schema.auditEvents).values({
    organizationId: input.organizationId ?? null,
    actorId: input.actorId ?? null,
    actorRole: input.actorRole ?? null,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId,
    summary: input.summary,
    metadata: input.metadata ?? {},
    ipHash: input.ipHash ?? null,
  });
}