import { test, expect } from "@playwright/test";

// ===========================================================================
// Footer Links & 404 Page
// ===========================================================================
test.describe("Footer", () => {
  test("quick links navigate to correct sections", async ({ page }) => {
    await page.goto("/");

    const footer = page.locator("footer");
    const servicesLink = footer.getByRole("link", { name: "Services" });
    await servicesLink.click();

    await expect(page.locator("#services")).toBeInViewport();
  });

  test("social links have external security attributes", async ({ page }) => {
    await page.goto("/");

    const footer = page.locator("footer");
    const socialLinks = footer.locator('a[target="_blank"]');
    const count = await socialLinks.count();

    for (let i = 0; i < count; i++) {
      const link = socialLinks.nth(i);
      await expect(link).toHaveAttribute("rel", "noopener noreferrer");
    }
  });
});

test.describe("404 Page", () => {
  test("displays 404 page for unknown routes", async ({ page }) => {
    await page.goto("/non-existent-page-12345");

    // Next.js renders a 404 page (custom or default)
    await expect(page.getByText(/404/i).first()).toBeVisible();
  });
});