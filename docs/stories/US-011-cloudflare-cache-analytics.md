# US-011 — Cloudflare cache analytics: recorded history

**Status:** APPROVED · Story created 2026-09-16 · **Revised 2026-09-27** (AC1 cadence, dataset corrections, locked design) · **ADR-0003 written 2026-09-27** — the previously deferred ADR now exists · Design locked; implementation queued **after the launch gate** (US-002, US-004, US-005)
**Follows:** US-008 (edge caching, live in prod) · discovery session 2026-09-16 · corrected 2026-09-26 (per-host retention is ~31 days, not ~1) and 2026-09-27 (one query accepts **up to 4w2d**, not 1 day)
**Runs through:** the complete flow — story → ADR-0003 → implement → admin UI → persona-code-reviewer → persona-qa → `make check` → deploy → live verification

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
  separately). It still loops one query per day, which the 2026-09-27 correction
  showed is unnecessary — a single query covers up to 30 days. Nothing is
  recorded over time: the per-host dataset retains **31 days**
  (`cannot request data older than 4w3d`, verified 2026-09-26), not the ~1 day
  this story originally assumed.

## Acceptance criteria

1. **History, not snapshots** — **Given** the site has traffic, **when** collection
   runs on schedule over days and weeks, **then** each day's cache status is
   persisted in our database, so the history outlives Cloudflare's ~31-day
   retention and trends beyond that window stay available.
2. **Cadence is configurable** — **Given** the owner wants fresher or cheaper
   collection, **when** the schedule or the backfill window is changed, **then**
   no code change is required, and the admin's data-freshness indicator adapts to
   the new cadence on its own.
3. **Site-specific** — **Given** the Cloudflare zone also serves other sites,
   **when** any figure is displayed or exported, **then** it counts **only this
   site's hostname** — a zone-wide total is never presented as this site's number
   (the ~3.3%/1.3% figures the ops script used to print were zone-wide).
4. **Self-sufficient** — **Given** Cloudflare is unreachable or the token is
   invalid, **when** collection runs, **then** nothing crashes, the failed attempt
   is recorded and logged, previously collected data is untouched, and the admin
   states that the data is stale.
5. **Re-runnable** — **Given** a period was already collected, **when** collection
   runs again over the same period, **then** the stored figures are identical and
   no duplicate rows exist (idempotent, like `seed`).
6. **Classification is correct** — **Given** a day in which cached responses had
   passed their time-to-live, **when** the figures are shown, **then** those
   requests are never counted as served from cache, because an earlier version of
   the ops script did exactly that and overstated the cache benefit by ~21 points
   (74.4% vs the corrected 53%).
7. **Ready for display** — **Given** the collected data, **when** the owner opens
   the report in the admin, **then** they can see cache usage over time and
   download it, without logging into Cloudflare or running a script.
8. **No new public surface** — **Given** the public site and its API, **when**
   analytics are collected and displayed, **then** nothing is newly exposed
   publicly and no new Cloudflare token or permission grant is required.
9. **Edge — a partial day must not read as a collapse** — **Given** the current,
   incomplete UTC day, **when** it appears in the report, **then** it is labelled
   as in progress, so a low count is never mistaken for a drop in traffic.
10. **Edge — collection never runs in CI** — **Given** the automated pipelines,
    **when** they run, **then** they never collect analytics; collection happens
    only on the host, on schedule.

## Out of scope

- Public API endpoints, and anything on the public site.
- Any new Cloudflare tokens or permission grants (the existing zone token already
  holds Analytics:Read and is already wired to the backend container for publish
  purges).
- Provider-agnostic abstraction: the app is deliberately Cloudflare-specific
  (ADR-0003). Portability comes from configuration, not an indirection layer.
- **Deploy-marker overlay** (correlating cache drops with the purges each deploy
  performs) — Phase 3 candidate only. The deploy history it needs does not exist
  yet: `.last-deploy.json` holds only the most recent deploy.

## Technical guidance (design **LOCKED** 2026-09-27 — rationale in ADR-0003)

App: `backend/cloudflare/` — deliberately provider-specific; portability comes from
configuration (host, zone, token), not an indirection layer.

### Verified dataset facts (live against the production zone, 2026-09-27)

- **One query accepts up to 4w2d (30 days).** A 31-day range fails with
  `cannot request a time range wider than 4w2d … your query time range spans 4w3d`,
  while a 5-day range with `dimensions { date, cacheStatus }` returns per-day rows.
  → **one API call per collection run**, not one call per day.
- Per-host sums: `sum { edgeResponseBytes visits }` are **valid**; `sum { requests }`
  is **not** (`unknown field "requests"`) — request counts come from `count`.
- `httpRequests1dGroups` exposes no hostname filter or dimension on this plan, so the
  zone rollup can never be narrowed to this site and must not be presented as its number.
- Cloudflare buckets by **UTC day** and discards data after ~31 days.

### Models

| Model | Purpose |
|---|---|
| `CacheStatRun` | One collection attempt (heartbeat/provenance): started/finished, `status` (ok/partial/failed), `trigger`, `window_days`, `rows_written`, `error`. Makes "is the collector alive?" answerable and drives the staleness banner. |
| `CacheDailyStat` | The data: `date` (UTC), `host`, `cache_status`, `requests`, `edge_bytes`, `visits`. Unique on `(date, host, cache_status)` → idempotent upsert; indexed on `(host, date)`. |
| `CacheStatPayload` | Raw JSONB response per `(date, host)`, upserted. An **expiry hedge**: Cloudflare discards this data after ~31 days, so storing raw keeps future metrics and re-derivations (`--rebuild`) possible without the API. ~1–3 KB/day. |

### Collection

