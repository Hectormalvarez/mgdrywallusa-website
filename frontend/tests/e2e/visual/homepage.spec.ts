import { expect, setScenario, test } from "../test-fixtures";

// ===========================================================================
// Visual Regression — Homepage Baseline
// ===========================================================================
test.describe("Homepage Visual Regression", () => {
  test("homepage matches baseline", async ({ page }) => {
    await setScenario(page, "listing");

    await page.goto("/");
    await expect(page).toHaveScreenshot("homepage.png", {
      fullPage: true,
      animations: "disabled",
      maxDiffPixelRatio: 0.01,
    });
  });
});
