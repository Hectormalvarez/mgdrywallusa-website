#!/bin/sh
# cf-cache-stats.sh — Cloudflare cache report for ONE site in a shared zone.
#
# Sections, in reading order:
#   1. Per-host cache-status breakdown for the site   <- the HEADLINE
#   2. Zone-wide daily rollup (ALL hostnames — NOT a site metric)
#   3. Zone settings + Cache Rules relevant to caching
#
# Why per-host is the headline: `httpRequests1dGroups` (the zone rollup)
# cannot be filtered or grouped by hostname — only the adaptive dataset
# exposes `clientRequestHTTPHost`. This zone also serves other sites, so its
# zone-wide hit rate says nothing about this one (measured 2026-09-26: this
# site 1-61 req/day vs taylormadetech.net 672-1124 req/day).
#
# Plan constraints (verified 2026-09-26; range limit CORRECTED 2026-09-27):
#   - adaptive dataset: one query accepts up to 4w2d (30 days) — a 31-day range
#     is rejected ("cannot request a time range wider than 4w2d"). So the loop
#     below (N x 1-day windows for `--days N`) is now REDUNDANT: a single query
#     with `dimensions { date, cacheStatus }` covers the whole window. Collapsing
#     it is part of US-011 Phase 1 (see ADR-0003); this script keeps looping
#     until then. The "1 day per query" claim previously in this header was wrong.
#   - retention is ~31 days ("cannot request data older than 4w3d") — N is
#     clamped to 31, so the oldest day sits right at the retention edge.
#   - the adaptive dataset is complete at these volumes, not sampled: per-host
#     totals for a 30-day-old day = 1669 vs the 1d rollup's 1667 that day.
#   - firewallEventsAdaptiveGroups requires a paid plan — skipped.
#
# Cache-status classification (Cloudflare docs, 2026-09-26):
#   hit, revalidated    -> served from the edge cache
#   expired             -> was cached, TTL had passed, and the request WAITED
#                          for the origin (no Age header on such responses) —
#                          this is NOT a cache-served request
#   miss                -> not cached; fetched from origin and stored
#   none/bypass/dynamic -> no cache status / not eligible for cache
#   updating, stale     -> served stale while revalidating in the background
#                          (stale-while-revalidate engaged). Never observed
#                          while the origin sent `s-maxage` (which implies
#                          proxy-revalidate and forces EXPIRED); expected
#                          after the 2026-09-26 directive fix.
# `expired` must never be counted as served-from-edge: an earlier version of
# this script did, inflating the headline (docs/reviews/2026-09-26-cache-
# analytics-review.md, F6).
#
# Required environment (also read from .env in the project root if set):
#   CLOUDFLARE_API_TOKEN — zone-scoped token: Zone.Analytics:Read,
#                          Zone.Settings:Read (+ Zone.Cache Purge for other
#                          consumers of the same token)
#   CLOUDFLARE_ZONE_ID   — the zone ID
#
# Usage: scripts/cf-cache-stats.sh [--days N]     (default 30, max 31)
#        CF_STATS_HOST=other.host to switch site (default below)
#
# Token is never echoed; all requests are read-only.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

HOSTNAME="${CF_STATS_HOST:-mgdrywallusa.taylormadetech.net}"
MAX_DAYS=31

DAYS=30
while [ $# -gt 0 ]; do
  case "$1" in
    --days) DAYS="$2"; shift 2 ;;
    *) echo "Unknown arg: $1" >&2; exit 2 ;;
  esac
done
if [ "$DAYS" -gt "$MAX_DAYS" ]; then
  echo "→ --days $DAYS exceeds the ${MAX_DAYS}-day retention; using ${MAX_DAYS}." >&2
  DAYS="$MAX_DAYS"
fi

# ── Credentials ────────────────────────────────────────────────────
# Read ONLY the two CF vars from .env (never echo the file or values).
if [ -z "${CLOUDFLARE_API_TOKEN:-}" ] || [ -z "${CLOUDFLARE_ZONE_ID:-}" ]; then
  if [ -f "$PROJECT_DIR/.env" ]; then
    CLOUDFLARE_API_TOKEN="${CLOUDFLARE_API_TOKEN:-$(grep -E '^CLOUDFLARE_API_TOKEN=' "$PROJECT_DIR/.env" | head -1 | cut -d= -f2-)}"
    CLOUDFLARE_ZONE_ID="${CLOUDFLARE_ZONE_ID:-$(grep -E '^CLOUDFLARE_ZONE_ID=' "$PROJECT_DIR/.env" | head -1 | cut -d= -f2-)}"
  fi
fi

