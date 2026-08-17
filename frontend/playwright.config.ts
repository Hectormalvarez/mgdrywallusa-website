import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.HOST_FRONTEND_PORT ?? 3000);

export default defineConfig({
  testDir: "./tests/e2e",
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  reporter: process.env.CI ? "github" : "list",

  use: {
    baseURL: process.env.FRONTEND_URL ?? `http://localhost:${PORT}`,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },

  snapshotPathTemplate: "{testDir}/__screenshots__/{testFilePath}/{arg}/{projectName}{ext}",

  projects: [
    {
      name: "Desktop Chrome",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1280, height: 720 },
      },
    },
    {
      name: "Mobile Safari",
      use: devices["iPhone 15"],
    },
  ],

  webServer: {
    command: `npm run build && npx next start -p ${PORT} -H 0.0.0.0`,
    port: PORT,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
