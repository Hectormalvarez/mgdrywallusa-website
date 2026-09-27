# Active Context — MGDrywall USA

*Updated: 2026-09-27. Read this file first when resuming.*

## Current focus

**US-012 (CD route enclosure) COMPLETE 2026-09-21 — deploys now run over the project's OWN tunnel (`35131c5`, `d525b7e`, `06421ba`; cutover record in `docs/stories/US-012-cd-route-enclosure.md`).** Edge route: `mgdrywall-ssh.taylormadetech.net` (CNAME → project tunnel `3a2fdaeb…`, no nesting) → tunnel ingress `ssh://host-gateway:22`; Access app `mgdrywallusa-deploy-ssh` (`f3e80fa4…`) + service token `mgdrywallusa-gha-deploy` (`6be54ea6…`); repo variable `DEPLOY_SSH_HOSTNAME` + rotated `CF_ACCESS_ID`/`CF_ACCESS_SECRET`. **Proof: Release run `35668628234` success, deploy job 38s, `.last-deploy.json` ok/sha-06421ba, images sha-06421ba, site 200/HIT.** Prod requires a one-time `docker compose up -d --no-deps cloudflared` (deploys never recreate `cloudflared`; tunnel config changes are deliberate). **Hardened 2026-09-26:** the Access policy is now scoped to the service token — anonymous clients are refused at the edge (verified), and the watchdog converges start-only while `deploy.sh` Step 7b warns on config drift it never applies. Cleanup also done: dead `mgdrywallusa-webhook` CNAME, `WEBHOOK_*` GitHub secrets, stale `.env.sample` webhook section, retired-webhook comments in `deploy.sh`. The old host route (`ssh.taylormadetech.net` + `ssh-usrv01`) is **shared with the tmtn_website deploy key — do not delete**; this project just no longer depends on it. **Ops note:** `deploy.sh` pulls the checkout mid-run, so changes to it (e.g. the drift check) execute on the *next* deploy — verify new deploy-time logic in the following run's log.

**Status review published 2026-09-20 → `docs/reviews/2026-09-20-launch-status-and-reproducibility.md`.** Two headline conclusions: (1) **launch gate = US-002 + US-004 + US-005** (the post-US-008 cache proof is now satisfied — see `docs/reviews/2026-09-26-cache-analytics-review.md`) — the site is otherwise launch-ready; (2) **reproducibility audit done**: architecture is template-grade, but brand copy/identity is hardcoded across ~30 files in six parallel layers (model defaults, migrations, seed, frontend fallbacks ×2, portfolio copy). A template-ization sprint (Tier 1 checklist + Tier 2 brand-copy extraction, **ADR-0004** — renumbered from ADR-0003, which the cache-stats ADR took on 2026-09-27) is planned **after** the launch gate and **before** any custom user features.

**US-011 PRE-WORK DONE 2026-09-27 — design locked; implementation queued after the launch gate.** Story revised in place (G/W/T ACs incl. two edge cases; AC1 recast from *hourly* to a configurable daily cadence because Cloudflare buckets this data by UTC day) and **ADR-0003 written** (`docs/adr/0003-store-cloudflare-cache-stats-in-postgres.md` — no longer deferred). Locked design: app `backend/cloudflare/`; models `CacheStatRun` (heartbeat/provenance) + `CacheDailyStat` (unique on `date,host,cache_status`; `requests`, `edge_bytes`, `visits`) + `CacheStatPayload` (raw JSONB expiry hedge, enables `--rebuild`); **one GraphQL call per run** over a 30-day self-healing window; `manage.py collect_cache_stats`; host cron daily 00:10 UTC (**never CI**); admin `ReportView` page at `/admin/traffic/` (free CSV export, superuser-only `AdminOnlyMenuItem`, dependency-free inline-SVG chart, current UTC day labelled "in progress") plus a separate homepage panel; config `CLOUDFLARE_STATS_WINDOW_DAYS` (30) / `CLOUDFLARE_STATS_STALE_AFTER_HOURS` (26). **Two dataset corrections (verified live 2026-09-27): one query accepts up to 4w2d (30 days), NOT 1 day — so collection is ONE call, and `cf-cache-stats.sh`'s per-day loop is redundant (collapse = Phase 1); per-host `sum { edgeResponseBytes visits }` are valid but `sum { requests }` is not (use `count`).** Corrected in the story, the script header, and the 2026-09-26 review doc. `requests` will be declared explicitly in `backend/requirements.txt` (already in the image at 2.34.2 via Wagtail). No code written yet.

**US-010 D′ cutover COMPLETE (2026-09-16) — webhook daemon retired; deploys run natively on the host over Access-protected SSH with a forced-command key (`scripts/deploy-wrapper.sh` accepts only `deploy sha-<40-hex>`), exit code = truth. Superseded on the edge by US-012 (project tunnel); the forced-command + wrapper design is unchanged.** Zero-Trust hardening same run: code-server disabled, pgadmin/postgres containers removed, code./pgadmin. ingress+Access apps deleted. **Open:** `CLOUDFLARE_ZT_TOKEN` revocation **deferred** (user still optimizing Cloudflare across all sites — do not prompt for it). Dead `code.`/`pgadmin.` CNAMEs and the leftover `mgdrywallusa-webhook` CNAME are confirmed gone/deleted (2026-09-26). CF creds convention: `~/.cloudflare/tokens.env` (source with `set -a; . ~/.cloudflare/tokens.env; set +a`).

