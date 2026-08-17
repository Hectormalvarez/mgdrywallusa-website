import { test, expect } from "@playwright/test";

// ===========================================================================
// Portfolio — Rendering & Error States
// ===========================================================================
test.describe("Portfolio Section", () => {
  test("renders portfolio grid with items", async ({ page }) => {
    await page.goto("/");

    const section = page.locator("#portfolio");
    await expect(section.getByRole("heading", { name: /our work/i })).toBeVisible();

    // At least one portfolio card should appear after data loads
    const cards = section.locator("article");
    await expect(cards.first()).toBeVisible({ timeout: 5000 });
  });

  test("shows error message when portfolio API fails", async ({ page }) => {
    await page.route("**/api/v1/pages/**", async (route) => {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ error: "Server error" }),
      });
    });

    await page.goto("/");

    const section = page.locator("#portfolio");
    await expect(
      section.getByText(/failed to load portfolio/i)
    ).toBeVisible({ timeout: 5000 });
  });
});
