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
              slug: "sample-project",
              title: "Sample Project",
              description: "<p>A sample <strong>drywall</strong> project.</p>",
              scope: "residential",
              scope_label: "Residential",
              finish_tags: ["Drywall", "Paint"],
              featured_image: {
                thumbnail: "/media/fill-150x150/hero.webp",
                card: "/media/fill-800x600/hero.webp",
                full: "/media/max-1600x1200/hero.webp",
                alt: "Sample Project",
              },
              gallery_images: [
                {
                  id: 1,
                  image: {
                    thumbnail: "/media/fill-150x150/gallery.webp",
                    card: "/media/fill-800x600/gallery.webp",
                    full: "/media/max-1600x1200/gallery.webp",
                    alt: "Gallery photo",
                  },
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
              slug: "no-description-project",
              title: "No Description Project",
              description: "",
              scope: "residential",
              scope_label: "Residential",
              finish_tags: [],
              featured_image: null,
              gallery_images: [
                {
                  id: 2,
                  image: {
                    thumbnail: "/media/fill-150x150/gallery.webp",
                    card: "/media/fill-800x600/gallery.webp",
                    full: "/media/max-1600x1200/gallery.webp",
                    alt: "",
                  },
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

  test("renders View All link pointing to /portfolio", async ({ page }) => {
    await page.route("**/api/v1/pages/**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          meta: { total_count: 1 },
          items: [
            {
              id: 1,
              slug: "sample-project",
              title: "Sample Project",
              description: "<p>A project.</p>",
              scope: "residential",
              scope_label: "Residential",
              finish_tags: [],
              featured_image: null,
              gallery_images: [],
            },
          ],
        }),
      });
    });

    await page.goto("/");
    const section = page.locator("#portfolio");
    await expect(section.locator("article").first()).toBeVisible({ timeout: 5000 });

    const viewAllLink = section.getByRole("link", { name: /view all projects/i });
    await expect(viewAllLink).toBeVisible();
    await expect(viewAllLink).toHaveAttribute("href", "/portfolio");
  });
});

// ===========================================================================
// Portfolio Listing Page (/portfolio)
// ===========================================================================
test.describe("Portfolio Listing Page", () => {
  const mockItems = {
    meta: { total_count: 2 },
    items: [
      {
        id: 1,
        slug: "residential-project",
        title: "Residential Project",
        description: "<p>A home remodel.</p>",
        scope: "residential",
        scope_label: "Residential",
        finish_tags: ["Level 5"],
        featured_image: {
          thumbnail: "/media/thumb1.webp",
          card: "/media/card1.webp",
          full: "/media/full1.webp",
          alt: "Residential Project",
        },
        gallery_images: [],
      },
      {
        id: 2,
        slug: "commercial-project",
        title: "Commercial Project",
        description: "<p>An office buildout.</p>",
        scope: "commercial",
        scope_label: "Commercial",
        finish_tags: [],
        featured_image: null,
        gallery_images: [],
      },
    ],
  };

  test("renders listing page with portfolio items", async ({ page }) => {
    await page.route("**/api/v1/pages/**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockItems),
      });
    });

    await page.goto("/portfolio");

    await expect(
      page.getByRole("heading", { name: /our work/i })
    ).toBeVisible();

    const cards = page.locator("article");
    await expect(cards.first()).toBeVisible({ timeout: 5000 });
    await expect(cards).toHaveCount(2);
  });

  test("does not render View All link on listing page", async ({ page }) => {
    await page.route("**/api/v1/pages/**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockItems),
      });
    });

    await page.goto("/portfolio");
    await expect(page.locator("article").first()).toBeVisible({ timeout: 5000 });

    await expect(
      page.getByRole("link", { name: /view all projects/i })
    ).not.toBeVisible();
  });
});

