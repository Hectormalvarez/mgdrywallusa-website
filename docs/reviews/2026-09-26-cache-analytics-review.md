# Cache analytics review — 2026-09-11 → 2026-09-26

**Scope:** is the US-008 edge cache (ADR-0002) actually working, and can we prove
it with Cloudflare's data? This is the open launch-gate item ("CF cache-stats
proof"). Read-only: no configuration, code, or production change was made.

## Method

- Datasets: `httpRequestsAdaptiveGroups` (per-host + per-`cacheStatus`; this plan
  allows **max 1 day per query**), `httpRequests1dGroups` (zone-wide daily
  rollups), REST zone settings, and the `http_request_cache_settings` ruleset.
- Host under review: `mgdrywallusa.taylormadetech.net` (dev/ssh/webhook hosts
  noted separately). 16 full UTC days at 1-day windows, filtered per host.
- Reproduction: `scripts/cf-cache-stats.sh --days 7`, plus a per-day loop:

  ```sh
  S=$(date -u -d "$i days ago" +%Y-%m-%dT00:00:00Z)
  E=$(date -u -d "$i days ago 1 day" +%Y-%m-%dT00:00:00Z)
  # httpRequestsAdaptiveGroups(limit:200,
  #   filter:{datetime_geq:$s, datetime_lt:$e,
  #           clientRequestHTTPHost:"mgdrywallusa.taylormadetech.net"})
  #   { count dimensions { cacheStatus } }
  ```

## Per-day cache status, site only

`served-from-edge` = (`hit` + `revalidated`) / (`hit`+`revalidated`+`expired`+`miss`).
`byp/dyn` = `bypass` + `dynamic` (not eligible for cache). `none` = no cache status.

```
DATE          hit revalid expired  miss  none byp/dyn CACHEABLE   served-from-edge
2026-09-11      7     20      0     3     1     46        30     90.0%
2026-09-12      1      0      1     4    29    335         6     16.7%
2026-09-13      0      0      0     0     4      3         0      0.0%
2026-09-14      0      0      0    37     1     13        37      0.0%
2026-09-15     41      2      4    53    14     19       100     43.0%   <- US-008 deployed
2026-09-16     57      5     25    30    21      4       117     53.0%
2026-09-17     12      0     12    77    18      2       101     11.9%
2026-09-18      0      0      8    53     6      2        61      0.0%
2026-09-19      0      0      1     0     0      0         1      0.0%
2026-09-20      0      0      0    10     4      0        10      0.0%
2026-09-21     12      0      2    32     2      0        46     26.1%
2026-09-22      0      0      0    44     3      0        44      0.0%
2026-09-23      0      0      1     0     0      0         1      0.0%
2026-09-24      0      0      1     0     0      0         1      0.0%
2026-09-25     16     17     20     3     5      0        56     58.9%
2026-09-26      1      0      0     4   ~0    ~7         5     20.0%   <- partial; 4 deploys
```

Totals 09-11→09-25: 146 hit + 44 revalidated of 611 cacheable = **31.1%**.
Per-day values swing 0–59% purely with traffic shape. Distinct statuses seen
across the window: `none`, `miss`, `expired`, `hit`, `dynamic`, `revalidated`,
`bypass` — and **never `updating` or `stale`**.

## Findings

### F1 — HTML caching works (positive; the launch-gate evidence)

- Before US-008, HTML had **zero** hits (09-14: 37 cacheable requests, all `miss`).
- After 09-15 the HTML routes show `hit`/`expired`/`revalidated` (09-25 alone:
  `/portfolio` expired×5, four `/portfolio/<slug>` pages expired 2–3× each).
- Hashed static assets serve from cache repeatedly: live check gave three
  consecutive `cf-cache-status: HIT` on `/_next/static/chunks/2-0vvqy3h1t5y.css`
  with `Age: 232`; 09-25 analytics show 8 `hit` for each of two chunks.
