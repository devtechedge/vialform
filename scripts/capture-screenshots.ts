import { mkdirSync } from "node:fs";
import { chromium } from "@playwright/test";

const base = process.env.APP_URL ?? "http://localhost:3000";
const out = "docs/screenshots";
mkdirSync(out, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

async function shot(path: string, name: string) {
  await page.goto(base + path, { waitUntil: "networkidle" });
  await page.screenshot({ path: `${out}/${name}` });
  console.log("captured", name);
}

await shot("/", "01-landing.png");
await shot("/materials", "02-materials.png");

await page.goto(base + "/materials?q=GHK", { waitUntil: "networkidle" });
const href = await page.getByRole("link", { name: "GHK-Cu" }).first().getAttribute("href");
await page.goto(base + (href ?? "/materials"), { waitUntil: "networkidle" });
await page.getByRole("heading", { name: "Verified identity" }).waitFor({ timeout: 60_000 });
await page.screenshot({ path: `${out}/03-dossier.png`, fullPage: true });
console.log("captured 03-dossier.png");

await page.goto(base + "/login", { waitUntil: "networkidle" });
await page.getByLabel("Email").fill("buyer@helix.demo");
await page.getByLabel("Password").fill("Vialform-Demo-2026!");
await page.getByRole("button", { name: "Sign in" }).click();
await page.waitForURL(/\/workspace/);
await page.waitForLoadState("networkidle");
await page.screenshot({ path: `${out}/04-workspace.png` });
console.log("captured 04-workspace.png");

const admin = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await admin.goto(base + "/login", { waitUntil: "networkidle" });
await admin.getByLabel("Email").fill("admin@vialform.demo");
await admin.getByLabel("Password").fill("Vialform-Demo-2026!");
await admin.getByRole("button", { name: "Sign in" }).click();
await admin.waitForURL(/\/admin/);
await admin.waitForLoadState("networkidle");
await admin.screenshot({ path: `${out}/05-admin.png` });
console.log("captured 05-admin.png");

const social = await browser.newPage({ viewport: { width: 1280, height: 640 } });
await social.goto(base + "/", { waitUntil: "networkidle" });
await social.screenshot({ path: `${out}/social-preview.png` });
console.log("captured social-preview.png");

await browser.close();
console.log("done");