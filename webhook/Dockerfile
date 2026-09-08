FROM golang:1.21-alpine AS builder

RUN apk add --no-cache git

RUN go install github.com/adnanh/webhook@latest

FROM alpine:3.19

# Install git, jq, curl, docker-cli (with compose plugin), and ca-certificates
# for deploy.sh, backup.sh, and the bridge script.
RUN apk add --no-cache git jq curl docker-cli docker-cli-compose ca-certificates

# Copy webhook binary from builder
COPY --from=builder /go/bin/webhook /usr/local/bin/webhook

# Copy entrypoint script
COPY webhook-entrypoint.sh /usr/local/bin/webhook-entrypoint.sh
RUN chmod +x /usr/local/bin/webhook-entrypoint.sh

# /opt/mgdrywallusa-website is the IN-CONTAINER path only — it is NOT the
# host's working directory. The host repo is mounted at this exact path so
# that when docker compose runs inside this container (via the mounted
# Docker socket), relative bind-mount sources in docker-compose.prod.yml
# resolve to the same absolute paths on the host filesystem.
# Prevent "dubious ownership" errors when webhook container interacts with host-mounted git repo
RUN git config --global --add safe.directory /opt/mgdrywallusa-website

WORKDIR /opt/mgdrywallusa-website

EXPOSE 9000

ENTRYPOINT ["/usr/local/bin/webhook-entrypoint.sh"]