- Images (`/media/images/*.fill-800x600.png`) MISS→HIT (`Age: 0`) and later
  `revalidated` (304), consistent with their `max-age=86400`.

### F2 — `expired` dominates HTML because the edge TTL is 300s

With sparse traffic, consecutive requests are almost always >5 min apart, so the
object is always stale on arrival. Observed `expired`/`miss` by day: 09-15 4/53,
09-16 25/30, 09-17 12/77, 09-18 8/53. This is structural, not a misconfiguration.

### F3 — `stale-while-revalidate=86400` is **inert**; `s-maxage` is why

`frontend/src/proxy.ts` sends `public, s-maxage=300, stale-while-revalidate=86400`.
Cloudflare's Revalidation docs list the directives that **prevent** stale serving
(per RFC 9111 §4.2.4): `must-revalidate`, `proxy-revalidate`, **`s-maxage`**,
`no-cache` — "If any of these directives are present alongside
stale-while-revalidate, Cloudflare will not serve stale content — **requests will
return `EXPIRED` instead of `UPDATING`**."

Evidence (three independent signals):

1. Live probe of `/` **after** its TTL expired: `cf-cache-status: EXPIRED`, and
   **no `Age` header** — CF sets `Age` only on `HIT`/`STALE`/`UPDATING`.
2. **Zero** `updating`/`stale` responses in 16 days / ~1,100 requests.
3. The docs above.

Consequence: every revisit more than 5 minutes apart pays a full origin round trip
(SSR + 2 Django fetches). The SWR directive currently buys nothing.

