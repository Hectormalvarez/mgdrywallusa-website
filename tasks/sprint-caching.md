# Sprint — Edge Caching (US-008)

**Story:** US-008 — The site is fast on every visit, and edits show up instantly (`docs/stories/US-008-edge-caching.md`)
**Pipeline:** UX ✓ (audit: `templates/ux-audit.md`) · PO ✓ · Human gate ✓ (2026-09-15 — purge in-scope, purge-everything v1, T1 expanded to discovery+baseline) · SDM ✓ · Architect ✓ (ADR-0002, **revised 2026-09-15**: Wagtail `frontend_cache` invalidation, CF-edge caching) · Human gate ✓ · **Developer ⬜** · QA ⬜ · Code Review ⬜

## Design (final, per ADR-0002 revision)

- **Caching layer = Cloudflare edge.** Pages stay dynamic; `next.config.ts` adds
  `Cache-Control: public, s-maxage=300, stale-while-revalidate=86400` on public
  HTML only. `api.ts` + draft machinery untouched (ISR rejected: homepage is
  dynamic by construction via draft cookies; CI builds have no backend).
- **Invalidation = `wagtail.contrib.frontend_cache`** (first-party):
  `CloudflareBackend` auto-purges page URLs on publish/unpublish/delete; a
  `PurgeBatch` handler purges `/` + `/portfolio` when a PortfolioItem changes.
  No custom `/api/revalidate` endpoint, no shared secret.
- **Deploys:** `manage.py purge` (full purge, best-effort) after health check.
- **Guard:** CF Cache Rule bypasses requests with the `preview_token` cookie
  (draft previews never cached) and bypasses `/admin/*`, `/api/*`.

## Tasks

| ID | Task | AC | Depends on | Status |
|---|---|---|---|---|
| T1 | Cloudflare discovery + baseline — `scripts/cf-cache-stats.sh`: GraphQL cache-status breakdown, zone-settings audit, security-event volume; documents free-plan dataset limits; **baseline run before any caching change** | AC4 | none | ✓ committed |

## T1 baseline (2026-09-15, zone taylormadetech.net, Free plan)

- **30-day total: 96,495 requests · 3,225 cached · 3.3% hit rate** (worse than the reported ~5%).
- Daily traffic 0.6k–8k requests; bandwidth peaks ~1 GB/day (media-heavy days).
- Zone settings: `cache_level=aggressive` (static extensions already cache),
  `browser_cache_ttl=14400` (CF overrides origin browser TTL to 4h),
  `http3=on`, `0rtt=off`, development_mode off, **no cache rules**.
- Free-plan GraphQL limits (verified against the live schema): `Adaptive`
  datasets expose `cacheStatus` but no request-count sums; `1dGroups` has
  request/byte sums but no `cacheStatus`; firewall events require paid plan.
  Script uses `1dGroups` (requests/cachedRequests) → hit ratio = AC4 metric.
- Post-change success criterion: 30-day hit rate materially above 3.3%
  (expect high-80s/90s% once the Cache Rule caches HTML).

## Tasks (final status)

| ID | Task | AC | Status |
|---|---|---|---|
| T1 | CF discovery + baseline (script above) | AC4 | ✓ done |
| T2 | Cacheability headers — **implemented as `frontend/src/middleware.ts`**, not `next.config.ts headers()`: Next stamps its own `Cache-Control: no-cache` on dynamic responses and config-level headers cannot override it; middleware response headers are applied last. Sets `public, s-maxage=300, stale-while-revalidate=86400` on `/`, `/portfolio`, `/portfolio/:slug*` only. Nginx `/media/`+`/static/` → single `public, max-age=86400` | AC1, AC5 | ✓ done — **verified in a production build**: `/` and `/portfolio` emit the header; 404/other routes keep `private, no-cache` |
| T3 | Wagtail publish purge — `wagtail.contrib.frontend_cache` + `CloudflareBackend` from env (`WAGTAILFRONTENDCACHE`); `PurgeBatch` handler in `portfolio/signals.py` purges `/` + `/portfolio` on item publish/unpublish/delete (never raises); `seed` syncs the default Site hostname to `FRONTEND_URL` | AC2 | ✓ done — **live-verified**: invalid token → CF "Authentication error" logged + publish still succeeds; valid token → silent success |
| T4 | Edge config + deploy purge — `scripts/cf-cache-rule.sh` (idempotent ruleset PUT; bypass `/api/*`, `/admin/*`, `/_next/*`, `preview_token`/`__prerender_bypass` cookies); deploy purge = direct CF `purge_cache` (`purge_everything`) in `deploy.sh` — **Wagtail 7 has no `manage.py purge` command** (earlier assumption corrected) | AC1, AC6 | ✓ done — purge verified HTTP 200; rule script ready (apply needs token permission: Zone → Cache Rules → Edit) |
| T5 | Tests + gates — middleware Jest suite; backend purge/seed pytest (10 new); full gate below | AC4 | ✓ done — CF stats re-run deferred to post-deploy (AC4 proof) |

