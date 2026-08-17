import { test, expect } from "@playwright/test";

// ===========================================================================
// Visual Regression — Homepage Baseline
// ===========================================================================
test.describe("Homepage Visual Regression", () => {
  test("homepage matches baseline", async ({ page }) => {
    // Mock portfolio API so the screenshot shows items, not an error state
    await page.route("**/api/v1/pages/**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          meta: { total_count: 1 },
          items: [
            {
              id: 1,
              meta: { type: "portfolio.PortfolioItem", detail_url: "" },
              title: "Sample Project",
              description: "A sample drywall project.",
              scope: "Full Build",
              featured_image_url: null,
              finish_tags: ["Drywall", "Paint"],
              gallery_images: [],
            },
          ],
        }),
      });
    });

    await page.goto("/");
    await expect(page).toHaveScreenshot("homepage.png", {
      fullPage: true,
      animations: "disabled",
    });
  });
});
