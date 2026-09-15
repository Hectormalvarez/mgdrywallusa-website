#!/bin/sh
# cf-cache-stats.sh — Cloudflare discovery + baseline report (US-008 T1).
#
# Pulls three read-only datasets for one zone and prints a summary:
#   1. Cache hit/miss breakdown (GraphQL httpRequests1dGroups — daily rollups)
#   2. Zone settings relevant to caching (REST /zones/:id/settings)
#
# Free-plan notes (verified against this zone's schema, 2026-09-15):
#   - httpRequestsAdaptiveGroups exposes cacheStatus but has NO request-count
#     sum fields on Free, so per-status breakdown isn't possible via GraphQL.
#   - httpRequests1dGroups has requests/cachedRequests/bytes — used here.
#   - firewallEventsAdaptiveGroups requires a paid plan — skipped with a note.
#   - For a per-cacheStatus visual breakdown use the dashboard:
#     dash.cloudflare.com → zone → Analytics & Logs → Traffic.
#
# Required environment (also read from .env in the project root if set):
#   CLOUDFLARE_API_TOKEN — zone-scoped token: Zone.Analytics:Read,
#                          Zone.Settings:Read (+ Zone.Cache Purge for other
#                          consumers of the same token)
#   CLOUDFLARE_ZONE_ID   — the zone ID
#
# Usage: scripts/cf-cache-stats.sh [--days N]   (default 30)
#
# Token is never echoed; all requests are read-only.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

DAYS=30
while [ $# -gt 0 ]; do
  case "$1" in
    --days) DAYS="$2"; shift 2 ;;
    *) echo "Unknown arg: $1" >&2; exit 2 ;;
  esac
done

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

# Date window (UTC dates; GraphQL 1dGroups uses Date, not DateTime)
SINCE=$(date -u -d "$DAYS days ago" +%Y-%m-%d 2>/dev/null || date -u -v-"$DAYS"d +%Y-%m-%d)
UNTIL=$(date -u +%Y-%m-%d)

info() { printf "\n\033[0;36m▶ %s\033[0m\n" "$1"; }

# ── 1. Cache hit/miss breakdown (daily) ────────────────────────────
info "Cache breakdown, daily (UTC ${SINCE} → ${UNTIL})"
QUERY=$(jq -n --arg z "$CLOUDFLARE_ZONE_ID" --arg s "$SINCE" --arg u "$UNTIL" '
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

# ── 2. Zone settings relevant to caching ───────────────────────────
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

info "Cache rules (entrypoint ruleset)"
curl -sf "$API/zones/$CLOUDFLARE_ZONE_ID/rulesets/phases/http_request_cache_settings/entrypoint" -H "$AUTH" \
  | jq -r '.result.rules[]? | "\(.description // "(unnamed)")\t\(.expression)"' \
  | awk -F'\t' 'BEGIN{printf "%-40s %s\n","RULE","EXPRESSION"}
    {printf "%-40s %s\n",substr($1,1,40),substr($2,1,80)}' \
  || echo "  (none, or token lacks Zone Rulesets:Read — fine if no cache rules exist)"

echo
echo "Note: Free plan — GraphQL has no per-cacheStatus request breakdown and no"
echo "firewall-events access. Visual per-status breakdown: zone → Analytics &"
echo "Logs → Traffic in the Cloudflare dashboard."