**US-008 Edge Caching deployed 2026-09-15 — live, all public routes `cf-cache-status: HIT`.** Per ADR-0002: `frontend/src/proxy.ts` (Next 16 proxy convention — NOT deprecated `middleware.ts`) sets `public, max-age=0, stale-while-revalidate=86400` on `/`, `/portfolio`, `/portfolio/:slug*` only; `wagtail.contrib.frontend_cache` + CloudflareBackend purges on publish (`portfolio/signals.py` PurgeBatch); `scripts/cf-cache-rule.sh` manages the CF Cache Rule; baseline hit rate was **3.3%**.
- **Cache analytics reviewed 2026-09-26 → `docs/reviews/2026-09-26-cache-analytics-review.md`.** Per-host data (site only, 16 days): HTML caching is **proven working** (zero hits pre-US-008 → `hit`/`expired`/`revalidated` after; hashed `/_next` chunks HIT with `Age`). The script's `3.3%`/`1.3%` headline is **zone-wide** and therefore measures the *other* sites in this shared zone (`taylormadetech.net` 672–1,124 req/day vs our 1–61). **Key defect FIXED 2026-09-26 (`87f6040`): `stale-while-revalidate=86400` was inert — `s-maxage` implies `proxy-revalidate`, which forbids shared caches from serving stale** (CF docs; zero `updating`/`stale` in 16 days; probe → `EXPIRED` with no `Age`). Now `max-age=0` + SWR with the edge TTL pinned at 300s by the Cache Rule. **Verified live after the deploy:** a post-TTL request returned `UPDATING` with `Age: 375` (stale served immediately, revalidation in background), then `HIT` `Age: 14` — the same request previously returned `EXPIRED` with no `Age`. Also corrected: Cloudflare keeps **31 days** of per-host data (NOT ~1 day as US-011 states) and US-011's "74.4% cacheable" is really **53%** (`expired` was miscounted as cache-served). **Confirmed by Cloudflare's own data (2026-09-27):** the first `updating`/`stale` responses on record for this host appeared — `stale = 1` in `cf-cache-stats.sh --days 1` — independently proving stale-serving now happens in production. **Also corrected 2026-09-27:** the per-host range limit is **4w2d per query, not 1 day** (ADR-0003), which is why collection needs only one call.

**Critical live discovery:** Cloudflare BYPASSES HTML when `Vary` contains anything but `Accept-Encoding` — Next sends `Vary: rsc, …` on every dynamic page. Fixed in `nginx.conf` (`proxy_hide_header Vary` + own `Vary: Accept-Encoding`); RSC payloads can't leak from the HTML cache (rule excludes `RSC: 1` requests). **This was likely the real reason the hit rate was 3.3% even with the manual dashboard rules.**

**Next steps:**
1. **Cache review DONE 2026-09-26** — (a) edge stale-serving fixed and deployed (`87f6040`: `max-age=0` + SWR, edge TTL pinned by the Cache Rule), (b) `cf-cache-stats.sh` is now per-host with corrected math (`bb2ab7e`), (c) US-011's premise corrected (`769d3b3`). **Remaining, user-side:** the two Cloudflare dashboard actions the token cannot apply — host-scoped http→https Redirect Rule and Smart Tiered Cache; exact steps are in the review doc. Alongside: the US-002 / US-004 / US-005 launch gate.
2. Backlog (in sprint files): origin API cache keyed by `page.cache_key`; Next `sitemap.ts` from the Wagtail API; P3 deploy-runner isolation (host systemd instead of the webhook container); P4 digest-pinned image tags.
3. **US-011 implementation — queued AFTER the launch gate**, design locked (ADR-0003). Must run the complete flow: Phase 1 collector (models + migration + service + command + wrapper/cron + tests, incl. collapsing `cf-cache-stats.sh`'s now-redundant per-day loop) → Phase 2 admin report page + homepage panel → persona-code-reviewer → persona-qa → `make check` → deploy → live cross-check of a collected day against `cf-cache-stats.sh`.

## Environment lessons (this sprint)

- **usrv-01 prod host REQUIRES `/opt/mgdrywallusa-website` → `/home/hadev/Projects/Code/mgdrywallusa-website` symlink** (in-container compose resolves relative bind sources to /opt; without the symlink Docker auto-creates junk dirs and nginx's file-mount fails). Missing symlinks on a new host = deploy failure.
- `hooks.json` is read at webhook-container start — changing it needs `compose up -d --no-deps --force-recreate webhook` on the server.
- Deploys over ssh MUST run detached (nohup); ssh timeouts kill compose mid-swap and leave partial stacks (the watchdog now converges these within 15 min).
- **Never run `next build` inside the dev container without `chown -R $(id -u):$(id -g) frontend/.next` afterwards** — docker exec runs as root; root-owned `.next` files break the host e2e (`EACCES unlink .next/build/package.json`). Build on the host instead.
- Host Python toolchain degraded (pyenv 3.12 missing; 3.13 env has Django too new): run backend pytest/ruff in the container (`docker compose exec -T backend sh -c 'python -m pytest …'`); repo-root-dependent tests must skip gracefully when the bare container has no repo mounted.
- Playwright projects: `--project="Desktop Chrome"` (not `chromium`); full spec runs exceed the 30s tool timeout — background with log + poll.



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
