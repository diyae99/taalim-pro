import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/load-registration",
  timeout: 1_800_000,
  fullyParallel: false,
  workers: 1,
  reporter: [["line"], ["html", { outputFolder: "reports/artifacts/playwright-report", open: "never" }]],
  use: {
    baseURL: process.env.TEST_BASE_URL ?? "http://127.0.0.1:4173",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    video: "retain-on-failure",
  },
  outputDir: "reports/artifacts/test-results",
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
