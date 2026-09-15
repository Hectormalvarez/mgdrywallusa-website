# UX Audit — Edge Caching Initiative (2026-09-15)

**Scope:** performance experience of homepage, `/portfolio`, portfolio details, lead form, Wagtail admin/preview. Audited on the running dev stack (Nginx :8101, all containers healthy); production evidence from the reported Cloudflare ~5% hit rate and code-level fetch configuration.

## Users & goals

1. **Prospective customer (mobile-heavy, local trade)** — page must appear instantly on repeat visits; slow TTFB on 4G = lost leads.
2. **Site owner** — CMS edits must appear on the live site promptly; caching must never serve stale content after "Publish".

## Observed evidence

| # | Finding | Evidence | Impact |
|---|---------|----------|--------|
| A1 | **Every HTML response is uncacheable.** All pages emit `Cache-Control: no-cache, must-revalidate`; CF classifies HTML as DYNAMIC and never caches it by default | `curl -sI http://localhost:8101/` and `/portfolio` — header observed | **Critical** — the direct cause of the ~5% hit rate; every visitor pays full SSR cost |
| A2 | **Every page render performs live backend fetches.** All published-path data fetches in `frontend/src/lib/api.ts` (`fetchSiteSettings`, `fetchHomePage`, `fetchPortfolioItemsServer`) pass `cache: "no-store"`, forcing dynamic rendering and 2+ origin-to-Django round trips per visitor | `api.ts` lines 203–261 | **Critical** — TTFB scales with backend load; repeat visits get zero benefit |
| A3 | **Measured repeat-visit cost is real work, not free.** Homepage TTFB 0.372s → 0.233s → 0.155s across three consecutive requests (local, warm); every request re-fetches from Django | curl timing loop | **Major** — on production 4G, add network RTT to each uncached view |
| A4 | **Media/static header policy is contradictory.** `/media/` + `/static/` send `Cache-Control: public, immutable` *and* `expires 1d` — `immutable` means never revalidate | `nginx/nginx.conf` lines 76–93 | **Minor** — inconsistent semantics; harmless on hit paths but confusing for CF rules |
| A5 | **Dev-stack asset headers are not production-representative.** Dev Turbopack chunks also emit `no-cache`; production standalone builds emit `immutable` for `/_next/static` — asset caching is not the problem in prod | curl on dev chunk vs Next standalone behavior | Note — keeps the audit honest: fix targets HTML + origin fetches, not `_next/static` |
| A6 | **Draft-mode/preview and lead submission must stay uncacheable** — any caching change must preserve `no-store` on `/api/preview`, draft fetches, and the lead POST | preview machinery (memory-bank systemPatterns) | Constraint on the fix, not a defect |

## Ranking

- **Critical (in scope):** A1, A2 — make published pages edge/ISR-cacheable.
- **Major (in scope):** A3 — resolved by A1+A2; verified via repeated-request timing + CF hit-rate stats.
- **Minor (deferred):** A4 fixed opportunistically in the nginx pass (one-line alignment); nothing else deferred.
- **Constraint:** A5, A6.

## What the story must deliver (user-visible)

1. Repeat visits to public pages are served from cache (edge or Next cache) with no backend round trip — owner-visible as near-instant loads and a rising CF hit rate.
2. CMS publish appears immediately on the live site (event-driven revalidation) — no stale-content UX regression.
3. A measurable baseline and after-metric (CF cache-stats script) so the improvement is proven, not assumed.
