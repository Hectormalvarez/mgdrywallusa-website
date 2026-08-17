import { test, expect } from "@playwright/test";

// ===========================================================================
// Visual Regression — Homepage Baseline
// ===========================================================================
test.describe("Homepage Visual Regression", () => {
  test("homepage matches baseline", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveScreenshot("homepage.png", {
      fullPage: true,
      animations: "disabled",
    });
  });
});