## Gate results (2026-09-15)

- Backend: **130 pytest passed** (container, pinned env — host pyenv 3.12 degraded this session), `ruff check` + `ruff format --check` clean.
- Frontend: **22 suites / 258 jest tests passed**, `tsc --noEmit` clean, eslint clean on all touched files.
- Pre-existing (not this sprint): `frontend/.next.rootbak/` (old build backup, 2026-08-14) is missing from eslint `ignores` — `npm run lint` reports ~243 errors from it alone. One-line fix candidate: add it to the ignores list.
- Dev smoke: `/` 200, `/portfolio` 200, `/api/preview` 401 (no token — unchanged), `/admin/` 302 (unchanged).

## T4 live findings (2026-09-15, prod zone)

1. **Pre-existing manual Cache Rules found** (created 2026-09-05 in the dashboard, not in the codebase): "Cache Public HTML" (prod, edge_ttl override-origin default 300s), "Bypass Sessions and Draft Mode", "Bypass Dynamic and Admin Routes". My earlier "no cache rules" script reading was an auth failure misreported as empty — corrected. The sprint script's ruleset reading now works with the Cache-Rules permission.
2. **Root cause of HTML bypass found live**: the Next origin sends `Vary: rsc, next-router-state-tree, next-router-prefetch, …`. Cloudflare only supports `Vary: Accept-Encoding` — any other Vary value forces `cf-cache-status: BYPASS`, regardless of Cache Rules. **Fix (in `nginx.conf`)**: `proxy_hide_header Vary` + `add_header Vary "Accept-Encoding"` (safe: the Cache Rule excludes `RSC: 1` requests, so RSC payloads can never be served from the HTML cache entry). Verified on the dev stack: `Vary: Accept-Encoding` only.
3. **Cache Rule applied via script** (`mgdrywall-edge-caching`): prod + dev hosts, respect-origin TTLs, bypasses `/api/*`, `/admin/*`, `/_next/*`, `preview_token`/`__prerender_bypass` cookies. Coexists with the manual rules (mine adds dev-host coverage, preview-cookie bypass, and SWR semantics; the manual "Cache Public HTML" rule keeps prod working with a 300s override TTL even before the origin headers deploy).
4. Prod pre-deploy header check: origin still sends `private, no-cache, no-store` (expected — this branch is not deployed yet); after deploy the middleware sends `public, s-maxage=300, stale-while-revalidate=86400` and both caching layers line up.



| T2 | Cacheability headers — `next.config.ts` `headers()`: `public, s-maxage=300, stale-while-revalidate=86400` on `/`, `/portfolio`, `/portfolio/:slug*` only; nginx `/media/`+`/static/` → single `public, max-age=86400` (drop contradictory `immutable`+`expires`) | AC1, AC5 | none | ⬜ |
| T3 | Wagtail publish purge — `wagtail.contrib.frontend_cache` in `INSTALLED_APPS`; `WAGTAILFRONTENDCACHE` CloudflareBackend from env; `PurgeBatch` signal handler for PortfolioItem → purge `/` + `/portfolio`; **verify prod Site hostname == public domain** (purge URLs derive from it); backend pytest | AC2 | T2 | ⬜ |
| T4 | Edge config + deploy purge — CF Cache Rule shaped by T1 findings (respect origin headers; bypass `/admin/*`, `/api/*`, `preview_token` cookie) via scripted API call or documented click-path; `manage.py purge` appended to `scripts/deploy.sh` after health check | AC1, AC6 | T2 (T3 first) | ⬜ |
| T5 | Tests + full gate — Jest header tests, backend pytest for purge signals, `make check`; post-change CF stats re-run vs T1 baseline | AC4 | T1–T4 | ⬜ |

## Dependency map

T1 ∥ T2 → T3 → T4 → T5.

## Risks

| Risk | Mitigation |
|---|---|
| Stale HTML after publish if purge call fails | Bounded `s-maxage` (300s) always the fallback; purge failure logged, never blocks publish |
| Purge URLs wrong (Site hostname ≠ public domain) | Verified in T3 before relying on the signals; seed/bootstrap noted |
| CF token over-scoped or leaked | Zone-limited token (Analytics:Read + Zone Settings:Read + Cache Purge), `.env` only — never echoed/committed |
| Dev-stack headers misread as prod behavior | Verify via prod headers through the tunnel domain |
| Caching breaks draft/preview or lead flow | Preview-cookie bypass in the Cache Rule; `/api/` + admin never cached; QA walks preview interactively |
| Deploys serving stale HTML | `manage.py purge` after health check (AC6) |

## Backlog (recorded, not in this sprint)

- **Origin API cache keyed by `page.cache_key`** — Django-side caching of
  `/api/v1/pages/` payloads that auto-invalidates on publish. Only if the T1
  baseline shows origin load matters after edge caching.
- **Next `sitemap.ts` fed by the Wagtail API** — small SEO win, separate story.