- `cloudflare/services.py`: `fetch_cache_stats(host, days)` — one GraphQL call for the
  whole window; `store_cache_stats(rows, run)` — transactional upsert. Never raises
  (returns a run outcome), logs via `logging`.
- `manage.py collect_cache_stats [--days N] [--host H] [--trigger T] [--dry-run] [--prune-days N]`.
  Idempotent; because every run re-fetches the whole window, a missed run self-heals.
- Default host = the default Wagtail `Site` hostname, the same derivation
  `portfolio/signals.py` already uses for purge URLs → no per-client configuration.
- `scripts/collect-cache-stats.sh` (follows `scripts/watchdog.sh` conventions: `cd "$DIR"`,
  `.env`, `docker compose -p mgdrywall-prod exec -T backend …`) + **one host cron line,
  daily 00:10 UTC** — after the UTC day boundary and Cloudflare's aggregation lag.
  Runs on usrv-01 only, never in CI.
- `requests` added explicitly to `backend/requirements.txt` (already present in the image
  at 2.34.2 via Wagtail; no install cost).

### Configuration (changeable later without touching code)

| Lever | Default | Purpose |
|---|---|---|
| cron schedule | daily 00:10 UTC | collection cadence |
| `CLOUDFLARE_STATS_WINDOW_DAYS` | 30 | backfill depth (clamped to the 4w2d maximum) |
| `CLOUDFLARE_STATS_STALE_AFTER_HOURS` | 26 | when the admin declares the data stale |

Changing the cadence is one cron edit; the freshness indicator follows via the threshold.

### Admin display (Phase 2)

- `cloudflare/views.py`: a `ReportView` subclass at `/admin/traffic/`. Wagtail's
  `ReportView` = `SpreadsheetExportMixin` + `PermissionCheckedMixin` + `BaseListingView`,
  which supplies the listing, CSV/Excel export and permission gating. Access is
  `permission_policy = ModelPermissionPolicy(CacheDailyStat)` with
  `permission_required = "view"` — an **action name**, not a Django permission string.
- Content: KPI cards (served-from-edge share, hits/misses/expired/stale, requests, bytes
  from edge vs origin), per-day table, last-run status, staleness banner, and the current
  UTC day labelled **"in progress"**. The chart is **server-rendered inline SVG** — no new
  JS dependency and no CDN, matching the existing inline-style admin precedent.
- Homepage panel: its own `Component` on `construct_homepage_panels` (order 20) from
  `cloudflare/wagtail_hooks.py` — deliberately **not** merged into `site_settings`'
  Operations panel, so the apps stay decoupled.
- Menu entry is superuser-only via `AdminOnlyMenuItem` (`MenuItem` itself has no
  permission kwarg); the permission policy is still wired so access can be granted later.

### Phases

1. **Collector** — models + migration + service + command + wrapper/cron + tests.
2. **Admin display** — report view + template + homepage panel + hooks + tests.
3. **Candidates (not planned)** — deploy-marker overlay, raw-payload CSV export, pruning policy.

### Conventions and gate

Tests mirror the app under `tests/cloudflare/`: `test_models.py` (constraint/upsert),
`test_services.py` (HTTP call mocked with `unittest.mock.patch` — the repo has **no**
`responses`/`requests_mock`), `test_commands.py` (idempotency: same period twice →
identical rows; failure never raises), `test_hooks.py` (no dead `"#"` menu links),
`test_report_view.py` (permission gating, export, staleness banner). Plus a
`CacheDailyStatFactory` in `tests/factories.py`, and a cross-check that a collected day
matches `scripts/cf-cache-stats.sh` for the same day. Gate: `make check`.

## Notes

- Dataset constraints (verified 2026-09-16, **corrected 2026-09-26 and 2026-09-27**):
  `httpRequestsAdaptiveGroups` accepts a `clientRequestHTTPHost` filter plus
  `cacheStatus` **and `date`** dimensions, and is **complete rather than sampled** at this
  site's volumes (per-host totals for a 30-day-old day = 1669 vs the 1d rollup's 1667).
  **Retention ≈ 31 days** (`cannot request data older than 4w3d`), and **max range = 4w2d
  per query** — not the "1 day per query" this story originally assumed and which was
  carried into `scripts/cf-cache-stats.sh` and the 2026-09-26 review doc.
  `httpRequests1dGroups` has **no host filter and no hostname dimension** on this plan, so
  the zone-wide rollup cannot be narrowed to this site.
- **Re-evaluated 2026-09-26** (`docs/reviews/2026-09-26-cache-analytics-review.md`): the
  collector's justification is preserving history **beyond 31 days**, not beyond 1 day.
- The bash script stays the ad-hoc ops tool; the collector becomes the source of truth. Its
  per-day loop is now redundant (one query covers the whole window) — collapsing it is part
  of Phase 1, and its header comment was corrected during pre-work.

## Pre-work done 2026-09-27 (design only — no code written)

- **This story revised:** AC1 recast from a mandated *hourly* cadence to a scheduled,
  configurable cadence with a daily default — Cloudflare buckets this data by UTC day, so
  more frequent polling adds no resolution, and the 30-day window already self-heals missed
  runs. ACs converted to the project's Given/When/Then form, with two edge cases added.
  The design is locked in Technical guidance, and the admin display moved **in scope** as
  Phase 2.
- **ADR-0003 written** — `docs/adr/0003-store-cloudflare-cache-stats-in-postgres.md`, the
  ADR this story previously deferred.
- **Two shipped-document errors corrected:** the "1 day per query" claim in this story, in
  `scripts/cf-cache-stats.sh`'s header comment, and in
  `docs/reviews/2026-09-26-cache-analytics-review.md` (verified live against the zone: the
  real limit is 4w2d).
- Implementation is queued **after the launch gate** (US-002, US-004, US-005) and runs the
  complete flow recorded at the top of this story.
