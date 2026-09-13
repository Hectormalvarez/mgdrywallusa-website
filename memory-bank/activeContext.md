# Active Context — MGDrywall USA

*Updated: 2026-09-13. Read this file first when resuming.*

## Current focus

**US-001 + US-003 pipeline CLOSED (2026-09-13)** — all gates passed (QA: all ACs PASS; Code Review: APPROVED). Next story in queue: **US-002** (sitewide phone visibility). **US-006 drafted** (settings live preview, priority 3).

## Shipped: US-001 + US-003 (sprint "Flow Sign-off #1", `tasks/sprint.md`)

1. **Desktop header CTA** — `Get a Free Quote` `Button` in the desktop nav (`hidden md:flex` parent), `resolveNavHref("#lead-form", pathname)`; drawer CTA untouched.
2. **Detail-page CTA band** after the article (`/#lead-form`), on **both** found and not-found variants.
3. **`scroll-mt-16`** on the `#lead-form` section (`src/app/page.tsx`) — anchor landings clear the 64px sticky header (verified in e2e with `toBeInViewport`; banner-enabled case safe because the banner scrolls away).
4. **Detail-page nav row** — `Home · ← Back to Portfolio` on both variants.
5. **Global 404** — `Browse our work` (`/portfolio`) beside `Go back home`.
6. **E2E** — 5 new tests in `navigation.spec.ts` (Conversion & Orientation describe); scope CTA queries to `page.locator("main")` on detail pages to avoid strict-mode collisions with the footer CTA.

**Gates at close:** jest 21 suites / 244 tests, coverage 96.74/86.73/95.03/98.68; tsc + eslint clean; e2e navigation 10/10 (Desktop Chrome, free ports).

## Git state

- Branch `main`, **54 commits ahead of `origin/main`, unpushed** (push requires explicit user approval; pushing to `main` triggers production deploy).
- Working tree clean at the US-001/US-003 close-out commit.


## Shipped this stretch (2026-09-12/13)

1. **Visitor nav fixes** — `src/lib/nav.ts` `resolveNavHref()` rewrites `#section` anchors to `/#section` off the home page; Header logo links home; Footer path-aware; logo uses `next/link`.
2. **Portfolio filters collapsed** — `ScopeFilterTabs`/`TagFilter` deleted; new `FilterMultiSelect` (two dropdowns, multi-select, Clear filters button that renders only when filters are active, inline with the "Our Work" heading, `align="right"` on the second dropdown so its panel stays on-screen).
3. **Lightbox overhauled** — enlarged obvious controls with hover-lit bar, focus trap + focus restore, `figure/figcaption` + `role="status"` counter, rich context panel (project link, scope badge, finish tags, captions with de-duplication), `LightboxSlide`/`LightboxProject` types exported from the modal.
4. **Portfolio page** — "← Back to Home" via optional `backLink` prop on `PortfolioSection`; homepage instance unaffected.
5. **Admin "Edit Home" fix** — `HomePage.get_home_for_site()`/`ensure_for_site()` helpers; `home/bootstrap.py` post_migrate hook (NOT a data migration — replacing a site root touches tables of every Page-subclass app + search index, which don't all exist mid-migration); `seed` creates the HomePage too; hook falls back to "Create Home" instead of `#`. Local DB now: `Home → Portfolio → 6 items`, site root = HomePage id 10, 3 services + featured links seeded.
6. **Docs** — README intent corrected (multi-page, `/portfolio` first-class); memory bank initialized; US-001…US-006 drafted.

## Next steps (in order)

1. **US-002** — sitewide phone visibility from SiteSettings (same header row as the new CTA; separate story + commit).
2. **US-006** — settings live preview (drafted; needs PO→Architect pass on the mechanism).
3. **US-004** — human mobile walkthrough of the full funnel; record found issues to backlog.
4. **US-005** — owner edit→preview→publish walkthrough (now covers settings preview via US-006).
5. Regenerate the e2e visual baseline (`tests/e2e/visual/`) — **only once portfolio data renders via the real backend**; regenerating against the broken mock wiring would bake in a wrong baseline.
6. Push when the user approves (production deploy trigger!).

## Open items parked with the user

- Push approval (deploys to prod on push).
- Analytics/instrumentation story as the natural follow-up after US-001/US-002.
