import { test, expect } from "@playwright/test";

// ===========================================================================
// Desktop Navigation — Anchor Links & Skip Link
// ===========================================================================
test.describe("Desktop Navigation", () => {
  test.use({ viewport: { width: 1280, height: 720 } });

  test("Services nav link points to #services", async ({ page }) => {
    await page.goto("/");
    const servicesLink = page
      .locator("header")
      .getByRole("link", { name: "Services" });
    await expect(servicesLink).toHaveAttribute("href", "#services");
  });

  test("Our Work nav link points to #portfolio", async ({ page }) => {
    await page.goto("/");
    const workLink = page
      .locator("header")
      .getByRole("link", { name: "Our Work" });
    await expect(workLink).toHaveAttribute("href", "#portfolio");
  });

  test("skip-to-content link is focusable", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("Tab");
    const skipLink = page.getByRole("link", { name: /skip to content/i });
    await expect(skipLink).toBeFocused();
  });
});
