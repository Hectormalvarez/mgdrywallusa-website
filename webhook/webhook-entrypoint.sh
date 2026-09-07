#!/bin/sh
set -e

WEBHOOK_TOKEN="${WEBHOOK_TOKEN:?WEBHOOK_TOKEN is required}"

# Generate hooks.json from template with real token substituted in
cp /etc/webhook/hooks.json.template /etc/webhook/hooks.json
sed -i "s|__WEBHOOK_TOKEN__|${WEBHOOK_TOKEN}|g" /etc/webhook/hooks.json

# Exec the webhook daemon with all passed arguments
exec webhook "$@"
