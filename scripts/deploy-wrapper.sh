#!/bin/sh
# deploy-wrapper.sh — the ONLY command the gha-deploy SSH key may run (US-010).
# The authorized_keys entry for this key carries a forced command pointing here,
# so even a compromised key cannot open a shell: it can only deploy.
#
# GitHub Actions sends exactly:   deploy sha-<40-hex-commit>
# Anything else is refused.
set -eu

CMD="${SSH_ORIGINAL_COMMAND:-}"
TAG="${CMD#deploy }"

if [ "$CMD" = "$TAG" ] || [ -z "$TAG" ]; then
  echo '{"status":"error","message":"refused: command must be `deploy sha-<40-hex>`"}'
  exit 1
fi

if ! printf '%s' "$TAG" | grep -qE '^sha-[0-9a-f]{40}$'; then
  echo '{"status":"error","message":"refused: bad image tag"}'
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
exec env IMAGE_TAG="$TAG" "$SCRIPT_DIR/deploy.sh"
