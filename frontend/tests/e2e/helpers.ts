import type { Page } from "@playwright/test";

const MOCK_PORT = Number(process.env.MOCK_PORT ?? 8000);
const MOCK_URL = `http://localhost:${MOCK_PORT}`;

/** Switch the mock Wagtail backend's portfolio dataset. */
export async function setScenario(page: Page, name: string) {
  await page.request.post(`${MOCK_URL}/__e2e__/scenario`, { data: { name } });
}
