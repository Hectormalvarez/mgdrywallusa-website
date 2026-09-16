#!/bin/sh
# watchdog.sh — server-side converge loop (US-009, AC5).
#
# Installed as a cron entry on usrv-01 (every 15 min):
#   */15 * * * * /home/hadev/Projects/Code/mgdrywallusa-website/scripts/watchdog.sh >> /tmp/mgdrywall-watchdog.log 2>&1
#
# Defense-in-depth against the 2026-09-16 outage class: any container that
# is missing or stopped (deploy kill, manual accident, anything) is brought
# back by an idempotent `compose up -d`. It is a no-op while the stack is
# healthy and while a deploy is in progress (lockfile).
set -euo pipefail

DIR="/home/hadev/Projects/Code/mgdrywallusa-website"
LOCKFILE="$DIR/.deploy-in-progress"

# Never race a live deploy — deploy.sh creates/removes this lockfile.
if [ -f "$LOCKFILE" ]; then
  exit 0
fi

cd "$DIR"
docker compose -p mgdrywall-prod -f docker-compose.prod.yml --env-file .env.prod up -d >/dev/null 2>&1
