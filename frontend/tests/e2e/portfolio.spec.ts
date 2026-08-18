import { test, expect } from "@playwright/test";

// ===========================================================================
// Portfolio — Rendering & Error States
// ===========================================================================
test.describe("Portfolio Section", () => {
  test("renders portfolio grid with items", async ({ page }) => {
    // Mock the portfolio API so cards render without a backend
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
              description: "<p>A sample <strong>drywall</strong> project.</p>",
              scope: "Full Build",
              featured_image_url: "/_next/image?url=/hero.jpg&w=1280",
              finish_tags: ["Drywall", "Paint"],
              gallery_images: [
                {
                  url: "/_next/image?url=/gallery.jpg&w=800",
                  width: 800,
                  height: 600,
                  alt: "Gallery photo",
                  caption: "Finished living room wall",
                },
              ],
            },
          ],
        }),
      });
    });

    await page.goto("/");

    const section = page.locator("#portfolio");
    await expect(section.getByRole("heading", { name: /our work/i })).toBeVisible();

    // At least one portfolio card should appear after data loads
    const cards = section.locator("article");
    await expect(cards.first()).toBeVisible({ timeout: 5000 });

    // Description should be visible in the card
    await expect(cards.first().getByText("A sample")).toBeVisible();

    // Caption should be visible (not sr-only)
    await expect(cards.first().getByText("Finished living room wall")).toBeVisible();
  });

  test("omits description and caption when fields are empty", async ({ page }) => {
    await page.route("**/api/v1/pages/**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          meta: { total_count: 1 },
          items: [
            {
              id: 2,
              meta: { type: "portfolio.PortfolioItem", detail_url: "" },
              title: "No Description Project",
              description: "",
              scope: "residential",
              featured_image_url: null,
              finish_tags: [],
              gallery_images: [
                {
                  url: "/_next/image?url=/gallery.jpg&w=800",
                  width: 800,
                  height: 600,
                  alt: "",
                  caption: "",
                },
              ],
            },
          ],
        }),
      });
    });

    await page.goto("/");
    const card = page.locator("#portfolio article").first();
    await expect(card.getByRole("heading")).toBeVisible({ timeout: 5000 });

    // No description prose container
    await expect(card.locator(".prose")).not.toBeVisible();
    // No figcaption
    await expect(card.locator("figcaption")).not.toBeVisible();
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