// ===========================================================================
// Portfolio Detail Page (/portfolio/[slug])
// ===========================================================================
test.describe("Portfolio Detail Page", () => {
  const mockItem = {
    id: 1,
    slug: "sample-project",
    title: "Sample Project",
    description: "<p>A <strong>complete</strong> drywall project.</p>",
    scope: "residential",
    scope_label: "Residential",
    finish_tags: ["Level 5", "Smooth"],
    featured_image: {
      thumbnail: "/media/thumb.webp",
      card: "/media/card.webp",
      full: "/media/full.webp",
      alt: "Sample Project",
    },
    gallery_images: [
      {
        id: 1,
        image: {
          thumbnail: "/media/g-thumb.webp",
          card: "/media/g-card.webp",
          full: "/media/g-full.webp",
          alt: "Gallery photo",
        },
        caption: "Finished wall",
      },
    ],
  };

  test("renders detail page with full content", async ({ page }) => {
    await page.route("**/api/v1/pages/**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ meta: { total_count: 1 }, items: [mockItem] }),
      });
    });

    await page.goto("/portfolio/sample-project");

    await expect(page.getByRole("heading", { name: "Sample Project" })).toBeVisible();
    await expect(page.getByText("Residential")).toBeVisible();
    await expect(page.getByText("Level 5")).toBeVisible();
    await expect(page.getByText("Smooth")).toBeVisible();
    await expect(page.getByText("Finished wall")).toBeVisible();
    await expect(page.getByText("complete")).toBeVisible();
  });

  test("renders back link to /portfolio", async ({ page }) => {
    await page.route("**/api/v1/pages/**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ meta: { total_count: 1 }, items: [mockItem] }),
      });
    });

    await page.goto("/portfolio/sample-project");

    const backLink = page.getByRole("link", { name: /back to portfolio/i });
    await expect(backLink).toBeVisible();
    await expect(backLink).toHaveAttribute("href", "/portfolio");
  });

  test("navigates from listing page to detail page via card title", async ({ page }) => {
    const mockItems = {
      meta: { total_count: 1 },
      items: [mockItem],
    };

    await page.route("**/api/v1/pages/**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockItems),
      });
    });

    await page.goto("/portfolio");
    await expect(page.locator("article").first()).toBeVisible({ timeout: 5000 });

    // Click the card title link
    await page.getByRole("link", { name: "Sample Project" }).click();
    await expect(page).toHaveURL(/\/portfolio\/sample-project/);
    await expect(page.getByRole("heading", { name: "Sample Project" })).toBeVisible();
  });

  test("shows not-found for unknown slug", async ({ page }) => {
    await page.route("**/api/v1/pages/**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ meta: { total_count: 0 }, items: [] }),
      });
    });

    await page.goto("/portfolio/nonexistent-project");
    await expect(page.getByText(/not found/i)).toBeVisible();
  });
});

// ===========================================================================
// Pagination — Load More
// ===========================================================================
test.describe("Pagination", () => {
  const allItems = [
    {
      id: 1, slug: "project-a", title: "Project A",
      description: "", scope: "residential", scope_label: "Residential",
      finish_tags: [], featured_image: null, gallery_images: [],
    },
    {
      id: 2, slug: "project-b", title: "Project B",
      description: "", scope: "commercial", scope_label: "Commercial",
      finish_tags: [], featured_image: null, gallery_images: [],
    },
    {
      id: 3, slug: "project-c", title: "Project C",
      description: "", scope: "residential", scope_label: "Residential",
      finish_tags: [], featured_image: null, gallery_images: [],
    },
  ];

  test("Load More fetches and appends additional items", async ({ page }) => {
    await page.route("**/api/v1/pages/**", async (route) => {
      const url = new URL(route.request().url());
      const offset = Number(url.searchParams.get("offset") || "0");
      const limit = 2;
      const pageItems = allItems.slice(offset, offset + limit);
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ meta: { total_count: allItems.length }, items: pageItems }),
      });
    });

    await page.goto("/portfolio");

    // Initial render: 2 items
    const cards = page.locator("article");
    await expect(cards.first()).toBeVisible({ timeout: 5000 });
    await expect(cards).toHaveCount(2);

    // Click Load More
    await page.getByRole("button", { name: /load more/i }).click();

    // Now 3 items, button gone
    await expect(cards).toHaveCount(3, { timeout: 5000 });
    await expect(page.getByRole("button", { name: /load more/i })).not.toBeVisible();
    await expect(page.getByText(/all projects loaded/i)).toBeVisible();
  });
});
