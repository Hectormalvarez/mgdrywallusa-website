#!/bin/sh
set -euo pipefail

# webhook-bridge.sh — Receives deployment payload from webhook daemon
# Arguments: $1=image_tag, $2=ref (passed via pass-arguments-to-command)
#
# US-009: the webhook hook is configured with
# include-command-output-in-response, so the HTTP response to GitHub is held
# open until this script exits and contains our final status JSON. The Release
# job treats success as HTTP 200 AND a body containing "status":"ok".
#
# A machine-readable record of the last deploy is also written to
# .last-deploy.json in the repo checkout (host-visible via the bind mount).

IMAGE_TAG="${1:-latest}"
REF="${2:-}"

# Validate ref is main
if [ "$REF" != "main" ]; then
  echo "{\"status\":\"error\",\"message\":\"ref must be main, got: $REF\"}"
  exit 1
fi

# Validate image_tag is not empty
if [ -z "$IMAGE_TAG" ] || [ "$IMAGE_TAG" = "null" ]; then
  echo "{\"status\":\"error\",\"message\":\"image_tag is required\"}"
  exit 1
fi

echo "▶ Deploying image tag: $IMAGE_TAG (ref: $REF)" >&2

# Run deploy.sh with IMAGE_TAG set.
# /opt/mgdrywallusa-website is the IN-CONTAINER path — see docker-compose.prod.yml
# volume mount comment for why this differs from the host working directory.
cd /opt/mgdrywallusa-website
set +e
IMAGE_TAG="$IMAGE_TAG" ./scripts/deploy.sh
DEPLOY_EXIT=$?
set -e

FINISHED_AT=$(date -u +%Y-%m-%dT%H:%M:%SZ)

# Record the outcome for host-side inspection and Release verification.
STATUS="error"
if [ "$DEPLOY_EXIT" -eq 0 ]; then
  STATUS="ok"
fi
printf '{"status":"%s","image_tag":"%s","ref":"%s","exit_code":%s,"finished_at":"%s"}\n' \
  "$STATUS" "$IMAGE_TAG" "$REF" "$DEPLOY_EXIT" "$FINISHED_AT" > .last-deploy.json

if [ "$DEPLOY_EXIT" -ne 0 ]; then
  echo "✗ Deploy failed with exit code $DEPLOY_EXIT" >&2
  echo "{\"status\":\"error\",\"image_tag\":\"$IMAGE_TAG\",\"exit_code\":$DEPLOY_EXIT,\"finished_at\":\"$FINISHED_AT\"}"
  exit "$DEPLOY_EXIT"
fi

echo "{\"status\":\"ok\",\"image_tag\":\"$IMAGE_TAG\",\"ref\":\"$REF\",\"exit_code\":0,\"finished_at\":\"$FINISHED_AT\"}"
