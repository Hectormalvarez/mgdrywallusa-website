# Active Context — MGDrywall USA

*Updated: 2026-09-13. Read this file first when resuming.*

## Current focus

**US-004 automated mobile walkthrough DONE (2026-09-13)** — funnel proven on emulated Mobile Chrome (375×812, touch); the on-device human pass is the remaining open item. Next: **US-005** (owner loop walkthrough).

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
4. **Remaining for US-004 sign-off:** human on-device pass (rotate/keyboard-dismiss persistence, real-thumb tap ergonomics, WebKit/Safari in the wild).

**Gates at close:** Mobile Chrome mobile-funnel 4/4; (jest/tsc/eslint unchanged from US-006 close).

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

1. **US-006** — settings live preview (drafted; needs PO→Architect pass on the mechanism).
2. **US-005** — owner edit→preview→publish walkthrough (now covers settings preview via US-006).
3. Regenerate the e2e visual baseline (`tests/e2e/visual/`) — **only once portfolio data renders via the real backend**; regenerating against the broken mock wiring would bake in a wrong baseline.
4. Push when the user approves (production deploy trigger!).

## Open items parked with the user

- Push approval (deploys to prod on push).
- Analytics/instrumentation story as the natural follow-up after US-001/US-002.
