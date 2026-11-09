import { defineConfig, devices } from "@playwright/test";

const authSecret = process.env.AUTH_SECRET ?? "e2e-auth-secret-0123456789abcdef0123456789abcdef";
const fileSecret = process.env.FILE_SIGNING_SECRET ?? "e2e-file-secret-0123456789abcdef0123456789abcdef";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "pnpm start",
    url: "http://localhost:3000/api/health",
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      AUTH_SECRET: authSecret,
      FILE_SIGNING_SECRET: fileSecret,
      DEMO_MODE: "true",
    },
  },
});