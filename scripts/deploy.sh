#!/bin/sh
# deploy.sh — Production deployment orchestrator with automatic rollback.
# Sequences: backup → pull → migrate → swap → health-check → (rollback|prune)
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_DIR"

# ── Configuration (override via environment) ──────────────────────
COMPOSE_PROJECT="${COMPOSE_PROJECT:-mgdrywall-prod}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"
HEALTH_RETRIES="${HEALTH_RETRIES:-15}"
HEALTH_INTERVAL="${HEALTH_INTERVAL:-4}"
IMAGE_SERVICES="${IMAGE_SERVICES:-backend frontend nginx}"
IMAGE_TAG="${IMAGE_TAG:-latest}"

# US-009: single source of truth for the health-check contract — shared with
# the compose healthchecks via backend/tests/core/test_health_contract.py,
# which fails CI if these ever disagree.
# The health request must carry the public Host (Django rejects unknown hosts
# with 400) and the https scheme (SECURE_SSL_REDIRECT).
if [ -f "$PROJECT_DIR/.env.prod" ]; then
  PUBLIC_HOST="${PUBLIC_HOST:-$(grep -E '^FRONTEND_URL=' "$PROJECT_DIR/.env.prod" | head -1 | cut -d= -f2- | sed -E 's|https?://([^/:]+).*|\1|')}"
fi
HEALTH_HOST="${HEALTH_HOST:-${PUBLIC_HOST:-localhost}}"
if [ -f "$SCRIPT_DIR/health.env" ]; then
  # shellcheck disable=SC1091
  . "$SCRIPT_DIR/health.env"
fi
HEALTH_URL="${HEALTH_URL:-http://nginx${HEALTHCHECK_PATH:-/api/v1/pages/}}"

# ── Helpers ────────────────────────────────────────────────────────
info()  { printf "\033[0;36m▶ %s\033[0m\n" "$1"; }
ok()    { printf "\033[0;32m✓ %s\033[0m\n" "$1"; }
err()   { printf "\033[0;31m✗ %s\033[0m\n" "$1" >&2; exit 1; }

COMPOSE="docker compose -p $COMPOSE_PROJECT -f $COMPOSE_FILE --env-file .env.prod"

# ── Concurrency lock + failure diagnostics (US-009) ────────────────
# The watchdog (scripts/watchdog.sh) converges missing containers but must
# never race an in-flight deploy; the lockfile also makes any deploy's
# existence observable from the host.
LOCKFILE="$PROJECT_DIR/.deploy-in-progress"
touch "$LOCKFILE"

on_exit() {
  rc=$?
  rm -f "$LOCKFILE"
  if [ "$rc" -ne 0 ]; then
    printf "\033[0;31m✗ deploy.sh FAILED with exit code %s — last steps above\033[0m\n" "$rc" >&2
  fi
}
trap on_exit EXIT

# ── Rollback (US-009) ──────────────────────────────────────────────
# Restores the previous image tags. The database is deliberately NOT
# auto-restored: a new image failing health checks is never a reason to
# rewind data (data-loss hazard). Restore is a deliberate manual action:
#   scripts/restore.sh backups/<file>.tar.gz
rollback() {
  info "Rolling back to previous images..."
  for entry in $PREV_IMAGE_TAGS; do
    svc="${entry%%:*}"
    tag="${entry##*:}"
    info "  Restoring $svc to tag: $tag"
  done
  for entry in $PREV_IMAGE_TAGS; do
    svc="${entry%%:*}"
    tag="${entry##*:}"
    IMAGE_TAG="$tag" $COMPOSE pull "$svc" 2>/dev/null || true
  done
  for entry in $PREV_IMAGE_TAGS; do
    svc="${entry%%:*}"
    tag="${entry##*:}"
    IMAGE_TAG="$tag" $COMPOSE up -d --no-deps "$svc" 2>/dev/null || true
  done
  ok "Rollback complete. Investigate and re-deploy."
}

# ── Step 1: Snapshot current image references ──────────────────────
info "Capturing current image references..."
PREV_IMAGE_TAGS=""
for svc in $IMAGE_SERVICES; do
  # Get the current image tag for this service
  CURRENT_TAG=$($COMPOSE images "$svc" --format json 2>/dev/null | jq -r ".[0].Tag // \"latest\"" 2>/dev/null || echo "latest")
  PREV_IMAGE_TAGS="$PREV_IMAGE_TAGS $svc:$CURRENT_TAG"
done
ok "Previous images captured: $PREV_IMAGE_TAGS"

# ── Step 2: Pre-deploy backup (best-effort) ───────────────────────
# A backup failure must never block a deploy: an unavailable volume or
# helper image would otherwise halt releases indefinitely (this exact
# failure mode blocked all deploys silently for a week). The backup is
# still attempted on every deploy and failures are loud.
info "Running pre-deploy backup..."
if ! "$SCRIPT_DIR/backup.sh"; then
  info "Backup failed — continuing deploy (backup is best-effort)"
fi

# ── Step 3: Pull latest git references ────────────────────────────
# Best-effort: the images are prebuilt (GHCR, tag passed by the webhook);
# the checkout only needs to stay current for compose/scripts. The
# webhook container has no ssh client, so a fetch over the ssh remote
# fails there — continue rather than abort (this silently blocked a
# whole day of deploys when the checkout went stale).
info "Fetching latest changes..."
git fetch --all --prune || info "git fetch failed (ssh unavailable in this environment) — using the local checkout"
git pull --ff-only || ok "Pull skipped — keeping the local checkout"
ok "Git up to date: $(git rev-parse --short HEAD)"

