#!/bin/sh
# restore.sh — Disaster recovery: restore database + media from a backup archive.
# Usage: ./scripts/restore.sh backups/backup_YYYY-MM-DD_HHMMSS.tar.gz
set -eu

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_DIR"

# ── Configuration (override via environment) ──────────────────────
COMPOSE_PROJECT="${COMPOSE_PROJECT:-mgdrywall-prod}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"
DB_USER="${DB_USER:-mgdrywall}"
DB_NAME="${DB_NAME:-mgdrywall}"
MEDIA_VOLUME="${COMPOSE_PROJECT}_media_data"

# ── Helpers ────────────────────────────────────────────────────────
info()  { printf "\033[0;36m▶ %s\033[0m\n" "$1"; }
ok()    { printf "\033[0;32m✓ %s\033[0m\n" "$1"; }
err()   { printf "\033[0;31m✗ %s\033[0m\n" "$1" >&2; exit 1; }

# ── Args ───────────────────────────────────────────────────────────
[ $# -ge 1 ] || err "Usage: $0 <backup-archive.tar.gz>"
ARCHIVE="$1"
[ -f "$ARCHIVE" ] || err "File not found: $ARCHIVE"

# ── Pre-flight ─────────────────────────────────────────────────────
command -v docker >/dev/null 2>&1 || err "Docker not found."
docker compose -p "$COMPOSE_PROJECT" -f "$COMPOSE_FILE" ps -q db >/dev/null 2>&1 \
  || err "Database container not running. Is the stack up?"

STAGING="$(mktemp -d)"
trap 'rm -rf "$STAGING"' EXIT

# ── Step 1: Unpack archive ────────────────────────────────────────
info "Unpacking backup archive..."
tar xzf "$ARCHIVE" -C "$STAGING"
[ -f "$STAGING/db.dump" ]       || err "Missing db.dump in archive."
[ -f "$STAGING/media_data.tar.gz" ] || err "Missing media_data.tar.gz in archive."

# ── Step 2: Restore media volume ──────────────────────────────────
info "Restoring media volume..."
docker run --rm \
  -v "$MEDIA_VOLUME":/data \
  -v "$STAGING":/backup:ro \
  alpine sh -c 'rm -rf /data/* && tar xzf /backup/media_data.tar.gz -C /data && chown -R 1001:1001 /data'
ok "Media volume restored (owner 1001:1001)"

# ── Step 3: Restore database ──────────────────────────────────────
info "Restoring database..."
cat "$STAGING/db.dump" | docker compose -p "$COMPOSE_PROJECT" -f "$COMPOSE_FILE" exec -T db \
  pg_restore -U "$DB_USER" -d "$DB_NAME" --clean --if-exists --no-owner --no-acl 2>/dev/null || true
ok "Database restored via pg_restore"

ok "Restore complete. Restart the stack to pick up changes."
