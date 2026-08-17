import { test, expect } from "@playwright/test";

// Force mobile viewport for all tests in this file so they pass on every project.
test.use({ viewport: { width: 375, height: 667 } });

// Stable locator — the hamburger's aria-controls is always "mobile-menu" regardless of state.
function hamburgerButton(page: import("@playwright/test").Page) {
  return page.locator('button[aria-controls="mobile-menu"]');
}

// ===========================================================================
// Mobile Drawer — Toggle, Focus Trap & Escape
// ===========================================================================
test.describe("Mobile Drawer — Keyboard & Focus", () => {
  test("opens drawer, traps focus, and closes on Escape", async ({ page }) => {
    await page.goto("/");

    const hamburger = hamburgerButton(page);
    await expect(hamburger).toBeVisible();

    // Open drawer
    await hamburger.click();

    // Drawer dialog should be visible
    const drawer = page.getByRole("dialog", { name: "Main navigation" });
    await expect(drawer).toBeVisible();

    // aria-expanded should be true on the toggle
    await expect(hamburger).toHaveAttribute("aria-expanded", "true");

    // First focusable element inside drawer should receive focus
    const firstLink = drawer.getByRole("link", { name: "Services" });
    await expect(firstLink).toBeFocused();

    // Tab through several elements — focus must stay inside the dialog
    for (let i = 0; i < 6; i++) {
      await page.keyboard.press("Tab");
    }
    const focusedInDrawer = await page.evaluate(() => {
      const el = document.activeElement;
      return !!el?.closest('[role="dialog"]');
    });
    expect(focusedInDrawer).toBe(true);

    // Escape closes drawer
    await page.keyboard.press("Escape");

    // Drawer is hidden via translate-x-full (off-screen), so check aria-modal
    await expect(drawer).toHaveAttribute("aria-modal", "false");

    // Focus returns to hamburger
    await expect(hamburger).toBeFocused();
  });
});

// ===========================================================================
// Mobile Drawer — Touch Targets & Scroll Lock
// ===========================================================================
test.describe("Mobile Drawer — Touch & Scroll", () => {
  test("has 44×44px touch targets and locks body scroll", async ({ page }) => {
    await page.goto("/");

    const hamburger = hamburgerButton(page);
    await hamburger.click();

    const drawer = page.getByRole("dialog", { name: "Main navigation" });
    await expect(drawer).toBeVisible();

    // Body scroll should be locked
    const overflowAfterOpen = await page.evaluate(
      () => document.documentElement.style.overflow
    );
    expect(overflowAfterOpen).toBe("hidden");

    // Close button inside drawer should meet 44×44px touch target
    const closeButton = drawer.getByRole("button", { name: "Close menu" });
    await expect(closeButton).toBeVisible();
    const box = await closeButton.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThanOrEqual(44);
    expect(box!.height).toBeGreaterThanOrEqual(44);

    // Close drawer via close button
    await closeButton.click();

    // Scroll lock removed
    const overflowAfterClose = await page.evaluate(
      () => document.documentElement.style.overflow
    );
    expect(overflowAfterClose).toBe("");
  });
});
