# ADR 0002 — Cache long at the edge, invalidate on publish

Date: 2026-09-15 · Status: Accepted
Revised: 2026-09-15 — invalidation moved from a custom Next.js webhook to
Wagtail's first-party `wagtail.contrib.frontend_cache`; caching layer
settled as Cloudflare edge (Next.js ISR rejected, see Context).

## Context

Cloudflare's cache hit rate is ~5%. Every HTML response is uncacheable
(`no-cache, must-revalidate`), all pages render with `dynamic =
"force-dynamic"`, and every published-path data fetch in
`frontend/src/lib/api.ts` passes `cache: "no-store"` — so every visitor
pays full SSR cost, including 2+ live round trips to Django. At the same
time the owner must see CMS edits on the live site the moment they
publish, which rules out naive long TTLs.

## Context (revision research)

Two hard facts ruled out Next.js ISR as the caching layer:

1. The homepage calls `draftMode()`/`cookies()` unconditionally (the
   page-preview mechanism), which makes the route dynamic on every
   request by construction. Making it static would mean restructuring
   the preview machinery (US-006/US-007 territory).
2. The frontend Docker image builds in CI with **no backend reachable**;
   statically generated pages would bake fallback/null CMS content and
   serve it for up to 5 minutes after every deploy.

Conversely, Wagtail ships **`wagtail.contrib.frontend_cache`** — a
first-party cache invalidator with a `CloudflareBackend`, automatic
`page_published`/`page_unpublished`/delete signal handlers for all page
models, `PurgeBatch` for index-page invalidation, and a `purge`
management command for full-cache purges. (Note: the v3 API doesn't
invalidate the frontend cache itself — irrelevant here, because the
signals fire on **publish events** and purge **public page URLs**, which
is what Cloudflare caches.)

## Decision

**Cache long at the edge (Cloudflare), invalidate on publish (Wagtail):**

1. Pages stay dynamically rendered. `next.config.ts` sets
   `Cache-Control: public, s-maxage=300, stale-while-revalidate=86400`
   on public HTML routes only. `frontend/src/lib/api.ts` and the
   draft/preview machinery are **untouched** (draft/preview, `/admin/`,
   and `/api/` remain uncacheable).
2. `wagtail.contrib.frontend_cache` + `CloudflareBackend`
   (`WAGTAILFRONTENDCACHE`, token/zone from env) auto-purges a page's
   public URL on publish/unpublish/delete.
3. A small `PurgeBatch` signal handler purges `/` and `/portfolio` when
   a PortfolioItem changes (items are embedded in both pages).
4. `scripts/deploy.sh` runs `manage.py purge` (full cache purge,
   best-effort) after the health check passes, so deploys never serve
   stale HTML.
5. The CF Cache Rule caches HTML respecting origin headers, **bypasses
   requests carrying the `preview_token` cookie** (draft previews must
   never be cached at the edge), and bypasses `/admin/*`, `/api/*`.

The 300s `s-maxage` is the **failure-mode fallback**: a missed or failed
purge degrades to 5-minute staleness instead of stale-forever.

**Rejected earlier revision (recorded for history):** a custom Next.js
`/api/revalidate` endpoint with a shared `REVALIDATE_SECRET`, triggered
by a custom Django signal handler. `frontend_cache` makes it
unnecessary — fewer moving parts, no shared secret, battle-tested code.

## Considered options

- **Status quo (no-store everywhere):** simplest, but 100% of HTML hits
  origin and every view rebuilds — the cause of the ~5% hit rate.
- **Time-based TTL only (no invalidation):** one moving part, but either
  the owner waits for edits or the TTL must shrink, hurting the hit rate.
- **Next.js ISR:** rejected — homepage is dynamic by construction
  (draft cookies) and CI builds would bake fallback content without a
  reachable backend.
- **Chosen: CF-edge caching + Wagtail `frontend_cache` invalidation** —
  instant freshness, high hit rate, no new infrastructure, and the
  invalidation logic is Wagtail first-party, not custom glue.

## Consequences

- (+) Publish freshness is instant; repeat visits served from the edge
  with no origin round trip; hit rate rises from ~5%.
- (+) Purge machinery is Wagtail-maintained: any future page type gets
  publish-purge behavior for free.
- (−) Two purge layers (per-page signals + batch/index) can fail
  independently; the bounded TTL caps the damage at 5 minutes. Purge
  failures are logged, never block publishing.
- (−) Purge URL correctness depends on the Wagtail **Site record's
  hostname matching the public domain** — verified during rollout and
  documented in the sprint.
- (−) Purge-everything (deploys) briefly drops edge warmth for all URLs;
  acceptable at this site size. Revisit **purge-by-URL** if the page
  count or edit frequency grows.
- Backlog (not built here, recorded in the sprint): origin-side API
  caching keyed by `page.cache_key` (auto-invalidates on publish) if
  origin load ever matters; Next `sitemap.ts` fed by the Wagtail API for
  SEO.

