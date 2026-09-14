# Active Context — MGDrywall USA

*Updated: 2026-09-13. Read this file first when resuming.*

## Current focus

**US-004 automated mobile walkthrough DONE (2026-09-13)** — funnel proven on emulated Mobile Chrome (375×812, touch); the owner completed the on-device pass ("tested on my phone and it looks good") — US-004 Done. Next: **US-005** (owner loop walkthrough).

## Shipped: US-001 + US-003 (sprint "Flow Sign-off #1", `tasks/sprint.md`)

1. **Desktop header CTA** — `Get a Free Quote` `Button` in the desktop nav (`hidden md:flex` parent), `resolveNavHref("#lead-form", pathname)`; drawer CTA untouched.
2. **Detail-page CTA band** after the article (`/#lead-form`), on **both** found and not-found variants.
3. **`scroll-mt-16`** on the `#lead-form` section (`src/app/page.tsx`) — anchor landings clear the 64px sticky header (verified in e2e with `toBeInViewport`; banner-enabled case safe because the banner scrolls away).
4. **Detail-page nav row** — `Home · ← Back to Portfolio` on both variants.
5. **Global 404** — `Browse our work` (`/portfolio`) beside `Go back home`.
6. **E2E** — 5 new tests in `navigation.spec.ts` (Conversion & Orientation describe); scope CTA queries to `page.locator("main")` on detail pages to avoid strict-mode collisions with the footer CTA.

**Gates at close:** jest 21 suites / 244 tests, coverage 96.74/86.73/95.03/98.68; tsc + eslint clean; e2e navigation 10/10 (Desktop Chrome, free ports).

## Shipped: US-002 (sprint "Sitewide Phone")

1. **Desktop header phone link** — `tel:` link (phone SVG + number) before the quote CTA in the desktop nav, `hidden md:inline-flex` (drawer owns mobile), rendered only when `settings.phone_number` is set.
2. **Empty-number guards** — drawer phone link and Footer phone link no longer render a dead `tel:` link when the setting is empty (AC3 was violated on both before this sprint).
3. **E2E** — phone visible with correct `tel:` href from `/portfolio` (navigation.spec, Cross-page describe).

**Gates at close:** jest 21 suites / 248 tests, coverage 96.74/86.84/95.03/98.68; tsc + eslint clean; e2e navigation 11/11 (Desktop Chrome, free ports). QA residual deferred to US-004: 768px visual crowding check.

## Shipped: US-006 (sprint "Settings Live Preview")

1. **`SettingsPreview` model** — transient token-gated payload store, 24h TTL pruned on create; never touches live settings (`site_settings/migrations/0003`).
2. **POST `/admin/settings-preview/`** (admin-authed via `register_admin_urls`) — binds the *unsaved* edit-form values (incl. in-memory nav children via ClusterForm `save(commit=False)`) to a transient SiteSettings, serializes through the same `SiteSettingsSerializer` (AC4 parity), returns the preview URL. **URL base is `FRONTEND_URL`** — `WAGTAIL_PREVIEW_URL` already ends in `/api/preview` (live smoke caught the doubling).
3. **GET `/api/v1/settings-preview/<token>/`** — public, token-gated, `settings_preview` throttle scope; 404 on unknown/expired.
4. **Admin "Preview site" button** — JS hook on the settings edit form; serializes the live form, opens the draft URL; failure shows an inline message, form untouched (AC3).
5. **`/api/preview?settings_token=`** route branch — Draft Mode + cookie + redirect `/`.
6. **`@/lib/settings.server.ts` `getSiteSettings()`** — reads Draft Mode + cookie, delegates to `fetchSiteSettings(isDraft, token)`. `@/lib/api` stays client-safe (LeadIntakeForm imports it — next/headers there broke the build; found live).
7. **Live smoke (proof)**: mint token → `/api/preview` 307 + cookies → homepage renders `PREVIEW SMOKE NAME`/banner/phone; **no-cookie homepage and DB unchanged**; `get_nav` now iterates the cluster manager so unsaved nav children serialize.

**Gates at close:** backend pytest 132 (incl. roundtrip + no-side-effect + expiry tests); jest 21 suites / 253 tests, coverage 96.79/86.98/95.03/98.7; tsc + eslint clean; live e2e smoke PASS. Also fixed a latent test bug: `process.env.X = undefined` coerces to the string "undefined" (poisoned later tests).

## Shipped: US-004 (sprint "Funnel on a Phone" — automated leg)

