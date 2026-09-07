#!/bin/sh
set -euo pipefail

# webhook-bridge.sh — Receives deployment payload from webhook daemon
# Reads JSON from stdin, validates, and invokes deploy.sh

# Read payload from stdin (webhook daemon passes it)
PAYLOAD=$(cat)

# Extract fields using jq
IMAGE_TAG=$(echo "$PAYLOAD" | jq -r '.image_tag // "latest"')
REF=$(echo "$PAYLOAD" | jq -r '.ref // ""')

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
