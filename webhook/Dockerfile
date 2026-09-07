FROM golang:1.21-alpine AS builder

RUN apk add --no-cache git

RUN go install github.com/adnanh/webhook@latest

FROM alpine:3.19

# Install git, jq, curl, and docker-cli for deploy.sh and bridge script
RUN apk add --no-cache git jq curl docker-cli ca-certificates

# Copy webhook binary from builder
COPY --from=builder /go/bin/webhook /usr/local/bin/webhook

# Copy entrypoint script
COPY webhook-entrypoint.sh /usr/local/bin/webhook-entrypoint.sh
RUN chmod +x /usr/local/bin/webhook-entrypoint.sh

# Prevent "dubious ownership" errors when webhook container interacts with host-mounted git repo
RUN git config --global --add safe.directory /opt/mgdrywallusa-website

WORKDIR /opt/mgdrywallusa-website

EXPOSE 9000

ENTRYPOINT ["/usr/local/bin/webhook-entrypoint.sh"]
