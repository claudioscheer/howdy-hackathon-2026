import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: "line",
  use: {
    baseURL: "http://127.0.0.1:3010",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command:
      "bash -c 'if [ ! -f .next/BUILD_ID ]; then pnpm next build; fi; exec pnpm next start --hostname 127.0.0.1 --port 3010'",
    url: "http://127.0.0.1:3010",
    timeout: 120_000,
    reuseExistingServer: false,
    env: {
      ...process.env,
      PRACTICE_LIVE_EVALUATOR: "0",
    },
  },
});
