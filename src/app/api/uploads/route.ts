import { NextResponse } from "next/server";
import { AuthError, requireUser } from "@/server/auth/rbac";
import { assertSameOrigin } from "@/server/auth/csrf";
import { clientKey, rateLimit } from "@/server/rate-limit";
import { processUpload, UploadError } from "@/server/uploads";

export const dynamic = "force-dynamic";

/** Authenticated, origin-checked, rate-limited private upload. */
export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const user = await requireUser();
    if (!rateLimit(clientKey(request, "upload"), 30, 60 * 60 * 1000).allowed) {
      return NextResponse.json({ error: "Upload rate limit reached." }, { status: 429 });
    }
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "Missing file." }, { status: 400 });
    const bytes = new Uint8Array(await file.arrayBuffer());
    const result = await processUpload({ bytes, mimeType: file.type, fileName: file.name, prefix: `uploads/${user.id}` });
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: error.status });
    if (error instanceof UploadError) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ error: "Upload failed." }, { status: 500 });
  }
}