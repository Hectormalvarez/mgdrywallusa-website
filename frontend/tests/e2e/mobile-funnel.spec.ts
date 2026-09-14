import { test, expect, type Page } from "@playwright/test";

/**
 * US-004 — the visitor funnel on a phone.
 *
 * Runs under the "Mobile Chrome" project (375×812, touch). Every step uses
 * real taps on visible controls; assertions check reachability, tap-target
 * sizes, horizontal overflow, and form submission under throttling.
 */

const MOBILE = { viewport: { width: 375, height: 812 } };

async function expectNoHorizontalOverflow(page: Page, label: string) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow, `${label}: horizontal overflow of ${overflow}px`).toBeLessThanOrEqual(1);
}

test.describe("Mobile funnel — orientation", () => {
  test.use(MOBILE);

  test("no horizontal scrolling on the funnel pages", async ({ page }) => {
    await page.goto("/");
    await expectNoHorizontalOverflow(page, "homepage");

    await page.goto("/portfolio");
    await expect(page.locator("article").first()).toBeVisible({ timeout: 10_000 });
    await expectNoHorizontalOverflow(page, "portfolio listing");

    const detailHref = await page
      .locator('a[href^="/portfolio/"]')
      .first()
      .getAttribute("href");
    await page.goto(detailHref!);
    await expect(page.locator("main")).toBeVisible();
    await expectNoHorizontalOverflow(page, "project detail");
  });
});

test.describe("Mobile funnel — the full walk", () => {
  test.use(MOBILE);

  test("land → work → lightbox → listing → detail → quote form, taps only", async ({
    page,
  }) => {
    // 1. Land on the homepage.
    await page.goto("/");

    // 2. Open the drawer and tap "Our Work" — jumps to the section.
    await page.getByRole("button", { name: /open menu/i }).tap();
    const drawer = page.getByRole("dialog", { name: /main navigation/i });
    await drawer.getByRole("link", { name: /our work/i }).tap();
    await expect(page.locator("#portfolio")).toBeInViewport();

    // 3. Tap the card's featured image — the lightbox opens.
    const section = page.locator("#portfolio");
    await expect(section.locator("article").first()).toBeVisible({ timeout: 10_000 });
    await section
      .getByRole("button", { name: /view gallery image 1/i })
      .first()
      .tap();
    const lightbox = page.getByRole("dialog", { name: /image lightbox/i });
    await expect(lightbox).toBeVisible();

    // 4. Advance one photo via the next control, then close.
    await lightbox.getByRole("button", { name: /next image/i }).tap();
    await expect(lightbox).toBeVisible();
    await lightbox.getByRole("button", { name: /close/i }).tap();
    await expect(lightbox).not.toBeVisible();

    // 5. "View all projects" → the listing page.
    await section.getByRole("link", { name: /view all projects/i }).tap();
    await expect(page).toHaveURL(/\/portfolio$/);
    await expect(page.locator("article").first()).toBeVisible({ timeout: 10_000 });

    // 6. Into a project detail page.
    await page.locator('a[href^="/portfolio/"]').first().tap();
    await expect(page.locator("main")).toContainText(/back to portfolio/i);

    // 7. One tap to the quote form — and the form must be in view.
    const cta = page.locator("main").getByRole("link", { name: /get a free quote/i });
    await cta.tap();
    await expect(page).toHaveURL(/\/#lead-form$/);
    await expect(page.locator("#lead-form form")).toBeInViewport();
  });
});

test.describe("Mobile funnel — tap targets", () => {
  test.use(MOBILE);

  test("primary controls are at least 44px tall", async ({ page }) => {
    await page.goto("/");

    // Hamburger and drawer CTA.
    const hamburger = page.getByRole("button", { name: /open menu/i });
    await expect(hamburger).toBeVisible();
    const hamburgerBox = await hamburger.boundingBox();
    expect(hamburgerBox?.height).toBeGreaterThanOrEqual(44);

    await hamburger.tap();
    const drawer = page.getByRole("dialog", { name: /main navigation/i });
    const quote = drawer.getByRole("link", { name: /get a free quote/i });
    const quoteBox = await quote.boundingBox();
    expect(quoteBox?.height).toBeGreaterThanOrEqual(44);

    // Lightbox arrows on an open gallery.
    await page.keyboard.press("Escape");
    const section = page.locator("#portfolio");
    await section.scrollIntoViewIfNeeded();
    await section
      .getByRole("button", { name: /view gallery image 1/i })
      .first()
      .tap();
    const lightbox = page.getByRole("dialog", { name: /image lightbox/i });
    await expect(lightbox).toBeVisible();
    const next = lightbox.getByRole("button", { name: /next image/i });
    const nextBox = await next.boundingBox();
    expect(nextBox?.height).toBeGreaterThanOrEqual(44);
  });
});

test.describe("Mobile funnel — throttled submission", () => {
  test.use(MOBILE);

  test("quote form submits successfully on a slow connection", async ({ page }) => {
    // Emulate a throttled link: delay the lead POST by ~1.2s.
    await page.route("**/api/v1/leads/", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1200));
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({ id: 1 }),
      });
    });

    await page.goto("/#lead-form");
    await expect(page.locator("#lead-form form")).toBeVisible({ timeout: 10_000 });

    await page.getByLabel("Name").fill("Mobile Tester");
    await page.getByLabel("Phone").fill("5551234567");
    await page.getByLabel("Phone").blur();
    await page.getByLabel("Email").fill("mobile@example.com");
    await page.getByLabel("Project Tier").selectOption("repair");
    await page.getByRole("button", { name: "Submit" }).tap();

    // Success state appears once the throttled response lands.
    await expect(page.getByText(/thank you|received|success/i).first()).toBeVisible({
      timeout: 10_000,
    });
  });
});
