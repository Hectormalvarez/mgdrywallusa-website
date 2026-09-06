#!/bin/sh
# backup.sh — Transactional backup of database + media volume.
# Produces a timestamped archive: backups/backup_YYYY-MM-DD_HHMMSS.tar.gz
# Optionally uploads to S3/R2 if S3_BACKUP_BUCKET is defined.
set -eu

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_DIR"

# ── Configuration (override via environment) ──────────────────────
COMPOSE_PROJECT="${COMPOSE_PROJECT:-mgdrywall-prod}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"
DB_USER="${DB_USER:-mgdrywall}"
DB_NAME="${DB_NAME:-mgdrywall}"
BACKUP_DIR="${BACKUP_DIR:-$PROJECT_DIR/backups}"
PRUNE_DAYS="${PRUNE_DAYS:-3}"
MEDIA_VOLUME="${COMPOSE_PROJECT}_media_data"

# ── Helpers ────────────────────────────────────────────────────────
info()  { printf "\033[0;36m▶ %s\033[0m\n" "$1"; }
ok()    { printf "\033[0;32m✓ %s\033[0m\n" "$1"; }
err()   { printf "\033[0;31m✗ %s\033[0m\n" "$1" >&2; exit 1; }

# ── Pre-flight ─────────────────────────────────────────────────────
command -v docker >/dev/null 2>&1 || err "Docker not found."
docker compose -p "$COMPOSE_PROJECT" -f "$COMPOSE_FILE" ps -q db >/dev/null 2>&1 \
  || err "Database container not running. Is the stack up?"

mkdir -p "$BACKUP_DIR"
STAGING="$(mktemp -d)"
trap 'rm -rf "$STAGING"' EXIT

TIMESTAMP="$(date -u +%Y-%m-%d_%H%M%S)"
ARCHIVE="$BACKUP_DIR/backup_${TIMESTAMP}.tar.gz"

# ── Step 1: Database dump ─────────────────────────────────────────
info "Dumping database..."
docker compose -p "$COMPOSE_PROJECT" -f "$COMPOSE_FILE" exec -T db \
  pg_dump -U "$DB_USER" -d "$DB_NAME" -Fc > "$STAGING/db.dump"
ok "Database dump: $(wc -c < "$STAGING/db.dump") bytes"

# ── Step 2: Media volume archive ──────────────────────────────────
info "Archiving media volume..."
docker run --rm \
  -v "$MEDIA_VOLUME":/data:ro \
  -v "$STAGING":/backup \
  alpine tar czf /backup/media_data.tar.gz -C /data . 2>/dev/null
ok "Media archive: $(wc -c < "$STAGING/media_data.tar.gz") bytes"

# ── Step 3: Bundle ────────────────────────────────────────────────
info "Creating backup archive..."
tar czf "$ARCHIVE" -C "$STAGING" db.dump media_data.tar.gz
ok "Backup archive: $ARCHIVE"

# ── Step 4: Prune old backups ─────────────────────────────────────
PRUNED=$(find "$BACKUP_DIR" -name 'backup_*.tar.gz' -mtime +"$PRUNE_DAYS" -delete -print | wc -l)
[ "$PRUNED" -gt 0 ] && ok "Pruned $PRUNED backup(s) older than $PRUNE_DAYS days"

# ── Step 5: Optional S3/R2 upload ─────────────────────────────────
if [ -n "${S3_BACKUP_BUCKET:-}" ]; then
  info "Uploading to S3/R2 bucket: $S3_BACKUP_BUCKET"
  docker run --rm \
    -e AWS_ACCESS_KEY_ID="${S3_ACCESS_KEY_ID:?S3_ACCESS_KEY_ID required}" \
    -e AWS_SECRET_ACCESS_KEY="${S3_SECRET_ACCESS_KEY:?S3_SECRET_ACCESS_KEY required}" \
    -e AWS_DEFAULT_REGION="${S3_REGION:-auto}" \
    ${S3_ENDPOINT_URL:+-e AWS_ENDPOINT_URL="$S3_ENDPOINT_URL"} \
    -v "$STAGING":/backup:ro \
    amazon/aws-cli s3 cp "/backup/$(basename "$ARCHIVE")" \
    "s3://$S3_BACKUP_BUCKET/$(basename "$ARCHIVE")" --only-show-errors
  ok "Uploaded to s3://$S3_BACKUP_BUCKET/"
fi

ok "Backup complete: $ARCHIVE"
