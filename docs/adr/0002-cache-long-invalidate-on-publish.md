# ADR 0002 — Cache long at the edge, invalidate on publish

Date: 2026-09-15 · Status: Accepted

## Context

Cloudflare's cache hit rate is ~5%. Every HTML response is uncacheable
(`no-cache, must-revalidate`), all pages render with `dynamic =
"force-dynamic"`, and every published-path data fetch in
`frontend/src/lib/api.ts` passes `cache: "no-store"` — so every visitor
pays full SSR cost, including 2+ live round trips to Django. At the same
time the owner must see CMS edits on the live site the moment they
publish, which rules out naive long TTLs.

## Decision

**Cache long at the edge, invalidate on publish** — event-driven caching
with a bounded time-based fallback:

1. Public pages (home, portfolio listing, portfolio details) become
   statically generated/ISR: `force-dynamic` removed, published-path
   fetches use `next: { revalidate: 300 }`. Next.js owns the HTML
   `Cache-Control` (`s-maxage=300, stale-while-revalidate`); no custom
   header overrides anywhere.
2. Wagtail `page_published`/`page_unpublished` signals fire a
   fire-and-forget POST (shared secret, 2s timeout) to a protected Next.js
   `/api/revalidate` endpoint, which calls `revalidatePath` for the known
   routes and then Cloudflare **purge-everything (v1)**.
3. `deploy.sh` purges the CF cache (best-effort) after the health check
   passes, so deploys never serve stale HTML (AC6).
4. Draft/preview fetches, lead submission, `/admin/`, and `/api/` remain
   explicitly uncacheable.

The 300s `s-maxage` is deliberately kept even though publishes purge: it
is the **failure-mode fallback** — a missed or failed purge degrades to
5-minute staleness instead of serving stale content indefinitely.

## Considered options

- **Status quo (no-store everywhere):** simplest, but 100% of HTML hits
  origin and every view rebuilds — the cause of the ~5% hit rate.
- **Time-based TTL only (e.g. 5 min, no invalidation):** one moving part,
  but either the owner waits for edits or the TTL must shrink, hurting the
  hit rate.
- **Chosen: event-driven invalidation** — instant freshness and a high
  hit rate with no new infrastructure.

## Consequences

- (+) Publish freshness is instant; repeat visits are served from edge or
  Next cache with no backend round trip; hit rate rises from ~5%.
- (−) Two mechanisms (Next revalidation, CF purge) can fail
  independently; the bounded TTL caps the damage but edits may lag up to
  5 minutes on failure. Purge failures are logged, never block publishing.
- (−) Purge-everything briefly drops edge warmth for all URLs. Acceptable
  at this site's size; revisit **purge-by-URL** if the page count or edit
  frequency grows.
- (−) A shared secret (`REVALIDATE_SECRET`) must exist on both containers
  and be documented in `.env.sample`.
- Draft Mode still forces dynamic rendering during preview (cookies),
  so the preview flow is unaffected by caching.
