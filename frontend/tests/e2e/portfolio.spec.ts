import { test, expect } from "@playwright/test";
import { setScenario } from "./helpers";

// ===========================================================================
// Portfolio — Rendering & Error States
// ===========================================================================
test.describe("Portfolio Section", () => {
  test("renders portfolio grid with items", async ({ page }) => {
    await setScenario(page, "listing");

    await page.goto("/");

    const section = page.locator("#portfolio");
    await expect(section.getByRole("heading", { name: /our work/i })).toBeVisible();

    const cards = section.locator("article");
    await expect(cards.first()).toBeVisible({ timeout: 5000 });

    await expect(cards.first().getByText("A sample")).toBeVisible();
    await expect(cards.first().getByText("Finished living room wall")).toBeVisible();
  });

  test("omits description and caption when fields are empty", async ({ page }) => {
    await setScenario(page, "empty-fields");

    await page.goto("/");
    const card = page.locator("#portfolio article").first();
    await expect(card.getByRole("heading")).toBeVisible({ timeout: 5000 });

    await expect(card.locator(".prose")).not.toBeVisible();
    await expect(card.locator("figcaption")).not.toBeVisible();
  });

  test("shows error message when portfolio API fails", async ({ page }) => {
    await setScenario(page, "error");

    await page.goto("/");

    const section = page.locator("#portfolio");
    await expect(
      section.getByText(/failed to load portfolio/i)
    ).toBeVisible({ timeout: 5000 });
  });

  test("renders View All link pointing to /portfolio", async ({ page }) => {
    await setScenario(page, "listing");

    await page.goto("/");
    const section = page.locator("#portfolio");
    await expect(section.locator("article").first()).toBeVisible({ timeout: 5000 });

    const viewAllLink = section.getByRole("link", { name: /view all projects/i });
    await expect(viewAllLink).toBeVisible();
    await expect(viewAllLink).toHaveAttribute("href", "/portfolio");
  });
});

// ===========================================================================
// Portfolio Listing Page (/portfolio)
// ===========================================================================
test.describe("Portfolio Listing Page", () => {
  test("renders listing page with portfolio items", async ({ page }) => {
    await setScenario(page, "listing-page");

    await page.goto("/portfolio");

    await expect(
      page.getByRole("heading", { name: /our work/i })
    ).toBeVisible();

    const cards = page.locator("article");
    await expect(cards.first()).toBeVisible({ timeout: 5000 });
    await expect(cards).toHaveCount(2);
  });

  test("does not render View All link on listing page", async ({ page }) => {
    await setScenario(page, "listing-page");

    await page.goto("/portfolio");
    await expect(page.locator("article").first()).toBeVisible({ timeout: 5000 });

    await expect(
      page.getByRole("link", { name: /view all projects/i })
    ).not.toBeVisible();
  });
});

// ===========================================================================
// Portfolio Detail Page (/portfolio/[slug])
// ===========================================================================
test.describe("Portfolio Detail Page", () => {
  test("renders detail page with full content", async ({ page }) => {
    await setScenario(page, "default");

    await page.goto("/portfolio/sample-project");

    await expect(page.getByRole("heading", { name: "Sample Project" })).toBeVisible();
    await expect(page.getByText("Residential")).toBeVisible();
    await expect(page.getByText("Level 5")).toBeVisible();
    await expect(page.getByText("Smooth")).toBeVisible();
    await expect(page.getByText("Finished wall")).toBeVisible();
    await expect(page.getByText("complete")).toBeVisible();
  });

  test("renders back link to /portfolio", async ({ page }) => {
    await setScenario(page, "default");

    await page.goto("/portfolio/sample-project");

    const backLink = page.getByRole("link", { name: /back to portfolio/i });
    await expect(backLink).toBeVisible();
    await expect(backLink).toHaveAttribute("href", "/portfolio");
  });

  test("navigates from listing page to detail page via card title", async ({ page }) => {
    await setScenario(page, "default");

    await page.goto("/portfolio");
    await expect(page.locator("article").first()).toBeVisible({ timeout: 5000 });

    await page.getByRole("link", { name: "Sample Project" }).click();
    await expect(page).toHaveURL(/\/portfolio\/sample-project/);
    await expect(page.getByRole("heading", { name: "Sample Project" })).toBeVisible();
  });

  test("shows not-found for unknown slug", async ({ page }) => {
    await setScenario(page, "default");

    await page.goto("/portfolio/nonexistent-project");
    await expect(page.getByText(/not found/i)).toBeVisible();
  });
});

// ===========================================================================
// Pagination — Load More
// ===========================================================================
test.describe("Pagination", () => {
  test("Load More fetches and appends additional items", async ({ page }) => {
    await setScenario(page, "pagination");

    await page.goto("/portfolio");

    const cards = page.locator("article");
    await expect(cards.first()).toBeVisible({ timeout: 5000 });
    await expect(cards).toHaveCount(6);

    await page.getByRole("button", { name: /load more/i }).click();

    await expect(cards).toHaveCount(7, { timeout: 5000 });
    await expect(page.getByRole("button", { name: /load more/i })).not.toBeVisible();
    await expect(page.getByText(/all projects loaded/i)).toBeVisible();
  });
});

// ===========================================================================
// Tag Filtering
// ===========================================================================
test.describe("Tag Filtering", () => {
  test("renders tag filter chips and filters items", async ({ page }) => {
    await setScenario(page, "tags");

    await page.goto("/");

    const section = page.locator("#portfolio");
    await expect(section.locator("article").first()).toBeVisible({ timeout: 5000 });

    const level5Chip = section.getByRole("checkbox", { name: "Level 5" });
    await expect(level5Chip).toBeVisible();

    await level5Chip.click();
    await expect(section.locator("article")).toHaveCount(1);
    await expect(section.getByText("Project A")).toBeVisible();
    await expect(section.getByText("Project B")).not.toBeVisible();

    await level5Chip.click();
    await expect(section.locator("article")).toHaveCount(3);
  });
});
