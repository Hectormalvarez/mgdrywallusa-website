#!/bin/sh
set -euo pipefail

# webhook-bridge.sh — Receives deployment payload from webhook daemon
# Arguments: $1=image_tag, $2=ref (passed via pass-arguments-to-command)

IMAGE_TAG="${1:-latest}"
REF="${2:-}"

# Validate ref is main
if [ "$REF" != "main" ]; then
  echo "{\"status\":\"error\",\"message\":\"ref must be main, got: $REF\"}" >&2
  exit 1
fi

# Validate image_tag is not empty
if [ -z "$IMAGE_TAG" ] || [ "$IMAGE_TAG" = "null" ]; then
  echo "{\"status\":\"error\",\"message\":\"image_tag is required\"}" >&2
  exit 1
fi

echo "▶ Deploying image tag: $IMAGE_TAG (ref: $REF)" >&2

# Run deploy.sh with IMAGE_TAG set
cd /opt/mgdrywallusa-website
IMAGE_TAG="$IMAGE_TAG" ./scripts/deploy.sh

# Return success response
echo "{\"status\":\"ok\",\"image_tag\":\"$IMAGE_TAG\",\"ref\":\"$REF\"}"
