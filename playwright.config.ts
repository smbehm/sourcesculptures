import { defineConfig, devices } from "@playwright/test";

/**
 * Mobile-focused checks for layout seams and critical routes.
 * Install browsers once: `npx playwright install`
 * Dev server: run `npm run dev` in another terminal, or rely on webServer below.
 */
export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "Mobile Chrome — Pixel 7",
      use: { ...devices["Pixel 7"] },
    },
    /**
     * Optional: install WebKit once (`npx playwright install webkit`) then add:
     * { name: "Mobile Safari — iPhone 14", use: { ...devices["iPhone 14"] } },
     */
  ],
  webServer: {
    command: "npm run dev",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