[ -n "${CLOUDFLARE_API_TOKEN:-}" ] || { echo "✗ CLOUDFLARE_API_TOKEN not set (env or .env)" >&2; exit 1; }
[ -n "${CLOUDFLARE_ZONE_ID:-}" ] || { echo "✗ CLOUDFLARE_ZONE_ID not set (env or .env)" >&2; exit 1; }

API="https://api.cloudflare.com/client/v4"
AUTH="Authorization: Bearer ${CLOUDFLARE_API_TOKEN}"
CT="Content-Type: application/json"

info() { printf "\n\033[0;36m▶ %s\033[0m\n" "$1"; }

# ── 1. Per-host cache status — THE HEADLINE ────────────────────────
info "Cache status — ${HOSTNAME} (site only, last ${DAYS} day(s))"

ROWS=""
WINDOWS_FAILED=0
i=0
while [ "$i" -lt "$DAYS" ]; do
  SINCE=$(date -u -d "$i days ago" +%Y-%m-%dT00:00:00Z 2>/dev/null || date -u -v-"${i}"d +%Y-%m-%dT00:00:00Z)
  UNTIL=$(date -u -d "$i days ago 1 day" +%Y-%m-%dT00:00:00Z 2>/dev/null || date -u -v-"$((i - 1))"d +%Y-%m-%dT00:00:00Z)
  DAY=$(date -u -d "$i days ago" +%Y-%m-%d 2>/dev/null || date -u -v-"${i}"d +%Y-%m-%d)
  AQ=$(jq -n --arg z "$CLOUDFLARE_ZONE_ID" --arg s "$SINCE" --arg e "$UNTIL" --arg h "$HOSTNAME" '
    {query: "query($zone: String!, $s: Time!, $e: Time!, $h: String!) { viewer { zones(filter: {zoneTag: $zone}) { httpRequestsAdaptiveGroups(limit: 200, filter: {datetime_geq: $s, datetime_lt: $e, clientRequestHTTPHost: $h}) { count dimensions { cacheStatus } } } } }",
     variables: {zone: $z, s: $s, e: $e, h: $h}}')
  ARESP=$(curl -sf "$API/graphql" -H "$AUTH" -H "$CT" --data "$AQ") || { WINDOWS_FAILED=$((WINDOWS_FAILED + 1)); i=$((i + 1)); continue; }
  PART=$(printf '%s' "$ARESP" | jq -r --arg d "$DAY" \
    '.data.viewer.zones[0].httpRequestsAdaptiveGroups[]? | "\($d)\t\(.dimensions.cacheStatus)\t\(.count)"')
  if [ -n "$PART" ]; then
    ROWS=$(printf '%s\n%s' "$ROWS" "$PART")
  fi
  i=$((i + 1))
done

printf '%s\n' "$ROWS" | awk -F'\t' '
  function flush() {
    if (cur != "") {
      cacheable = hit + reval + expired + miss
      printf "%-12s %6d %8d %8d %7d %6d %7d %6d %10d   %6.1f%%\n", \
        cur, hit, reval, expired, miss, none, stale, other, cacheable, \
        (cacheable > 0 ? (hit + reval) * 100 / cacheable : 0)
      th += hit; tr += reval; te += expired; tm += miss; tn += none
      ts += stale; to += other
    }
  }
  { if ($1 != cur) { flush(); cur = $1; hit = reval = expired = miss = none = stale = other = 0 }
    if ($2 == "hit") hit += $3
    else if ($2 == "revalidated") reval += $3
    else if ($2 == "expired") expired += $3
    else if ($2 == "miss") miss += $3
    else if ($2 == "none") none += $3
    else if ($2 == "updating" || $2 == "stale") stale += $3
    else other += $3 }
  END { flush()
    cacheable = th + tr + te + tm
    printf "%-12s %6d %8d %8d %7d %6d %7d %6d %10d   %6.1f%%\n", "TOTAL", th, tr, te, tm, tn, ts, to, cacheable, \
      (cacheable > 0 ? (th + tr) * 100 / cacheable : 0) }
' | awk 'BEGIN { printf "%-12s %6s %8s %8s %7s %6s %7s %6s %10s   %s\n", "DATE", "hit", "revalid", "expired", "miss", "none", "stale", "othr", "CACHEABLE", "SERVED-FROM-EDGE" } 1'

echo "  served-from-edge = hit + revalidated. 'expired' means the object was in"
echo "  cache but past its TTL, so the request waited for the origin — not a hit."
echo "  'stale' = updating + stale: the edge served the old copy while revalidating"
echo "  in the background. Only the first request after a TTL expiry lands here,"
echo "  so a quiet day shows 0 — an empty column is not evidence of a problem."
echo "  'othr' = bypass + dynamic (not eligible for cache)."
[ "$WINDOWS_FAILED" -eq 0 ] || echo "  ⚠ ${WINDOWS_FAILED} day-window(s) could not be fetched — totals cover the rest."

# ── 2. Zone-wide daily rollup (context, NOT a site metric) ─────────
# The 1d dataset exposes no hostname dimension or filter on this plan, so this
# is every hostname in the zone — including other sites. Shown for context
# only: do NOT read the hit% below as this site's hit rate.
ZONE_SINCE=$(date -u -d "$DAYS days ago" +%Y-%m-%d 2>/dev/null || date -u -v-"${DAYS}"d +%Y-%m-%d)
ZONE_UNTIL=$(date -u +%Y-%m-%d)
info "Zone-wide daily rollup (ALL hostnames; context only) UTC ${ZONE_SINCE} → ${ZONE_UNTIL}"

QUERY=$(jq -n --arg z "$CLOUDFLARE_ZONE_ID" --arg s "$ZONE_SINCE" --arg u "$ZONE_UNTIL" '
  {query: "query($zone: String!, $since: Date!, $until: Date!) { viewer { zones(filter: {zoneTag: $zone}) { httpRequests1dGroups(limit: 60, filter: {date_geq: $since, date_lt: $until}, orderBy: [date_ASC]) { dimensions { date } sum { requests cachedRequests cachedBytes bytes } } } } }",
   variables: {zone: $z, since: $s, until: $u}}')
RESP=$(curl -sf "$API/graphql" -H "$AUTH" -H "$CT" --data "$QUERY") || {
  echo "✗ GraphQL request failed (check token/permissions)" >&2; exit 1;
}

echo "$RESP" | jq -r '.data.viewer.zones[0].httpRequests1dGroups[]
  | "\(.dimensions.date)\t\(.sum.requests)\t\(.sum.cachedRequests)\t\(.sum.bytes)\t\(.sum.cachedBytes)"' \
| awk -F'\t' 'BEGIN{
    printf "%-12s %10s %10s %8s %15s %15s\n","DATE","REQS","CACHED","HIT%","BYTES","CACHED BYTES"}
  {r+=$2; c+=$3; b+=$4; cb+=$5
   pct=($2>0)?$3*100/$2:0
   printf "%-12s %10s %10s %7.1f%% %15s %15s\n",$1,$2,$3,pct,$4,$5}
  END{
    printf "%-12s %10s %10s %7.1f%% %15s %15s\n","TOTAL",r,c,(r>0?c*100/r:0),b,cb}'

# ── 3. Zone settings relevant to caching ───────────────────────────
info "Zone settings (caching-relevant)"
SETTINGS=$(curl -sf "$API/zones/$CLOUDFLARE_ZONE_ID/settings" -H "$AUTH") || {
  echo "  (✗ token lacks Zone Settings:Read — skipping)"
}
if [ -n "$SETTINGS" ]; then
  echo "$SETTINGS" | jq -r '.result[]
    | select(.id as $id |
      ["cache_level","browser_cache_ttl","always_online","development_mode",
       "http3","0rtt","early_hints","rocket_loader","minify"] | index($id))
    | "\(.id)\t\(.value)"' \
  | awk -F'\t' 'BEGIN{printf "%-24s %s\n","SETTING","VALUE"}
    {printf "%-24s %s\n",$1,$2}'
fi

info "Cache rules (first match wins, per setting)"
curl -sf "$API/zones/$CLOUDFLARE_ZONE_ID/rulesets/phases/http_request_cache_settings/entrypoint" -H "$AUTH" \
  | jq -r '.result.rules[]? | "\(.description // "(unnamed)")\t\(.enabled)\t\(.expression)"' \
  | awk -F'\t' 'BEGIN{printf "%-44s %-5s %s\n","RULE","ON","EXPRESSION"}
    {printf "%-44s %-5s %s\n",substr($1,1,44),$2,substr($3,1,88)}' \
  || echo "  (none, or token lacks Zone Rulesets:Read — fine if no cache rules exist)"

echo
echo "Reading notes:"
echo "  1. Section 1 holds the site's own numbers. Section 2 is zone-wide and"
echo "     this zone serves several sites, so its HIT% is NOT this site's rate."
echo "  2. Retention is ${MAX_DAYS} days on this plan. The adaptive dataset allows a"
echo "     single 30-day query window, so section 1's ${DAYS} per-day queries are"
echo "     redundant — US-011 Phase 1 collapses them into one call (ADR-0003)."
echo "  3. A per-cacheStatus visual breakdown also exists in the dashboard:"
echo "     dash.cloudflare.com → zone → Analytics & Logs → Traffic."


