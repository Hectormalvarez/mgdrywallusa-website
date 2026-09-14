/**
 * E2E-only server helper: forwards the Playwright scenario header to the mock
 * backend on SSR fetches.
 *
 * In e2e runs, the Playwright fixture injects `X-E2E-Scenario` onto document
 * requests; server components read it here and pass it into the API fetch so
 * server-rendered portfolio data honors the test's scenario (there is no
 * server-global mock state). In production no such header is ever sent and
 * this returns `{}` — a no-op.
 */
import { headers } from "next/headers";

export const E2E_SCENARIO_HEADER = "X-E2E-Scenario";

export async function e2eScenarioHeaders(): Promise<Record<string, string>> {
  const scenario = (await headers()).get(E2E_SCENARIO_HEADER);
  return scenario ? { [E2E_SCENARIO_HEADER]: scenario } : {};
}
