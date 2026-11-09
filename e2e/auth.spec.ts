import { expect, test } from "@playwright/test";

const PASSWORD = "Vialform-Demo-2026!";

test("buyer signs in and reaches the workspace", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill("buyer@helix.demo");
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/workspace/);
  await expect(page.getByRole("heading", { name: "Helix Research Institute (Demo)" })).toBeVisible();
});

test("compliance admin signs in and reaches the console", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill("admin@vialform.demo");
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/admin/);
  await expect(page.getByRole("heading", { name: "Compliance & operations console" })).toBeVisible();
});

test("workspace requires authentication", async ({ page }) => {
  await page.goto("/workspace");
  await expect(page).toHaveURL(/\/login/);
});

test("admin requires authentication", async ({ page }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/login/);
});