# ADR 0003 — Store Cloudflare cache stats in our Postgres, display them in the admin

Date: 2026-09-27 · Status: Accepted
Relates to: US-011 (`docs/stories/US-011-cloudflare-cache-analytics.md`) — the ADR that
story deferred · measures the design in ADR-0002.

## Context

### Problem

Cloudflare's per-host analytics (`httpRequestsAdaptiveGroups`) is the only source of
cache-status data for this site, and Cloudflare **discards it after ~31 days**
(`cannot request data older than 4w3d`). Nothing is persisted today, so history older than
that is lost permanently, and there is no way to show the owner how the site's caching
performs over time — the 2026-09-26 review had to reconstruct 16 days of numbers by hand
from the API.

### Verified dataset facts (live against the production zone, 2026-09-27)

- One query accepts **up to 4w2d (30 days)**; a 31-day range is rejected
  (`cannot request a time range wider than 4w2d … your query time range spans 4w3d`).
  With `dimensions { date, cacheStatus }` a multi-day range returns per-day rows.
- Per-host `sum { edgeResponseBytes visits }` are valid; `sum { requests }` is **not**
  (`unknown field "requests"`) — request counts come from `count`.
- `httpRequests1dGroups` exposes no hostname filter or dimension on this plan, so a
  zone-wide rollup can never be narrowed to this site.
- Data is bucketed by **UTC day**.

### Decision drivers

- **Irreversibility:** once Cloudflare's window closes, the data cannot be recovered by any
  means. Cheap insurance now beats certain loss later.
- **Correct scope:** the zone is shared with other sites, so zone-wide figures are not this
  site's metrics (measured 2026-09-26: this site 1–61 requests/day vs another host
  672–1124/day).
- **Metric definitions change:** the ops script already counted `expired` responses as
  cache-served, overstating the benefit by ~21 points (74.4% → 53%). Evolving definitions
  argue for keeping raw data, not only derived rows.
- **Owner-facing:** the owner asked to see this without logging into Cloudflare or running a
  script, in the tool they already use.
- **No new cost surface:** the backend container already holds `CLOUDFLARE_API_TOKEN` and
  `CLOUDFLARE_ZONE_ID` for publish purges, so no new token, scope or grant is needed;
  PostgreSQL 16 is already in the stack and already covered by backups; no frontend
  dependency may be added for a chart.

## Decision

**Persist Cloudflare's per-host cache analytics in our own database, and surface them as a
Wagtail admin report.**

1. **Storage:** the project's PostgreSQL (the content database — backups already cover it),
   in a new app `backend/cloudflare/`. Deliberately provider-specific.
2. **Shape — long rows, not wide:** `CacheDailyStat(date, host, cache_status, requests,
   edge_bytes, visits)` with a unique constraint on `(date, host, cache_status)`, so every
   write is an idempotent upsert and a new cache status needs no migration. Alongside it:
   - `CacheStatRun` — one row per collection attempt (status ok/partial/failed, window,
     rows written, error), a heartbeat that makes "is the collector alive?" answerable and
     drives the staleness indicator;
   - `CacheStatPayload` — the **raw JSON response per `(date, host)`**, an expiry hedge so
     future metrics and re-derivations (`--rebuild`) remain possible after Cloudflare's
     window closes.
3. **Collection:** `manage.py collect_cache_stats`, driven by **one host cron line**
   (following `scripts/watchdog.sh` conventions), **never in CI**. **One GraphQL call per
   run** covering the whole window (up to 30 days), so every run re-fetches and thereby
   self-heals missed runs. A failed fetch never raises: it is recorded as a failed
   `CacheStatRun` and logged.
4. **Cadence:** **daily at 00:10 UTC** by default, and configurable. Cloudflare buckets by
   UTC day, so more frequent polling adds no resolution — hourly would only buy
   "today so far" visibility and slightly faster failure detection, both already covered by
   the 30-day self-healing window and the staleness indicator. Changeable without code
   changes: the cron line, `CLOUDFLARE_STATS_WINDOW_DAYS` (default 30, clamped to 4w2d) and
   `CLOUDFLARE_STATS_STALE_AFTER_HOURS` (default 26).