1. **`Mobile Chrome` Playwright project** added (Pixel 7 device, 375×812 viewport) — replaces the environmentally-broken WebKit project for mobile coverage.
2. **`tests/e2e/mobile-funnel.spec.ts`** — 4 tests: no horizontal overflow on the 3 funnel pages; a tap-only walk (home → drawer → Our Work → lightbox next/close → View all → listing → detail → quote form `toBeInViewport`); tap-target heights (hamburger 44, drawer CTA 48, lightbox arrow ≥44); lead submit succeeds with a 1.2s-throttled POST.
3. **Result: 4/4 PASS.** Two early failures were spec bugs (tapping the card text area instead of the image button; missing Project Tier select), not product bugs. Drawer panel is always in DOM off-screen (`translate-x-full`) — `getByRole` counts it; use visibility checks, not count.
4. **US-004 sign-off:** owner on-device pass completed 2026-09-13 — no issues reported. Story is Done.

**Gates at close:** Mobile Chrome mobile-funnel 4/4; (jest/tsc/eslint unchanged from US-006 close).

## US-005 — backend pre-verification DONE (2026-09-13)

Smoke against the real dev backend (Django test client, admin-authenticated):
- **Publish roundtrip:** new PortfolioItem under the listing appears in `/api/v1/pages/?type=portfolio.PortfolioItem` (total 7→8) and detail returns 200.
- **Unpublish:** item vanishes from listing, detail returns 404, listing API stays healthy — AC5 verified programmatically.
- **Invalid save:** POSTing HomePage edit with empty `hero_heading` → 400 with validation surfaced; **live API payload byte-identical before/after** — AC6 verified programmatically.
- Smoke artifacts cleaned up (item deleted).

**Owner handoff (remaining eyeball steps):** ① homepage draft→Preview shows the edit without saving, and live site is unchanged until publish; ② new portfolio item appears in "Our Work"/listing after publish; ③ Site Settings "Preview site" button shows unsaved edits (mechanism already smoke-tested live in US-006). Admin at `localhost:8101/admin/`.

## Git state

- Branch `main`, **67 commits ahead of `origin/main`, unpushed** (push requires explicit user approval; pushing to `main` triggers production deploy).
- Working tree clean at the US-001/US-003 close-out commit.


## Shipped this stretch (2026-09-12/13)

