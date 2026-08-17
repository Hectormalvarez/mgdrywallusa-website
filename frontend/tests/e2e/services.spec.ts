import { test, expect } from "@playwright/test";

// ===========================================================================
// Services Section
// ===========================================================================
test.describe("Services Section", () => {
  test("renders default services on desktop", async ({ page }) => {
    await page.goto("/");

    const section = page.locator("#services");
    await expect(
      section.getByRole("heading", { name: /our services/i })
    ).toBeVisible();

    // Default services
    await expect(section.getByText("Level 5 Finishing")).toBeVisible();
    await expect(section.getByText("Drywall Repair & Patching")).toBeVisible();
    await expect(section.getByText("ADU & Renovation Framing")).toBeVisible();
  });

  test("renders services on mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");

    const section = page.locator("#services");
    await expect(
      section.getByRole("heading", { name: /our services/i })
    ).toBeVisible();
    await expect(section.getByText("Level 5 Finishing")).toBeVisible();
  });
});
