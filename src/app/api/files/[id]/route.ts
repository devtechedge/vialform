import { NextResponse } from "next/server";
import { verifyFileToken } from "@/server/files";
import { getDocumentForDownload } from "@/server/documents";
import { getStorage, sha256Hex } from "@/server/storage";

export const dynamic = "force-dynamic";

/** Private, signed, expiring document download with SHA-256 integrity check. */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  if (!token) return NextResponse.json({ error: "Missing download token." }, { status: 401 });
  const verified = verifyFileToken(token);
  if (!verified || verified.fileId !== id) {
    return NextResponse.json({ error: "Invalid or expired download token." }, { status: 403 });
  }
  const meta = await getDocumentForDownload(id);
  if (!meta) return NextResponse.json({ error: "Document not found." }, { status: 404 });
  const object = await getStorage().get(meta.storageKey);
  if (!object) return NextResponse.json({ error: "File unavailable." }, { status: 404 });
  if (sha256Hex(object.bytes) !== meta.sha256) {
    return NextResponse.json({ error: "Document integrity check failed." }, { status: 500 });
  }
  const safeName = meta.fileName.replace(/["\\\r\n]/g, "");
  return new Response(Buffer.from(object.bytes), {
    headers: {
      "Content-Type": meta.mimeType,
      "Content-Disposition": `attachment; filename="${safeName}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "X-Demo-Document": meta.isDemo ? "true" : "false",
    },
  });
}