import { beforeAll, describe, expect, it } from "vitest";
import { getDb } from "@/db/client";
import { catalogueFacets, listEligibleProducts } from "@/server/catalogue";
import { expiringApprovals } from "@/server/compliance";

beforeAll(async () => {
  await getDb();
});

describe("catalogue search and jurisdiction filtering", () => {
  it("shows only ACTIVE materials in a jurisdiction", async () => {
    const us = await listEligibleProducts({ country: "US" });
    const names = us.map((item) => item.name);
    expect(names).toContain("GHK-Cu");
    expect(names).not.toContain("BPC-157");
    expect(us.every((item) => item.approvalStatus === "ACTIVE")).toBe(true);
  });

  it("searches by name, synonym and SKU", async () => {
    expect((await listEligibleProducts({ country: "US", q: "GHK" })).some((i) => i.name === "GHK-Cu")).toBe(true);
    expect((await listEligibleProducts({ country: "US", q: "copper" })).some((i) => i.name === "GHK-Cu")).toBe(true);
    const ghk = (await listEligibleProducts({ country: "US", q: "GHK" }))[0]!;
    expect((await listEligibleProducts({ country: "US", q: ghk.sku })).some((i) => i.id === ghk.id)).toBe(true);
  });

  it("switches eligibility by jurisdiction", async () => {
    const india = await listEligibleProducts({ country: "IN" });
    expect(india.some((item) => item.name === "Ipamorelin")).toBe(true);
  });

  it("exposes filter facets", async () => {
    const facets = await catalogueFacets("US");
    expect(facets.families.length).toBeGreaterThan(0);
    expect(facets.moleculeTypes).toContain("PEPTIDE");
  });
});

describe("expiry alerts", () => {
  it("flags active approvals expiring inside the window only", async () => {
    expect((await expiringApprovals(30)).length).toBe(0);
    expect((await expiringApprovals(365)).length).toBeGreaterThan(0);
  });
});