5. **Display:** a Wagtail admin report at `/admin/traffic/` built on Wagtail's `ReportView`
   (composed of `SpreadsheetExportMixin` + `PermissionCheckedMixin` + `BaseListingView`,
   which supplies CSV/Excel export and permission gating), plus a small homepage panel.
   Charts are **server-rendered inline SVG** — no new JavaScript dependency. Access is
   superuser-only initially via `AdminOnlyMenuItem` (`MenuItem` has no permission kwarg),
   with the model permission policy wired so access can be granted later.
6. **Retention:** keep rows indefinitely (a handful per day, tens of KB/year). `--prune-days`
   exists but is not scheduled.

## Considered options

- **Status quo (store nothing):** zero cost today, but history is irreversibly lost at 31
  days and the owner must run a script to see anything. Rejected — it is the whole point.
- **Provider-agnostic `analytics/` app with an abstraction layer:** rejected. Portability is
  already achieved by configuration (host from the default Wagtail `Site`, zone/token from
  env); an indirection layer is cost with no second provider to justify it.
- **Wide row (one column per cache status):** rejected. Every new Cloudflare status becomes
  a migration, and the `expired` vs `updating`/`stale` semantics are still evolving.
- **A single JSONB blob per day as the only store:** rejected. Fewest rows, but every figure
  needs JSON traversal and DB-level aggregation and indexing are lost. (Retained as a
  *supplement*: raw payloads sit alongside the derived rows as the expiry hedge.)
- **Hourly collection:** rejected as the default. No resolution gain (daily buckets), more
  calls and more heartbeat rows; the original justification rested on a 1-day query range
  that turned out to be 30 days.
- **Query Cloudflare at display time:** rejected — needs live credentials on every page
  load, is slow, breaks when the API is unavailable, and still loses history permanently.
- **A bundled JS chart library (e.g. Chart.js):** rejected — a new frontend dependency plus
  CDN/CSP surface for one sparkline, when server-rendered SVG needs nothing.

## Consequences

- (+) History survives Cloudflare's ~31-day expiry, so month-over-month trends become
  possible instead of being reconstructed by hand.
- (+) Figures are site-specific by construction: the zone-wide rollup is never a source, so
  another site's traffic cannot inflate this site's numbers.
- (+) Cache performance becomes visible to the owner in the tool they already use, with CSV
  export for their own reporting.
- (+) Raw payloads keep future metrics derivable — which already mattered once, when the
  `expired` definition had to be corrected.
- (+) No new Cloudflare token, scope, permission grant or piece of infrastructure.
- (+) Client-agnostic by construction (host from `Site`, config from env), so the pattern
  carries into template clones with no code change.
- (−) A new scheduled job on the host is another thing that can silently stop. Mitigated by
  the run heartbeat and the staleness banner, but it remains an ops surface to watch.
- (−) Raw payloads duplicate what Cloudflare already holds for 31 days. Accepted: under
  ~1 MB/year at this volume.
- (−) The admin report is a new UI surface to maintain, and its chart is hand-rolled.
- (−) With a daily cadence, "today" is not final until the following day. Mitigated by
  labelling the current UTC day as in progress so a partial day is never misread as a
  traffic collapse.
- (−) Correctness depends on the status classification being right; the unique constraint
  prevents duplicates but not a wrong definition. Hence the raw-data hedge and an explicit
  acceptance criterion covering classification.

## Technical implementation guidance

- `backend/cloudflare/` owns the models, `services.py` (fetch + store), the management
  command, `wagtail_hooks.py` and the report view. Keep views thin — the service does the
  work and never raises.
- Default host = the default Wagtail `Site` hostname, the same derivation
  `portfolio/signals.py` uses for purge URLs. Zone and token come from the environment; no
  client-specific hostname may be hardcoded.
- `requests` is declared explicitly in `backend/requirements.txt` (already in the image via
  Wagtail, so no install cost).
- The collector must not be added to CI, and CI must not receive analytics credentials.
- Chart rendering stays dependency-free, server-rendered SVG. No CDN, no new npm package.
- Tests mirror the app under `tests/cloudflare/`; the API call is mocked with
  `unittest.mock.patch` (the repo has no `responses`/`requests_mock`). Gate: `make check`.
- Follow-up recorded: `scripts/cf-cache-stats.sh`'s per-day query loop is now redundant
  (a single query covers the window) — collapsing it belongs to Phase 1 of US-011. Its
  header comment carried the incorrect "1 day per query" claim, corrected on 2026-09-27
  along with the same figure in `docs/reviews/2026-09-26-cache-analytics-review.md`.

