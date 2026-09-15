#!/bin/sh
# cf-cache-stats.sh — Cloudflare discovery + baseline report (US-008 T1).
#
# Pulls three read-only datasets for one zone and prints a summary:
#   1. Cache-status breakdown (GraphQL zoneHttpRequestsAdaptiveGroups)
#   2. Zone settings relevant to caching (REST /zones/:id/settings)
#   3. Security-event volume (GraphQL firewallEventsAdaptiveGroups)
#
# Required environment (also read from .env in the project root if set):
#   CLOUDFLARE_API_TOKEN — zone-scoped token: Zone.Analytics:Read,
#                          Zone.Settings:Read, Zone.Cache Purge (purge not
#                          used by this script, but the same token may be
#                          reused by revalidate/deploy purge steps)
#   CLOUDFLARE_ZONE_ID   — the numeric zone ID
#
# Usage: scripts/cf-cache-stats.sh [--days N]   (default 7)
#
# Token is never echoed; all requests are read-only.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

DAYS=7
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

# DateSince: N days back (UTC), DateUntil: now.
SINCE=$(date -u -d "$DAYS days ago" +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || date -u -v-"$DAYS"d +%Y-%m-%dT%H:%M:%SZ)

info() { printf "\n\033[0;36m▶ %s\033[0m\n" "$1"; }

# ── 1. Cache-status breakdown ──────────────────────────────────────
info "Cache status breakdown (last ${DAYS} days, UTC since ${SINCE})"
CACHE_QUERY='{"query":"query($zone: String!, $since: String!) { viewer { zones(filter: {zoneTag: $zone}) { httpRequestsAdaptiveGroups(limit: 100, filter: {datetime_geq: $since}) { sum { requests bytes } dimensions { cacheStatus } } } } }","variables":{"zone":"'"$CLOUDFLARE_ZONE_ID"'","since":"'"$SINCE"'"}}'
CACHE_RESP=$(curl -sf "$API/graphql" -H "$AUTH" -H "$CT" --data "$CACHE_QUERY") || {
  echo "✗ GraphQL request failed (check token/permissions)" >&2; exit 1;
}
echo "$CACHE_RESP" | jq -r '
  .data.viewer.zones[0].httpRequestsAdaptiveGroups
  | map({status: .dimensions.cacheStatus, requests: .sum.requests, bytes: .sum.bytes})
  | group_by(.status)
  | map({status: .[0].status, requests: (map(.requests) | add), bytes: (map(.bytes) | add)})
  | sort_by(-.requests)[]
  | "\(.status // "unknown")\t\(.requests)\t\(.bytes)"
' | awk -F'\t' 'BEGIN{printf "%-12s %12s %15s\n","CACHE","REQUESTS","BYTES"} {printf "%-12s %12s %15s\n",$1,$2,$3}'
TOTAL=$(echo "$CACHE_RESP" | jq '[.data.viewer.zones[0].httpRequestsAdaptiveGroups[].sum.requests] | add // 0')
HITS=$(echo "$CACHE_RESP" | jq '[.data.viewer.zones[0].httpRequestsAdaptiveGroups[] | select(.dimensions.cacheStatus == "hit" or .dimensions.cacheStatus == "stale") | .sum.requests] | add // 0')
if [ "$TOTAL" -gt 0 ]; then
  awk -v t="$TOTAL" -v h="$HITS" 'BEGIN {printf "TOTAL: %d requests, HIT+STALE: %d (%.1f%%)\n", t, h, (h/t)*100}'
fi

# ── 2. Zone settings relevant to caching ───────────────────────────
info "Zone settings (caching-relevant)"
SETTINGS=$(curl -sf "$API/zones/$CLOUDFLARE_ZONE_ID/settings" -H "$AUTH") || {
  echo "✗ Settings request failed (token needs Zone Settings:Read)" >&2;
}
if [ -n "$SETTINGS" ]; then
  echo "$SETTINGS" | jq -r '.result[] | select(.id as $id | ["cache_level","browser_cache_ttl","always_online","development_mode","minify","http3","0rtt","broli","early_hints","rocket_loader","mirage","email_obfuscation","automatic_https_rewrites"] | index($id)) | "\(.id)\t\(.value)"' \
    | awk -F'\t' 'BEGIN{printf "%-28s %s\n","SETTING","VALUE"} {printf "%-28s %s\n",$1,$2}'
fi

info "Cache rules / entrypoint rulesets"
curl -sf "$API/zones/$CLOUDFLARE_ZONE_ID/rulesets/phases/http_request_cache_settings/entrypoint" -H "$AUTH" \
  | jq -r '.result.rules[]? | "\(.description // "(unnamed)")\t\(.expression)"' \
  | awk -F'\t' 'BEGIN{printf "%-40s %s\n","RULE","EXPRESSION"} {printf "%-40s %s\n",substr($1,1,40),substr($2,1,80)}' \
  || echo "  (none, or token lacks Zone Rulesets:Read — this is fine if no cache rules exist)"

# ── 3. Security events ─────────────────────────────────────────────
info "Security events (last ${DAYS} days)"
SEC_QUERY='{"query":"query($zone: String!, $since: String!) { viewer { zones(filter: {zoneTag: $zone}) { firewallEventsAdaptiveGroups(limit: 50, filter: {datetime_geq: $since}) { count dimensions { action } } } } }","variables":{"zone":"'"$CLOUDFLARE_ZONE_ID"'","since":"'"$SINCE"'"}}'
SEC_RESP=$(curl -sf "$API/graphql" -H "$AUTH" -H "$CT" --data "$SEC_QUERY") || echo "✗ Security events query failed"
[ -n "${SEC_RESP:-}" ] && echo "$SEC_RESP" | jq -r '
  .data.viewer.zones[0].firewallEventsAdaptiveGroups[]
  | "\(.dimensions.action // "unknown")\t\(.count)"
' | awk -F'\t' 'BEGIN{printf "%-24s %10s\n","ACTION","EVENTS"} {printf "%-24s %10s\n",$1,$2}' \
  || echo "  (no events or dataset unavailable on this plan)"

echo
echo "Note: free plans expose a reduced GraphQL dataset (coarser dimensions,"
echo "shorter retention). If the breakdown above looks coarse, that is the"
echo "plan limit, not a script bug."
