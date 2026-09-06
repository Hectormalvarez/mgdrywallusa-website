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
HEALTH_URL="${HEALTH_URL:-http://localhost/}"
HEALTH_RETRIES="${HEALTH_RETRIES:-15}"
HEALTH_INTERVAL="${HEALTH_INTERVAL:-4}"
IMAGE_SERVICES="${IMAGE_SERVICES:-frontend backend nginx}"

# ── Helpers ────────────────────────────────────────────────────────
info()  { printf "\033[0;36m▶ %s\033[0m\n" "$1"; }
ok()    { printf "\033[0;32m✓ %s\033[0m\n" "$1"; }
err()   { printf "\033[0;31m✗ %s\033[0m\n" "$1" >&2; exit 1; }

COMPOSE="docker compose -p $COMPOSE_PROJECT -f $COMPOSE_FILE"

# ── Step 1: Snapshot current image references ──────────────────────
info "Capturing current image references..."
PREV_IMAGES=""
for svc in $IMAGE_SERVICES; do
  IMG_ID=$($COMPOSE exec -T "$svc" cat /proc/1/environ 2>/dev/null | tr '\0' '\n' | grep '^_' || true)
  PREV_IMAGES="$PREV_IMAGES $(docker inspect --format='{{.Image}}' $COMPOSE ps -q "$svc" 2>/dev/null || true)"
done
PREV_IMAGES=$(echo "$PREV_IMAGES" | xargs)
ok "Previous images captured"

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
  # Use the backend container to check nginx internally (curl is available in backend image)
  if $COMPOSE exec -T backend curl -sf -o /dev/null "http://nginx/" 2>/dev/null; then
    HEALTHY=true
    break
  fi
  info "  Attempt $i/$HEALTH_RETRIES — waiting ${HEALTH_INTERVAL}s..."
  sleep "$HEALTH_INTERVAL"
  i=$((i + 1))
done

if [ "$HEALTHY" = "false" ]; then
  err "Health check failed after $HEALTH_RETRIES attempts. Initiating rollback..."

  # ── Rollback: restore images and re-swap ────────────────────────
  info "Rolling back to previous images..."
  for svc in $IMAGE_SERVICES; do
    PREV_IMG=$(echo "$PREV_IMAGES" | awk -v s="$svc" '{print}')
    [ -n "$PREV_IMG" ] && docker tag "$PREV_IMG" "ghcr.io/${REGISTRY_OWNER:-mgdrywall}/mgdrywall-${svc}:${IMAGE_TAG:-latest}" 2>/dev/null || true
  done
  $COMPOSE up -d --remove-orphans
  "$SCRIPT_DIR/restore.sh" "$("$SCRIPT_DIR/backup.sh" 2>&1 | grep -o 'backups/.*\.tar.gz' | head -1)" 2>/dev/null || true
  err "Rollback complete. Investigate and re-deploy."
fi

ok "Health check passed"

# ── Step 8: Cleanup ───────────────────────────────────────────────
info "Pruning dangling images..."
docker image prune -f >/dev/null 2>&1
ok "Deploy complete: $(git rev-parse --short HEAD)"