1. **Visitor nav fixes** — `src/lib/nav.ts` `resolveNavHref()` rewrites `#section` anchors to `/#section` off the home page; Header logo links home; Footer path-aware; logo uses `next/link`.
2. **Portfolio filters collapsed** — `ScopeFilterTabs`/`TagFilter` deleted; new `FilterMultiSelect` (two dropdowns, multi-select, Clear filters button that renders only when filters are active, inline with the "Our Work" heading, `align="right"` on the second dropdown so its panel stays on-screen).
3. **Lightbox overhauled** — enlarged obvious controls with hover-lit bar, focus trap + focus restore, `figure/figcaption` + `role="status"` counter, rich context panel (project link, scope badge, finish tags, captions with de-duplication), `LightboxSlide`/`LightboxProject` types exported from the modal.
4. **Portfolio page** — "← Back to Home" via optional `backLink` prop on `PortfolioSection`; homepage instance unaffected.
5. **Admin "Edit Home" fix** — `HomePage.get_home_for_site()`/`ensure_for_site()` helpers; `home/bootstrap.py` post_migrate hook (NOT a data migration — replacing a site root touches tables of every Page-subclass app + search index, which don't all exist mid-migration); `seed` creates the HomePage too; hook falls back to "Create Home" instead of `#`. Local DB now: `Home → Portfolio → 6 items`, site root = HomePage id 10, 3 services + featured links seeded.
6. **Docs** — README intent corrected (multi-page, `/portfolio` first-class); memory bank initialized; US-001…US-006 drafted.

## Next steps (in order)

1. **US-005** — owner walkthrough of the admin loop (backend pre-verification passed 2026-09-14: publish/unpublish roundtrip clean, invalid saves reject without touching live). Awaiting the user's 3-step admin eyeball: homepage preview loop, portfolio publish/unpublish, settings preview button.
2. Analytics/instrumentation story as the natural follow-up after the sign-off batch.

## Sync state (2026-09-14)

- **All work pushed to `origin/main`; CI fully green; Release workflow deployed successfully.**
- **Settings-preview button bug fixed (`95ff083`)**: the US-006 "Preview site" button never rendered — the injected script's click handler was closed with `}};` (missing the `)` closing `addEventListener`), so the script failed at parse time on every admin page. Verified end-to-end in real Chromium: button renders next to Save, click → 200 → preview URL opened, zero page errors. New regression test syntax-checks the injected script (`node --check` in CI; pure-Python delimiter-balance check everywhere) — proven to fail on the old code. Diagnosis tools kept: `/tmp/dump_scripts.py` extracts rendered admin scripts; login for admin browser tests uses username `t`, not email.
- **First CI run failed; triaged via `gh` and fixed** (commits `065d7e3`, `c25ec98`):
  1. `mobile-funnel.spec.ts` ran under Desktop Chrome in CI and its `.tap()` calls need `hasTouch` — fixed with `testIgnore: [/mobile-funnel/]` on the Desktop Chrome project (spec is untouched and passes on Mobile Chrome + Mobile Safari).
  2. Stale visual baselines — refreshed **from the CI run's uploaded artifact** (`playwright-report` → `homepage-actual.png` per project), the one environment where mock data renders correctly. Added the missing `Mobile-Chrome.png` baseline. **Never regenerate locally** (sandbox renders an empty portfolio section).
- Key lesson: WebKit **works in CI** — "Mobile Safari broken" is local-sandbox-only. Verify failures against CI before treating them as product bugs.
- Baseline refresh procedure for future visual changes: push, download the failed run's artifact, copy `homepage-actual.png` per project into `__screenshots__/visual/homepage.spec.ts/homepage/`.

## Shipped: US-007 — site chrome on the homepage (2026-09-14)

1. **Decision (ADR 0001):** visitor-facing chrome (nav, banner, identity,
   branding, social, SEO) moved from SiteSettings onto HomePage as page
   fields with a tabbed editor — giving the owner the page editor's real
   live preview and publish/revision semantics. Operational settings (lead
   alerts, auto-responder) stay in SiteSettings.
2. **Data migration** home.0012 copies existing settings onto the homepage
   (idempotent, runs once); site_settings.0004/0005 trim chrome fields and
   drop NavigationItem + SettingsPreview tables.
3. **API contract unchanged:** homepage exposes chrome fields + `nav`
   ({label, href}) + nested `seo`; frontend type untouched, only its source
   moved. Two contract-mismatch bugs found and fixed live (payload key
   `navigation_items` vs frontend `nav` — fixed backend-side AND in mocks).
4. **US-006 machinery removed** (SettingsPreview model, admin button, token
   endpoints, settings_token cookie branch). One preview token now rules
   both page content and chrome.
5. **Verified live:** draft homepage renders smoke chrome (+1-999-SMOKE)
   while the live site stays unchanged; homepage 200; backend 120 pytest,
   frontend 251 jest, e2e navigation 11/11.

## E2E scenario isolation sprint (2026-09-14, branch `test/e2e-scenario-isolation`)

1. **Root flake fixed:** mock-backend.mjs no longer keeps server-global
   scenario state — the dataset is resolved per request from `X-E2E-Scenario`
   (header > default). Control endpoint `POST /__e2e__/scenario` deleted.
2. **Shared fixtures** (`tests/e2e/test-fixtures.ts`): all specs import
   `test`/`expect` from it; the `page` fixture routes every request and stamps
   the scenario header on documents, RSC prefetches, and `/api/v1/pages/`.
   `setScenario(page, name)` keeps its old call signature (registers a
   later-matching route that wins). `mainText(page, text)` scopes text
   assertions to `<main>` (strict-mode chrome-collision guard).
3. **SSR forwarding:** `@/lib/e2e-headers.ts` `e2eScenarioHeaders()` reads the
   header via `next/headers` (no-op in prod); merged into
   `fetchPortfolioItemsServer` + detail-page fetches. Jest `next/headers`
   mocks needed a `headers` entry (smoke + 3 page tests).
4. **Config:** CI workers 1 → 4 (safe now), `trace: "retain-on-failure"`.
5. **Isolation regression spec** `scenario-isolation.spec.ts`: two concurrent
   contexts with different scenarios must each render their own dataset.
6. **Gates:** jest 21/251, tsc, eslint (touched files), e2e **128/128 passed
   (1.2m)** incl. Mobile Safari locally. 4 micro-commits, tree clean.
   **NOT pushed** — awaiting approval; next: push branch + PR, confirm CI
   (workers=4 parallel run is the real proof), then visual-baseline procedure
   unchanged for future layout changes.

## CI triage (2026-09-14, post-US-007) — CLOSED

1. **Root causes found & fixed:** (a) detail-page e2e used unscoped
   `getByText("Residential")` — now collides with chrome text since US-007
   moved the footer description onto the homepage payload; fixed by scoping
   to `main` + exact match. (b) `mobile-funnel.spec.ts` never declared a
   mock scenario — it rode whatever the server-global scenario state was,
   so results depended on spec-file ordering; pinned via `beforeEach`
   `setScenario(page, "listing")`. (c) Mobile-Chrome + Mobile-Safari
   homepage baselines predated US-007's 31px chrome shift — refreshed from
   the CI artifact's `homepage-actual.png` (never regenerate WebKit
   baselines locally; local WebKit renders differ from CI).
2. **Known residual flake (documented, unfixed by design):** the mock
   backend's scenario state is server-global, so parallel workers running
   the error-scenario test can flip state under other specs. CI-green;
   proper fix is per-request scenario headers — backlog candidate.
3. Final state: CI run 34889725773 **success**, Release 34890046599
   **success** (deployed). `main` == `origin/main` at `6fff0ef`, tree clean.