# ── Step 4: Pull pre-built images ─────────────────────────────────
# US-009: only the app services are pulled. A blanket `pull` refreshes
# `cloudflared:latest` too, whose image drift would then recreate the
# tunnel during the swap — one of the vectors that killed the 2026-09-15
# deploy mid-swap.
info "Pulling latest images..."
$COMPOSE pull db backend frontend nginx 2>/dev/null || ok "Some images pulled (local builds may be used)"
ok "Images pulled"

# ── Step 5: Run database migrations ───────────────────────────────
info "Running migrations..."
$COMPOSE run --rm backend python manage.py migrate --noinput
ok "Migrations applied"

# ── Step 6: Swap containers (sequential, no dependent churn) ──────
# US-009 (AC2): on 2026-09-15 a blanket `up -d` recreated the tunnel and
# the webhook container that was executing this deploy (image drift via
# the pull step + compose's recreation of linked containers), killing the
# deploy mid-swap and leaving the site down for 16 hours. `up -d
# --no-deps` per service, in dependency order, guarantees compose never
# touches anything beyond the named service. cloudflared/webhook are
# converged by the watchdog, never churned by app deploys.
info "Starting updated containers (sequential --no-deps)..."
$COMPOSE up -d --no-deps db
$COMPOSE up -d --no-deps backend
$COMPOSE up -d --no-deps frontend
$COMPOSE up -d --no-deps nginx
ok "Containers started"

# ── Step 7: Health check ──────────────────────────────────────────
info "Running health checks (max ${HEALTH_RETRIES} attempts)..."
HEALTHY=false
i=1
while [ "$i" -le "$HEALTH_RETRIES" ]; do
  # Use the backend container to check the health endpoint
  if $COMPOSE exec -T backend curl -sf -o /dev/null \
    -H "X-Forwarded-Proto: https" -H "Host: $HEALTH_HOST" \
    "$HEALTH_URL" 2>/dev/null; then
    HEALTHY=true
    break
  fi
  info "  Attempt $i/$HEALTH_RETRIES — waiting ${HEALTH_INTERVAL}s..."
  sleep "$HEALTH_INTERVAL"
  i=$((i + 1))
done

if [ "$HEALTHY" = "false" ]; then
  err "Health check failed after $HEALTH_RETRIES attempts."
  rollback
  err "Health check failure — rollback applied. Investigate and re-deploy."
fi

ok "Health check passed"

# ── Step 8: Cleanup ───────────────────────────────────────────────
info "Pruning dangling images..."
docker image prune -f >/dev/null 2>&1

# ── Step 9: Cloudflare cache purge ───────────────────────────────
# US-008 (ADR-0002): a new deploy may ship new bundles/markup. Purge the
# zone's edge cache so visitors never receive HTML from the previous
# deployment. Best-effort — a purge failure is logged, never blocks the
# deploy (the frontend's bounded edge TTL caps staleness at 5 minutes).
if [ -f "$PROJECT_DIR/.env.prod" ]; then
  CF_PURGE_TOKEN="${CF_PURGE_TOKEN:-$(grep -E '^CLOUDFLARE_API_TOKEN=' "$PROJECT_DIR/.env.prod" | head -1 | cut -d= -f2-)}"
  CF_PURGE_ZONE="${CF_PURGE_ZONE:-$(grep -E '^CLOUDFLARE_ZONE_ID=' "$PROJECT_DIR/.env.prod" | head -1 | cut -d= -f2-)}"
  if [ -n "$CF_PURGE_TOKEN" ] && [ -n "$CF_PURGE_ZONE" ]; then
    info "Purging Cloudflare edge cache..."
    PURGE_STATUS=$(curl -s -o /dev/null -w '%{http_code}' -X POST \
      "https://api.cloudflare.com/client/v4/zones/$CF_PURGE_ZONE/purge_cache" \
      -H "Authorization: Bearer $CF_PURGE_TOKEN" \
      -H "Content-Type: application/json" \
      --data '{"purge_everything":true}' || echo "curl-failed")
    if [ "$PURGE_STATUS" = "200" ]; then
      ok "Cloudflare edge cache purged"
    else
      info "Cloudflare purge failed (HTTP $PURGE_STATUS) — edge TTL expires stale pages within 5 minutes"
    fi
  else
    info "CLOUDFLARE_API_TOKEN/CLOUDFLARE_ZONE_ID not set in .env.prod — skipping cache purge"
  fi
fi

# ── Step 10: External smoke check (US-009, AC3) ───────────────────
# The deploy is only successful if the PUBLIC site actually serves. This is
# the only check that covers the whole chain: Cloudflare → tunnel → nginx →
# frontend. Retried to ride out edge-cache MISS latency right after the
# purge. Failure rolls back and fails the deploy (Release goes red).
if [ -n "$PUBLIC_HOST" ]; then
  info "Running public smoke check..."
  SMOKE_OK=false
  i=1
  while [ "$i" -le 5 ]; do
    SMOKE_CODE=$(curl -s -o /dev/null -w '%{http_code}' --max-time 15 \
      "https://$PUBLIC_HOST/" || echo "000")
    if [ "$SMOKE_CODE" = "200" ]; then
      SMOKE_OK=true
      break
    fi
    info "  Smoke attempt $i/5 failed (HTTP $SMOKE_CODE) — waiting 5s..."
    sleep 5
    i=$((i + 1))
  done
  if [ "$SMOKE_OK" != "true" ]; then
    info "Public smoke check failed — rolling back to previous images..."
    rollback
    err "Public site did not serve after deploy — rollback applied."
  fi
  ok "Public smoke check passed"
else
  info "PUBLIC_HOST not derivable — skipping public smoke check"
fi

ok "Deploy complete: $(git rev-parse --short HEAD)"
