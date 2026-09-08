# Webhook Service

Runs the [adnanh/webhook](https://github.com/adnanh/webhook) daemon, which
listens for authenticated POST requests from the GitHub Actions Release
workflow and triggers a production deployment.

## Architecture

```
GitHub Actions → Cloudflare Tunnel → webhook:9000/hooks/deploy
                                        ↓
                                  webhook-bridge.sh (validates payload)
                                        ↓
                                  deploy.sh (pull → migrate → swap → health check)
```

## The `/opt/mgdrywallusa-website` path

The host repo is mounted at `/opt/mgdrywallusa-website` inside this container.
This is an **in-container path only** — the host repo lives at
`/home/hadev/Projects/Code/mgdrywallusa-website`.

The identical-absolute-path mount is required because the webhook container
runs `docker compose` commands against the host Docker daemon (via the
mounted `/var/run/docker.sock`). Docker Compose resolves relative bind-mount
sources client-side, so the paths inside the container must match the paths
on the host filesystem for bind mounts to work correctly.

## hooks.json

`hooks.json` is a template. The entrypoint script (`webhook-entrypoint.sh`)
substitutes `__WEBHOOK_TOKEN__` with the actual `WEBHOOK_TOKEN` env var at
container startup and writes the result to `/etc/webhook/hooks.json`.

The webhook daemon uses `-hotreload`, so if the template changes, restarting
the container regenerates the config.

## Required environment variables

- `WEBHOOK_TOKEN` — shared secret for authenticating webhook requests
- All variables from `.env.prod` (for deploy.sh / backup.sh)

## Testing

```bash
# Rebuild and restart
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build --force-recreate webhook

# Verify compose plugin is available
docker compose -f docker-compose.prod.yml --env-file .env.prod exec webhook docker compose version

# Watch logs
docker compose -f docker-compose.prod.yml --env-file .env.prod logs webhook -f
```
