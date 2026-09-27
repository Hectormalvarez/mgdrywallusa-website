# US-011 — Cloudflare cache analytics: recorded history

**Status:** APPROVED · Story created 2026-09-16 · Implementation not started · **ADR: deferred** (to be written with the future dashboard story) · Background corrected 2026-09-26 (retention is 31 days, not ~1; the 74.4% figure is 53%)
**Follows:** US-008 (edge caching, live in prod) · discovery session 2026-09-16 (adaptive GraphQL supports per-host + per-cacheStatus on Free plan; 1-day range quota)

---

## Story

**As the** business owner,
**I want** a record of how my website's traffic is being served (from Cloudflare's edge cache vs. from the server)
**so that** I can see whether the site stays fast as traffic grows, and I can prove whether the caching work is paying off — without logging into Cloudflare or running scripts.

## Background (from US-008 + 2026-09-16 findings)

- Baseline hit rate (zone-wide, 30d at capture): **3.3%** — a zone-wide number,
  so it mixes the other sites sharing this zone and is **not** a metric for this
  site (2026-09-26 review: this site 1–61 req/day vs `taylormadetech.net`
  672–1124 req/day).
- Live verification: HTML caches at the edge; site-specific data for
  2026-09-16 was **53% of cacheable traffic served from the edge**
  (`hit` 57 + `revalidated` 5 of 117 cacheable requests).
  *Corrected 2026-09-26:* the earlier 74.4% counted `expired` (25 requests) as
  cache-served, but Cloudflare defines `EXPIRED` as the request having waited
  for the origin (`Age` header absent on those responses) — see
  `docs/reviews/2026-09-26-cache-analytics-review.md` (F6).
- Today that visibility lives in `scripts/cf-cache-stats.sh`, run by hand.
  Since 2026-09-26 its headline is **per-host with corrected math**
  (served-from-edge = `hit` + `revalidated`, with `expired` reported
  separately), looping one query per day because this plan allows a 1-day range
  per query. Nothing is recorded over time: the per-host dataset retains
  **31 days** (`cannot request data older than 4w3d`, verified 2026-09-26),
  not the ~1 day this story assumed.

## Acceptance criteria

1. **History, not snapshots** — cache-usage data is collected automatically (hourly cadence) and persisted, so trends over weeks/months exist regardless of Cloudflare's data retention.
2. **Site-specific** — stats are tracked for `mgdrywallusa.taylormadetech.net` only (not diluted by other sites sharing the zone).
3. **Self-sufficient** — collection survives Cloudflare outages and token issues: failures are logged, never crash anything, and previously collected data stays intact.
4. **Re-runnable** — collection is idempotent; re-running a period never duplicates or corrupts data (same upsert discipline as `seed`).
5. **Ready for display** — the collected data is queryable in a shape a future admin dashboard can render without re-fetching Cloudflare. The dashboard itself is **out of scope** of this story.
6. **No new public surface** — stats are internal; nothing exposed on the public site or public API.

## Out of scope

- Admin dashboard UI / charts / views (future story).
- **ADR for the overall architecture — deferred** until the dashboard story is created.
- Public API endpoints.
- Any new Cloudflare tokens or permission grants (the existing zone token already holds Analytics:Read and is already wired to the backend container for publish purges).

## Technical guidance (pointer, not decisions — the ADR settles these)

- Candidate shape: `backend/cloudflare/` app — GraphQL client (both proven queries: 1d zone rollup + adaptive per-host cacheStatus, Free-plan limits as named constants), snapshot model with idempotent upserts via `services.py` pattern, hourly collection command.
- Collection runs on usrv-01 (systemd timer or cron, like the watchdog), not in CI.
- Conventions: `tests/cloudflare/` with fixtures recorded from the real API shape; ruff clean; `make check` gate.
- Open questions for the ADR: model granularity (date×host×status vs. raw events), retention policy, deploy-marker overlay source (`.last-deploy.json` history), failure alerting (heartbeat?), and whether the hourly poller should eventually be replaced by the deploy-time collection in `deploy.sh`.

## Notes

- Dataset constraints (verified 2026-09-16, **corrected 2026-09-26**): `httpRequestsAdaptiveGroups` accepts a `clientRequestHTTPHost` filter + `cacheStatus` dimension and is **complete rather than sampled** at this site's volumes (per-host totals for a 30-day-old day = 1669 vs the 1d rollup's 1667). Range quota = **1 day per query**; **retention = 31 days**, not ~1 day. `httpRequests1dGroups` has **no host filter and no hostname dimension** on this plan, so the zone-wide rollup cannot be narrowed to this site.
- **Re-evaluated 2026-09-26** (`docs/reviews/2026-09-26-cache-analytics-review.md`): the collector's justification shifts — it preserves history **beyond 31 days**, not beyond ~1 day. The ACs stand, but the story loses urgency and stays parked behind the launch gate and the template-ization sprint.
- The bash script remains the ops tool; the collector is the future source of truth.
