FROM adnanh/webhook:latest

# Install git, jq, curl, and docker-cli for deploy.sh and bridge script
RUN apk add --no-cache git jq curl docker-cli

# Prevent "dubious ownership" errors when webhook container interacts with host-mounted git repo
RUN git config --global --add safe.directory /opt/mgdrywallusa-website

WORKDIR /opt/mgdrywallusa-website
