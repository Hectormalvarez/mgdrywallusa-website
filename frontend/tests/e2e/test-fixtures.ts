import { test as base, expect, type Page } from "@playwright/test";

/**
 * Shared Playwright fixtures for the e2e suite.
 *
 * Import `test`/`expect` from this module instead of `@playwright/test` so
 * every test gets scenario-pinned routing — there is no server-global mock
 * state to leak between workers.
 *
 * The mock backend resolves the portfolio dataset per request from the
 * `X-E2E-Scenario` header. The `scenario` fixture injects that header onto:
 *   - document requests (page.goto) → forwarded to the mock by SSR via
 *     `@/lib/e2e-headers` in the server components,
 *   - Next.js RSC/prefetch requests (so client-side navigation renders the
 *     same dataset as a direct load),
 *   - direct browser→mock `/api/v1/pages/` fetches (Load More pagination).
 */
export type E2EScenario =
  | "default"
  | "listing"
  | "listing-page"
  | "empty-fields"
  | "pagination"
  | "tags"
  | "error";

export const E2E_SCENARIO_HEADER = "X-E2E-Scenario";

type TestFixtures = { scenario: E2EScenario };

export const test = base.extend<TestFixtures>({
  scenario: "default",

  page: async ({ page, scenario }, use) => {
    applyScenarioRoute(page, scenario);
    // Playwright fixture teardown — not a React hook, despite the name.
    // eslint-disable-next-line react-hooks/rules-of-hooks
    await use(page);
  },
});

export { expect };

/**
 * Override the scenario mid-test (for describes that mix datasets).
 *
 * Routes are matched in reverse registration order, so this handler runs
 * before the fixture's and wins — the last registration is authoritative.
 */
export async function setScenario(page: Page, name: E2EScenario) {
  await applyScenarioRoute(page, name);
}

function applyScenarioRoute(page: Page, scenario: E2EScenario) {
  return page.route("**/*", (route) => {
    const request = route.request();
    const isDocument = request.resourceType() === "document";
    const isRscPrefetch = request.headers()["rsc"] === "1";
    const isPagesApi = request.url().includes("/api/v1/pages/");

    if (isDocument || isRscPrefetch || isPagesApi) {
      return route.continue({ headers: { [E2E_SCENARIO_HEADER]: scenario } });
    }
    return route.continue();
  });
}

/**
 * Scoped text locator inside `<main>` — avoids strict-mode collisions with
 * chrome text (header/footer render the same words as page content).
 */
export function mainText(page: Page, text: string | RegExp) {
  return page.locator("main").getByText(text);
}
