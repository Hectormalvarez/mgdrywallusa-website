import { expect, type Page } from "@playwright/test";

import { setScenario, test } from "./test-fixtures";

/**
 * Regression test for the historical flake: the mock backend used to keep a
 * server-global scenario, so parallel workers flipping the scenario could
 * change the dataset under other specs. The scenario now rides a per-request
 * header — two concurrent contexts with different scenarios must see their
 * own datasets simultaneously.
 */
test("concurrent contexts see only their own scenario", async ({ browser }) => {
  const listingContext = await browser.newContext();
  const defaultContext = await browser.newContext();

  async function pinScenario(page: Page, scenario: string) {
    await setScenario(page, scenario as Parameters<typeof setScenario>[1]);
  }

  const listingPage = await listingContext.newPage();
  const defaultPage = await defaultContext.newPage();
  await pinScenario(listingPage, "listing");
  await pinScenario(defaultPage, "default");

  // Navigate both contexts at the same time — with a server-global scenario
  // this race produced cross-contaminated renders.
  await Promise.all([
    listingPage.goto("/"),
    defaultPage.goto("/"),
  ]);

  // "listing" dataset: "A sample drywall project".
  // "default" dataset: "A complete drywall project".
  const listingSection = listingPage.locator("#portfolio");
  const defaultSection = defaultPage.locator("#portfolio");
  await expect(listingSection.locator("article").first()).toBeVisible({
    timeout: 10_000,
  });
  await expect(defaultSection.locator("article").first()).toBeVisible({
    timeout: 10_000,
  });
  await expect(
    listingSection.getByText("A sample drywall project").first(),
  ).toBeVisible();
  await expect(
    listingSection.getByText("A complete drywall project"),
  ).toHaveCount(0);
  await expect(
    defaultSection.getByText("A complete drywall project").first(),
  ).toBeVisible();
  await expect(
    defaultSection.getByText("A sample drywall project"),
  ).toHaveCount(0);

  await listingContext.close();
  await defaultContext.close();
});
