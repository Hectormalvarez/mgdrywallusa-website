#!/bin/sh
# cf-cache-rule.sh — Idempotent Cloudflare Cache Rule for HTML caching
# (US-008 T4, ADR-0002).
#
# Creates/updates ONE rule in the http_request_cache_settings entrypoint
# ruleset that makes the site's HTML eligible for edge caching, letting
# origin Cache-Control headers (set by frontend/src/middleware.ts:
# s-maxage=300, stale-while-revalidate) govern the edge TTL.
#
# The rule NEVER caches:
#   - /api/*            (lead form POSTs, Wagtail API, preview endpoints)
#   - /admin/*          (Wagtail admin)
#   - /_next/*          (hashed static assets; CF caches them by extension
#                        already — the default eligibility applies)
#   - requests carrying preview_token or __prerender_bypass cookies
#                        (Draft Mode previews render different content —
#                        caching them would poison the edge for everyone)
#
# Usage:
#   scripts/cf-cache-rule.sh <zone-id> <api-token> host1 [host2 ...]
#
# Idempotent: the ruleset is fetched, an existing rule with the same
# description is replaced, otherwise the rule is added.
set -euo pipefail

[ $# -ge 3 ] || { echo "usage: $0 <zone-id> <api-token> host1 [host2 ...]" >&2; exit 2; }
ZONE_ID="$1"; TOKEN="$2"; shift 2

RULE_DESC="mgdrywall-edge-caching (US-008, managed by cf-cache-rule.sh)"
API="https://api.cloudflare.com/client/v4"
AUTH="Authorization: Bearer ${TOKEN}"
CT="Content-Type: application/json"

# ── Build the rule expression from the given hostnames ─────────────
HOSTS_EXPR=$(for h in "$@"; do printf 'http.host eq "%s" or ' "$h"; done)
HOSTS_EXPR=${HOSTS_EXPR%or }
EXPRESSION="(${HOSTS_EXPR}) and not starts_with(http.request.uri.path, \"/api/\") and not starts_with(http.request.uri.path, \"/admin/\") and not starts_with(http.request.uri.path, \"/_next/\") and not http.cookie contains \"preview_token\" and not http.cookie contains \"__prerender_bypass\""

# ── Build the rule body ────────────────────────────────────────────
RULE_BODY=$(jq -n --arg expr "$EXPRESSION" --arg desc "$RULE_DESC" '
  {
    expression: $expr,
    description: $desc,
    action: "set_cache_settings",
    action_parameters: {
      cache: true,
      edge_ttl: { mode: "respect_origin" },
      browser_ttl: { mode: "respect_origin" },
      cache_key: {
        ignore_query_strings_order: true
      }
    },
    enabled: true
  }')

ENTRYPOINT="$API/zones/$ZONE_ID/rulesets/phases/http_request_cache_settings/entrypoint"

# ── Fetch (or initialize) the entrypoint ruleset ───────────────────
EXISTING=$(curl -sf "$ENTRYPOINT" -H "$AUTH") || EXISTING=""
if [ -n "$EXISTING" ]; then
  RULESET_ID=$(echo "$EXISTING" | jq -r '.result.id // empty')
  RULESET_BODY=$(echo "$EXISTING" | jq -c '.result.rules // []')
else
  echo "→ No entrypoint ruleset yet; creating one."
  CREATE=$(curl -sf -X POST "$API/zones/$ZONE_ID/rulesets" -H "$AUTH" -H "$CT" \
    --data '{"name":"zone_cache_settings","kind":"zone","phase":"http_request_cache_settings","rules":[]}')
  RULESET_ID=$(echo "$CREATE" | jq -r '.result.id')
  RULESET_BODY='[]'
fi
[ -n "$RULESET_ID" ] || { echo "✗ Could not resolve entrypoint ruleset id" >&2; exit 1; }

# ── Replace (or append) the managed rule ───────────────────────────
UPDATED_RULES=$(printf '%s' "$RULESET_BODY" | jq -c --argjson rule "$RULE_BODY" --arg desc "$RULE_DESC" \
  'map(select(.description != $desc)) + [$rule]')
PUT_BODY=$(jq -n --argjson rules "$UPDATED_RULES" '{rules: $rules}')

RESULT=$(curl -sf -X PUT "$API/zones/$ZONE_ID/rulesets/phases/http_request_cache_settings/entrypoint" \
  -H "$AUTH" -H "$CT" --data "$PUT_BODY") || { echo "✗ Cache rule PUT failed (check token: Zone.Cache Rules:Edit)" >&2; exit 1; }

FINAL_ID=$(echo "$RESULT" | jq -r '.result.id')
FINAL_RULES=$(echo "$RESULT" | jq -r '.result.rules | length')
echo "✓ Cache rule applied (ruleset $FINAL_ID, $FINAL_RULES rule(s))"
echo "  expression: $EXPRESSION"
