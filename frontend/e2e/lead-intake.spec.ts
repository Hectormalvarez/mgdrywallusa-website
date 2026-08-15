import { test, expect } from "@playwright/test";
import path from "path";

const FIXTURES = path.resolve(__dirname, "fixtures");
const PHOTOS = [
  path.join(FIXTURES, "photo1.jpg"),
  path.join(FIXTURES, "photo2.png"),
  path.join(FIXTURES, "photo3.webp"),
];

// ---------------------------------------------------------------------------
// Helper — scroll to the form section and wait for it to be ready
// ---------------------------------------------------------------------------
async function goToForm(page: import("@playwright/test").Page) {
  await page.goto("/#lead-form");
  await page.waitForSelector("#lead-name");
}

/** Scope locators to the lead-form section to avoid collisions with other alerts on the page. */
function leadSection(page: import("@playwright/test").Page) {
  return page.locator("#lead-form");
}

// ---------------------------------------------------------------------------
// Helper — fill every required field with valid data
// ---------------------------------------------------------------------------
async function fillRequiredFields(page: import("@playwright/test").Page) {
  await page.getByLabel("Name").fill("Test User");
  await page.getByLabel("Phone").fill("5551234567");
  await page.getByLabel("Phone").blur();
  await page.getByLabel("Email").fill("test@example.com");
  await page.getByLabel("Project Tier").selectOption("repair");
}

// ===========================================================================
// Scenario 1 — Happy Path: multi-photo submission
// ===========================================================================
test.describe("Lead Intake — Happy Path", () => {
  test("submits lead with photos and shows success", async ({ page }) => {
    await goToForm(page);

    // Deterministic test name
    const testName = `test_e2e_${Date.now()}`;
    await page.getByLabel("Name").fill(testName);
    await page.getByLabel("Phone").fill("5551234567");
    await page.getByLabel("Phone").blur();
    await page.getByLabel("Email").fill("test@example.com");
    await page.getByLabel("Project Tier").selectOption("repair");

    // Attach 3 photos
    await page.getByLabel("Photos (up to 3)").setInputFiles(PHOTOS);

    // Intercept POST → respond 201
    let requestTime = 0;
    await page.route("**/api/v1/leads/**", async (route) => {
      const start = Date.now();
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({ status: "ok" }),
      });
      requestTime = Date.now() - start;
    });

    // Submit
    await page.getByRole("button", { name: "Submit" }).click();

    // Assert success state
    const status = page.getByRole("status");
    await expect(status).toBeVisible({ timeout: 5000 });
    await expect(status).toContainText("Thank you!");

    // Assert mock responded quickly (mock is instant, < 500ms)
    expect(requestTime).toBeLessThan(500);
  });
});

// ===========================================================================
// Scenario 2 — Pre-Flight & Inline Validation
// ===========================================================================
test.describe("Lead Intake — Pre-Flight Validation", () => {
  test("shows inline validation errors on blur and blocks bad files", async ({
    page,
  }) => {
    await goToForm(page);

    // --- Name: blur empty → error ---
    const nameInput = page.getByLabel("Name");
    await nameInput.click();
    await nameInput.blur();
    await expect(nameInput).toHaveAttribute("aria-invalid", "true");
    await expect(leadSection(page).getByText("Name is required")).toBeVisible();

    // --- Phone: type invalid → blur → error ---
    const phoneInput = page.getByLabel("Phone");
    await phoneInput.fill("555");
    await phoneInput.blur();
    await expect(phoneInput).toHaveAttribute("aria-invalid", "true");
    // Phone error: "Enter a valid US phone number (e.g. 555-123-4567)"
    await expect(
      leadSection(page).getByText("Enter a valid US phone")
    ).toBeVisible();

    // --- Phone: type valid → blur → formatted, no error ---
    await phoneInput.fill("5551234567");
    await phoneInput.blur();
    await expect(phoneInput).toHaveValue("555-123-4567");
    await expect(phoneInput).toHaveAttribute("aria-invalid", "false");

    // --- File count: attach 4 files → error ---
    const photosInput = page.getByLabel("Photos (up to 3)");
    await photosInput.setInputFiles([
      ...PHOTOS,
      path.join(FIXTURES, "photo1.jpg"),
    ]);
    await expect(page.getByText("No more than 3 files allowed")).toBeVisible();

    // --- Submit: validation prevents network call ---
    let requestSent = false;
    await page.route("**/api/v1/leads/**", async (route) => {
      requestSent = true;
      await route.abort();
    });

    await page.getByRole("button", { name: "Submit" }).click();
    await page.waitForTimeout(500);
    expect(requestSent).toBe(false);
  });
});

// ===========================================================================
// Scenario 3 — Honeypot
// ===========================================================================
test.describe("Lead Intake — Honeypot", () => {
  test("silently aborts when honeypot is filled", async ({ page }) => {
    await goToForm(page);

    let requestSent = false;
    await page.route("**/api/v1/leads/**", async (route) => {
      requestSent = true;
      await route.abort();
    });

    // Fill honeypot (hidden field)
    await page.locator('input[name="company"]').fill("bot-detected");

    // Fill all required fields with valid data
    await fillRequiredFields(page);

    // Submit
    await page.getByRole("button", { name: "Submit" }).click();
    await page.waitForTimeout(1000);

    // No network call should have been made
    expect(requestSent).toBe(false);

    // No success message should appear
    await expect(page.getByText("Thank you!")).not.toBeVisible();
  });
});
