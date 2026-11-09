import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { dbSource, getDb } from "@/db/client";
import { isDemoMode } from "@/env";

export const dynamic = "force-dynamic";

/** Liveness + database readiness probe used by deploy smoke checks. */
export async function GET() {
  try {
    const db = await getDb();
    const result = await db.execute<{ n: number }>(sql`SELECT count(*)::int AS n FROM products`);
    return NextResponse.json({
      status: "ok",
      db: dbSource(),
      demo: isDemoMode(),
      products: result.rows[0]?.n ?? 0,
    });
  } catch {
    return NextResponse.json({ status: "error", error: "database unavailable" }, { status: 500 });
  }
}