CF documents the fix (Revalidation → "Workaround for different edge and browser
TTLs"): do **not** use `s-maxage`; send `max-age` + `stale-while-revalidate` from
the origin and set **Edge Cache TTL** in the Cache Rule to override it.

**Trade-off:** once stale serving is live, a *failed publish purge* degrades to
staleness bounded by the SWR window (up to 86400s) instead of the current 300s.
ADR-0002 explicitly relies on the 5-minute TTL as the failure-mode fallback, so
either shorten the SWR window (e.g. 600s) or accept blocking revalidation.

### F4 — Every deploy purges the whole cache (`purge_everything`)

`deploy.sh` Step 9 purges everything after the health check (ADR-0002 §4, accepted:
"briefly drops edge warmth… revisit purge-by-URL if the page count or edit
frequency grows"). Now quantified: on 09-26 four deploys produced `hit=1, miss=4`
and a **cold** CSS chunk (live `MISS`, `HIT` with `Age: 232` only after warming).
Hashed `/_next` assets never change under a stable URL, so they are the main
collateral damage. Narrowing to HTML-route purges keeps the protection that
matters (old HTML referencing deleted chunk filenames).

### F5 — Traffic volume is too low for a hit-rate KPI

Site requests per day ranged **1–61** (~72/day including non-cacheable); the same
zone serves 672–1,124/day for `taylormadetech.net`. Two consequences:

- The **zone-wide** number the script headlines (`1.3%` over 7 days, `3.3%`
  baseline over 30 days) measures the *other* sites in the zone, not this one.
- Day-level hit rates are dominated by traffic *shape*: crawler days hit many
  distinct URLs once each (09-22: 44 misses, 0 hits; one image path 8× `miss`),
  while repeat-visit days cache well (09-25 58.9%).

### F6 — Corrections to two prior assumptions

- **US-011's premise is wrong.** It states Cloudflare's per-host dataset "only
  retains ~1 day on the Free plan". Actual retention: **31 days** — the API
  rejects older data with `"cannot request data older than 4w3d"`. The real
  constraint is **max 1 day per query**. Completeness at the retention edge was
  cross-checked: per-host adaptive totals 30 days back sum to 1669 requests vs
  `httpRequests1dGroups` 1661 for the same UTC day. So US-011's benefit is
  *history beyond 31 days*, not beyond 1 day.
- **US-011's "74.4% of cacheable traffic" is inflated**: it counted `expired` as
  served-from-edge. Per CF, `EXPIRED` waited for the origin (`Age` absent).
  Corrected 09-16 figure: (57 hit + 5 revalidated) / 117 = **53%**. The same
  mis-classification exists in `scripts/cf-cache-stats.sh`
  (`if ($1=="hit"||$1=="revalidated"||$1=="expired") e+=$2`).

### F7 — Adjacent findings (not caching)

- **`always_use_https: off`** — `http://mgdrywallusa…/` returns **200**, no
  redirect. A business site should force HTTPS. Zone-wide toggles affect every
  host in the zone, so prefer a host-scoped Redirect Rule.
- **Tiered Cache: off** (API reports `editable:false`). With multi-POP crawler
  traffic and per-POP cold fills, tiered caching would cut duplicate origin fills.
- `favicon.svg` carries `max-age=0` → never edge-cached (3 `miss` on 09-25).
- Media renditions carry `Vary: Origin` (Django CORS) — harmless today (`HIT`
  verified) but a cache-key smell.
- **The zone is shared** by several other sites → zone-level changes have
  cross-project blast radius; the per-host Cache Rule is the safe unit of change
  (already how it is built). Important input for the template-ization work.
- Bot-challenge traffic is a visible share of the low-volume mix
  (`/cdn-cgi/challenge-platform/…`, `/cdn-cgi/rum`).

## Pending Cloudflare dashboard actions (API token lacks these scopes)

1. **Host-scoped Always-Use-HTTPS redirect** — `http://` returns 200 with no
   redirect (F7). The zone-level `always_use_https` toggle would affect every
   host in this shared zone, so scope it to this site with a Redirect Rule:
   - Dashboard: zone → Rules → Redirect Rules → Create rule
   - Name: `mgdrywall-https-redirect`
   - When incoming requests match:
     `(http.host eq "mgdrywallusa.taylormadetech.net" or http.host eq "mgdrywallusa-dev.taylormadetech.net") and not ssl`
   - Then: Static redirect to expression
     `concat("https://", http.host, http.request.uri.path)`, status `301`,
     **preserve query string** enabled.
   - The `mgdrywall-ssh` deploy hostname is deliberately excluded (it is a
     TCP/Access app, not HTTP).
   - API attempt failed with `request is not authorized` — the token has no
     Dynamic Redirect permission.
2. **Smart Tiered Cache** — currently `off` (F7). Zone-level, so it affects the
   other sites here: enable deliberately (Caching → Tiered Cache → Smart Tiered
   Cache) and confirm the other sites' origins still behave.

## Verdict

HTML caching is **verifiably working** (F1) — that is the proof the launch gate
asked for, and it is stronger as *per-host status evidence* than as a hit-rate
percentage, which at 1–61 requests/day is not yet meaningful (F5). The material
finding is F3: the edge design's stale-serving component never engages, so origin
load and TTFB are not what the design intended. F6 corrects two published
numbers, one of which changes a parked story's rationale.

## Recommended order (all require a decision — nothing applied here)

1. **(Code, project-scoped)** Make stale-serving real: `max-age` + SWR in
   `proxy.ts`, and Edge Cache TTL override (300s) in `cf-cache-rule.sh`. Decide
   the SWR window against ADR-0002's 5-minute failure-mode fallback. Ships with
   proxy tests + an ADR-0002 revision note.
2. **(Tool, project-scoped)** Fix `cf-cache-stats.sh`: per-host headline, count
   only `hit`+`revalidated` as served-from-edge, report `expired` separately.
3. **(Docs)** Correct US-011 (31-day retention; 53% not 74.4%) and re-evaluate
   whether it stays parked.
4. **(CF config)** Host-scoped Always-Use-HTTPS redirect; Smart Tiered Cache.
5. **(Code, project-scoped)** Narrow the deploy purge to HTML routes (revisit).
6. **(Minor)** Give `/favicon.svg` a real cache TTL.


