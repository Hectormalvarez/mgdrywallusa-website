#!/bin/sh
# watchdog.sh — server-side converge loop (US-009, AC5).
#
# Installed as a cron entry on usrv-01 (every 15 min):
#   */15 * * * * /home/hadev/Projects/Code/mgdrywallusa-website/scripts/watchdog.sh >> /tmp/mgdrywall-watchdog.log 2>&1
#
# Defense-in-depth against the 2026-09-16 outage class: any container that
# is missing or stopped (deploy kill, manual accident, anything) is brought
# back. US-012 narrowed this from a blanket `compose up -d` — which also
# *recreated* running containers whose config had changed, silently applying
# tunnel/compose edits at an arbitrary 15-minute tick — to a start-only
# converge (`up -d --no-recreate`, and only while a service is not running).
# Config changes are now applied deliberately by an operator and reported by
# deploy.sh Step 7b. No-op while the stack is healthy and while a deploy is
# in progress (lockfile).
set -euo pipefail

DIR="/home/hadev/Projects/Code/mgdrywallusa-website"
LOCKFILE="$DIR/.deploy-in-progress"

# Never race a live deploy — deploy.sh creates/removes this lockfile.
if [ -f "$LOCKFILE" ]; then
  exit 0
fi

cd "$DIR"

COMPOSE="docker compose -p mgdrywall-prod -f docker-compose.prod.yml --env-file .env.prod"
SERVICES="db backend frontend nginx cloudflared"

# Start-only converge: bring back anything that is not running; never touch a
# running container (recreating on config drift is what US-012 removed from
# this path — it is reported by deploy.sh Step 7b instead).
for svc in $SERVICES; do
  if [ -z "$($COMPOSE ps -q "$svc" 2>/dev/null | head -1 || true)" ]; then
    $COMPOSE up -d --no-recreate "$svc" >/dev/null 2>&1 || true
  fi
done
