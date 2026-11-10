import { beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import * as schema from "@/db/schema";
import { buildWorkspaceCsv } from "@/server/export";
import { submitRfq } from "@/server/procurement";

let helixId: string;
let meridianId: string;
let buyerId: string;
let ghkId: string;

function first<T>(rows: T[]): T {
  const row = rows[0];
  if (!row) throw new Error("Expected a seeded row");
  return row;
}

beforeAll(async () => {
  const db = await getDb();
  helixId = first(await db.select().from(schema.organizations).where(eq(schema.organizations.slug, "helix-demo"))).id;
  meridianId = first(await db.select().from(schema.organizations).where(eq(schema.organizations.slug, "meridian-demo"))).id;
  buyerId = first(await db.select().from(schema.users).where(eq(schema.users.email, "buyer@helix.demo"))).id;
  ghkId = first(await db.select().from(schema.products).where(eq(schema.products.name, "GHK-Cu"))).id;
});

describe("workspace export tenancy", () => {
  it("exports only the requesting institution's records", async () => {
    await submitRfq({ organizationId: helixId, userId: buyerId, country: "US", lines: [{ productId: ghkId, quantityMinor: 1000, unit: "mg" }] });
    const helixCsv = await buildWorkspaceCsv(helixId);
    const meridianCsv = await buildWorkspaceCsv(meridianId);
    expect(helixCsv.split("\n").length).toBeGreaterThan(1);
    expect(helixCsv).toContain("rfq");
    expect(meridianCsv.split("\n").length).toBe(1);
  });
});