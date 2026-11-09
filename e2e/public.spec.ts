import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("landing presents the evidence-first pitch", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Evidence before procurement." })).toBeVisible();
});

test("catalogue search reaches an eligible dossier", async ({ page }) => {
  await page.goto("/materials?q=GHK");
  await expect(page.getByRole("link", { name: "GHK-Cu" }).first()).toBeVisible();
  await page.getByRole("link", { name: "GHK-Cu" }).first().click();
  await expect(page.getByRole("heading", { name: "Verified identity" })).toBeVisible();
  await expect(page.getByText("Synthetic illustrative data - not a test result.").first()).toBeVisible();
});

test("landing has no serious accessibility violations", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag22aa"]).analyze();
  const serious = results.violations.filter((violation) => violation.impact === "serious" || violation.impact === "critical");
  expect(serious).toEqual([]);
});

test("materials page has no serious accessibility violations", async ({ page }) => {
  await page.goto("/materials");
  await page.waitForLoadState("networkidle");
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag22aa"]).analyze();
  const serious = results.violations.filter((violation) => violation.impact === "serious" || violation.impact === "critical");
  expect(serious).toEqual([]);
});