import { describe, expect, it } from "vitest";
import { decimalsFor, formatMoney, fromMinor, sumMinor, toMinor } from "./money";

describe("minor-unit money", () => {
  it("converts units to minor units without float drift", () => {
    expect(toMinor(10.25, "USD")).toBe(1025);
    expect(fromMinor(1025, "USD")).toBe(10.25);
  });

  it("respects zero-decimal currencies", () => {
    expect(decimalsFor("JPY")).toBe(0);
    expect(toMinor(1000, "JPY")).toBe(1000);
  });

  it("sums minor units exactly", () => {
    expect(sumMinor([100, 250, 99])).toBe(449);
    expect(sumMinor([])).toBe(0);
  });

  it("formats with the currency code", () => {
    expect(formatMoney(1025, "USD")).toContain("10.25");
    expect(formatMoney(1025, "USD")).toContain("$");
  });
});