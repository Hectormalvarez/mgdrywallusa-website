# US-011 — Cloudflare cache analytics: recorded history

**Status:** APPROVED · Story created 2026-09-16 · Implementation not started · **ADR: deferred** (to be written with the future dashboard story)
**Follows:** US-008 (edge caching, live in prod) · discovery session 2026-09-16 (adaptive GraphQL supports per-host + per-cacheStatus on Free plan; 1-day range quota)

---

## Story

**As the** business owner,
**I want** a record of how my website's traffic is being served (from Cloudflare's edge cache vs. from the server)
**so that** I can see whether the site stays fast as traffic grows, and I can prove whether the caching work is paying off — without logging into Cloudflare or running scripts.

## Background (from US-008 + 2026-09-16 findings)

- Baseline hit rate (zone-wide, 30d at capture): **3.3%**.
- Live verification: HTML now caches at the edge; first 24h of site-specific data shows **74.4% of cacheable traffic served from edge cache** (`hit` 57 + `expired` 25 + `revalidated` 5 of 117 cacheable requests).
- Today that visibility lives in `scripts/cf-cache-stats.sh`, run by hand, printing to stdout. Nothing is recorded over time; Cloudflare's own per-host dataset only retains ~1 day on the Free plan.

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

- Free-plan dataset constraints (verified 2026-09-16, see `scripts/cf-cache-stats.sh`): `httpRequestsAdaptiveGroups` accepts `clientRequestHTTPHost` filter + `cacheStatus` dimension; range quota = 1 day per query; 1d rollups are zone-wide only.
- The bash script remains the ops tool; the collector is the future source of truth.
