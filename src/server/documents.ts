import { eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import * as schema from "@/db/schema";
import type { DocumentOrigin } from "@/domain/enums";

export type DownloadMeta = {
  storageKey: string;
  fileName: string;
  mimeType: string;
  sha256: string;
  origin: DocumentOrigin;
  isDemo: boolean;
};

/** Resolve a document id to its private storage metadata across document tables. */
export async function getDocumentForDownload(id: string): Promise<DownloadMeta | null> {
  const db = await getDb();
  const [lotDoc] = await db.select().from(schema.lotDocuments).where(eq(schema.lotDocuments.id, id));
  if (lotDoc) {
    return { storageKey: lotDoc.storageKey, fileName: lotDoc.fileName, mimeType: lotDoc.mimeType, sha256: lotDoc.sha256, origin: lotDoc.origin, isDemo: lotDoc.isDemo };
  }
  const [supplierDoc] = await db.select().from(schema.supplierDocuments).where(eq(schema.supplierDocuments.id, id));
  if (supplierDoc) {
    return { storageKey: supplierDoc.storageKey, fileName: supplierDoc.fileName, mimeType: supplierDoc.mimeType, sha256: supplierDoc.sha256, origin: supplierDoc.origin, isDemo: supplierDoc.isDemo };
  }
  return null;
}