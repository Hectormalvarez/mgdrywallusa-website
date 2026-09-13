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

// ===========================================================================
// Cross-page Navigation — returning home from a sub-route
// ===========================================================================
test.describe("Cross-page Navigation", () => {
  test.use({ viewport: { width: 1280, height: 720 } });

  test("brand logo returns to the home page from /portfolio", async ({
    page,
  }) => {
    await page.goto("/portfolio");

    const logo = page
      .locator("header")
      .getByRole("link", { name: "MG Drywall USA" });
    await logo.click();

    await expect(page).toHaveURL(/\/$/);
  });

  test("phone number is visible in the header from /portfolio", async ({
    page,
  }) => {
    await page.goto("/portfolio");

    const phone = page
      .locator("header")
      .getByRole("link", { name: "+1-555-DRYWALL" });
    await expect(phone).toBeVisible();
    await expect(phone).toHaveAttribute("href", "tel:+1-555-DRYWALL");
  });

  test("header nav anchor returns to the home page section from /portfolio", async ({
    page,
  }) => {
    await page.goto("/portfolio");

    const services = page
      .locator("header")
      .getByRole("link", { name: "Services" });
    await expect(services).toHaveAttribute("href", "/#services");

    await services.click();

    await expect(page).toHaveURL(/\/#services$/);
  });
});

// ===========================================================================
// Conversion & Orientation — quote paths and escape hatches (US-001 / US-003)
// ===========================================================================
test.describe("Conversion & Orientation", () => {
  test.use({ viewport: { width: 1280, height: 720 } });

  test("desktop quote CTA reaches the lead form from /portfolio", async ({
    page,
  }) => {
    await page.goto("/portfolio");

    const cta = page
      .locator("header")
      .getByRole("link", { name: "Get a Free Quote" });
    await expect(cta).toHaveAttribute("href", "/#lead-form");
    await cta.click();

    await expect(page).toHaveURL(/\/#lead-form$/);
    await expect(page.locator("#lead-form")).toBeInViewport();
  });

  test("quote CTA band is reachable from a project detail page", async ({
    page,
  }) => {
    await page.goto("/portfolio/sample-project");

    const cta = page
      .locator("main")
      .getByRole("link", { name: "Get a Free Quote" });
    await expect(cta).toHaveAttribute("href", "/#lead-form");
    await cta.click();

    await expect(page).toHaveURL(/\/#lead-form$/);
  });

  test("project detail page offers Home and Portfolio paths", async ({
    page,
  }) => {
    await page.goto("/portfolio/sample-project");

    await expect(page.getByRole("link", { name: "Home", exact: true })).toHaveAttribute(
      "href",
      "/"
    );
    await expect(
      page.getByRole("link", { name: /back to portfolio/i })
    ).toHaveAttribute("href", "/portfolio");
  });

  test("detail-page 404 keeps an escape hatch", async ({ page }) => {
    await page.goto("/portfolio/nonexistent-project");

    await expect(
      page.locator("main").getByRole("link", { name: /get a free quote/i })
    ).toHaveAttribute("href", "/#lead-form");
    await expect(page.getByRole("link", { name: "Home", exact: true })).toHaveAttribute(
      "href",
      "/"
    );
  });

  test("global 404 offers home and portfolio paths", async ({ page }) => {
    await page.goto("/this-page-does-not-exist");

    await expect(
      page.getByRole("link", { name: /go back home/i })
    ).toHaveAttribute("href", "/");
    await expect(
      page.getByRole("link", { name: /browse our work/i })
    ).toHaveAttribute("href", "/portfolio");
  });
});
