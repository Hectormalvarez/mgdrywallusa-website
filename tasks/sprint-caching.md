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

