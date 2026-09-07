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
HEALTH_URL="${HEALTH_URL:-http://nginx/api/v1/settings/}"
HEALTH_RETRIES="${HEALTH_RETRIES:-15}"
HEALTH_INTERVAL="${HEALTH_INTERVAL:-4}"
IMAGE_SERVICES="${IMAGE_SERVICES:-frontend backend nginx}"
IMAGE_TAG="${IMAGE_TAG:-latest}"

# ── Helpers ────────────────────────────────────────────────────────
info()  { printf "\033[0;36m▶ %s\033[0m\n" "$1"; }
ok()    { printf "\033[0;32m✓ %s\033[0m\n" "$1"; }
err()   { printf "\033[0;31m✗ %s\033[0m\n" "$1" >&2; exit 1; }

COMPOSE="docker compose -p $COMPOSE_PROJECT -f $COMPOSE_FILE --env-file .env.prod"

# ── Step 1: Snapshot current image references ──────────────────────
info "Capturing current image references..."
PREV_IMAGE_TAGS=""
for svc in $IMAGE_SERVICES; do
  # Get the current image tag for this service
  CURRENT_TAG=$($COMPOSE images "$svc" --format json 2>/dev/null | jq -r ".[0].Tag // \"latest\"" 2>/dev/null || echo "latest")
  PREV_IMAGE_TAGS="$PREV_IMAGE_TAGS $svc:$CURRENT_TAG"
done
ok "Previous images captured: $PREV_IMAGE_TAGS"

# ── Step 2: Pre-deploy backup ─────────────────────────────────────
info "Running pre-deploy backup..."
"$SCRIPT_DIR/backup.sh"

# ── Step 3: Pull latest git references ────────────────────────────
info "Fetching latest changes..."
git fetch --all --prune
git pull --ff-only || err "Fast-forward failed. Resolve manually and re-run."
ok "Git up to date: $(git rev-parse --short HEAD)"

# ── Step 4: Pull pre-built images ─────────────────────────────────
info "Pulling latest images..."
$COMPOSE pull 2>/dev/null || ok "Some images pulled (local builds may be used)"
ok "Images pulled"

# ── Step 5: Run database migrations ───────────────────────────────
info "Running migrations..."
$COMPOSE run --rm backend python manage.py migrate --noinput
ok "Migrations applied"

# ── Step 6: Swap containers ───────────────────────────────────────
info "Starting updated containers..."
$COMPOSE up -d --remove-orphans
ok "Containers started"

# ── Step 7: Health check ──────────────────────────────────────────
info "Running health checks (max ${HEALTH_RETRIES} attempts)..."
HEALTHY=false
i=1
while [ "$i" -le "$HEALTH_RETRIES" ]; do
  # Use the backend container to check the health endpoint
  if $COMPOSE exec -T backend curl -sf -o /dev/null "$HEALTH_URL" 2>/dev/null; then
    HEALTHY=true
    break
  fi
  info "  Attempt $i/$HEALTH_RETRIES — waiting ${HEALTH_INTERVAL}s..."
  sleep "$HEALTH_INTERVAL"
  i=$((i + 1))
done

if [ "$HEALTHY" = "false" ]; then
  err "Health check failed after $HEALTH_RETRIES attempts. Initiating rollback..."

  # ── Rollback: restore previous image tags and re-swap ───────────
  info "Rolling back to previous images..."
  for entry in $PREV_IMAGE_TAGS; do
    svc="${entry%%:*}"
    tag="${entry##*:}"
    info "  Restoring $svc to tag: $tag"
  done
  
  # Pull the previous image tags
  for entry in $PREV_IMAGE_TAGS; do
    svc="${entry%%:*}"
    tag="${entry##*:}"
    IMAGE_TAG="$tag" $COMPOSE pull "$svc" 2>/dev/null || true
  done
  
  # Restart with previous images
  for entry in $PREV_IMAGE_TAGS; do
    svc="${entry%%:*}"
    tag="${entry##*:}"
    IMAGE_TAG="$tag" $COMPOSE up -d --no-deps "$svc" 2>/dev/null || true
  done
  
  # Restore database backup if available
  LATEST_BACKUP=$(ls -t backups/*.tar.gz 2>/dev/null | head -1)
  if [ -n "$LATEST_BACKUP" ]; then
    "$SCRIPT_DIR/restore.sh" "$LATEST_BACKUP" 2>/dev/null || true
  fi
  
  err "Rollback complete. Investigate and re-deploy."
fi

ok "Health check passed"

# ── Step 8: Cleanup ───────────────────────────────────────────────
info "Pruning dangling images..."
docker image prune -f >/dev/null 2>&1
ok "Deploy complete: $(git rev-parse --short HEAD)"
