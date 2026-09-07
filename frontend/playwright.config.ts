import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.HOST_FRONTEND_PORT ?? 3000);
const MOCK_PORT = Number(process.env.MOCK_PORT ?? 8000);
const MOCK_API_BASE = `http://localhost:${MOCK_PORT}/api/v1`;

export default defineConfig({
  testDir: "./tests/e2e",
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  reporter: process.env.CI ? "github" : "list",

  updateSnapshots: "missing",

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

  webServer: [
    {
      command: `MOCK_PORT=${MOCK_PORT} node tests/e2e/mock-backend.mjs`,
      port: MOCK_PORT,
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
    },
    {
      // `next start` is incompatible with `output: "standalone"`, so run the
      // standalone server directly (mirrors Dockerfile.prod).
      command: `npm run build && cp -r .next/static .next/standalone/.next/static && cp -r public .next/standalone/public && PORT=${PORT} HOSTNAME=0.0.0.0 node .next/standalone/server.js`,
      port: PORT,
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
      env: {
        WAGTAIL_API_BASE_URL: MOCK_API_BASE,
        NEXT_PUBLIC_WAGTAIL_API_URL: `${MOCK_API_BASE}/pages/?type=portfolio.PortfolioItem&fields=*`,
      },
    },
  ],
});

