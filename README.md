# MGDrywall USA Website

Mobile-first, single-page residential landing page for drywall & finishing contractors.

**Stack:** Next.js 16 · Django 5.x / Wagtail CMS · PostgreSQL 16 · Nginx reverse proxy

## Architecture

```text
┌──────────┐     ┌──────────┐     ┌─────────┐
│ Cloudfl. │────▶│  Nginx   │────▶│ Frontend│     ┌────────┐
│ Tunnel   │     │  (proxy) │     │ Next.js │     │ Django │
│          │     │          │     │  :3000  │     │ :8000  │
│          │     │          │────▶│─────────│────▶│ Wagtail│
│          │     │          │     │  /api/* │     │  CMS   │
└──────────┘     └──────────┘     └─────────┘     └────────┘
      ▲                                                 │
      │                                                 ▼
┌──────────┐                                      ┌───────────┐
│ Webhook  │                                      │ PostgreSQL │
│ Service  │                                      │    16      │
└──────────┘                                      └───────────┘
      ▲
      │
┌──────────────────────────────────────────────────────────┐
│ GitHub Actions Release Workflow                          │
│ (CI → Build Images → Push to GHCR → Trigger Webhook)     │
└──────────────────────────────────────────────────────────┘
```

- **Cloudflare Tunnel** — Containerized edge, forwards external traffic to Nginx (no exposed host ports in prod)
- **Nginx** — Reverse proxy, single origin for all routes
- **Frontend** — Next.js 16 (App Router, React 19, Tailwind 4)
- **Backend** — Django 5.x + Wagtail CMS, REST API via DRF
- **Database** — PostgreSQL 16
- **Webhook Service** — Receives authenticated deploy requests from GitHub Actions and orchestrates production deployments

## Prerequisites

- Docker & Docker Compose (v2+)
- Node.js 22 (`nvm use` picks this up automatically)
- Python 3.12 (`pyenv` picks this up automatically)
- [pre-commit](https://pre-commit.com/) (optional, for git hooks)

## Quick Start

### Source Build (development)

```bash
# 1. Clone and configure
git clone <repo-url> && cd mgdrywallusa-website
cp .env.sample .env
# Edit .env — set DJANGO_SECRET_KEY, DB_PASSWORD, and your public domain

# 2. Start the dev stack
make dev-up

# 3. Seed the CMS with default content
docker compose exec backend python manage.py seed_defaults

# 4. Access via Cloudflare Tunnel or local port
#    Frontend: https://your-dev-domain.com
#    Admin:    https://your-dev-domain.com/admin/
#    Local:    http://localhost:8101
```

### Pre-built Image Pull (production)

```bash
# 1. Clone and configure
git clone <repo-url> && cd mgdrywallusa-website
cp .env.sample .env.prod
# Edit .env.prod — set all required variables including REGISTRY_OWNER, IMAGE_TAG

# 2. Bring up the stack (initial setup only)
docker compose -p mgdrywall-prod -f docker-compose.prod.yml --env-file .env.prod up -d
```

After initial setup, **production deploys are automated** — see [Webhook Deployments](#webhook-deployments) below.

## Access

All traffic is served through **Cloudflare Tunnel** — no ports are exposed on the host in production.

| URL | Purpose |
| --- | --- |
| `https://your-domain.com` | Site |
| `https://your-domain.com/admin/` | Wagtail admin |
| `https://your-domain.com/api/v1/...` | REST API |

**Dev access:** When running on the local network, `http://localhost:8101` also works.

## Common Commands

### Development

| Command | Description |
| --- | --- |
| `make dev-up` | Build and start all services |
| `make dev-down` | Stop all services |
| `make dev-reset` | Full reset (destroys volumes + rebuild) |
| `make dev-health` | Check if services are responding |
| `make dev-logs` | Tail logs from all services |

### Quality Gates (run on host)

| Command | Description |
| --- | --- |
| `make test` | Run backend + frontend tests |
| `make lint` | Lint backend (ruff) + frontend (eslint) |
| `make format` | Auto-format all code |
| `make typecheck` | TypeScript type checking |
| `make check` | Full gate: lint → typecheck → test |

### Production

| Command | Description |
| --- | --- |
| `make prod-deploy` | Build and deploy production stack |
| `make prod-verify` | Health check production endpoints (inside compose network) |
| `make env-check` | Validate .env.prod before deploying |

### Webhook Deployments

Production deploys are triggered automatically via the GitHub Actions **Release** workflow:

1. **CI workflow** runs on every push — tests, linting, type checks
2. **Release workflow** triggers after CI passes on `main` — builds multi-arch images, pushes to GHCR, then calls the webhook
3. **Webhook service** receives the payload over HTTPS (via Cloudflare Tunnel), authenticates with `WEBHOOK_TOKEN`, and runs `deploy.sh`
4. **deploy.sh** orchestrates: backup → pull images → migrate → swap containers → health check → rollback on failure

To trigger a deploy manually, re-run the Release workflow from GitHub Actions, or push a new commit to `main`.

See `webhook/README.md` for webhook architecture details.

## Environment Variables

See `.env.sample` for the full list. Key variables:

| Variable | Required | Description |
| --- | --- | --- |
| `DJANGO_SECRET_KEY` | ✅ | Django secret (64-char random string) |
| `DB_PASSWORD` | ✅ | PostgreSQL password |
| `NEXT_PUBLIC_SITE_URL` | ✅ | Public canonical URL for metadata/SEO |
| `DEBUG` | ❌ | `True` for dev, `False` for prod (default: `False`) |
| `NGINX_HOST_PORT` | ❌ | Port for dev Nginx (default: `8101`) |
| `POSTGRES_HOST_PORT` | ❌ | Port for dev PostgreSQL (default: `5432`) |
| `CLOUDFLARE_TUNNEL_TOKEN` | Production | Token for containerized Cloudflare Tunnel |
| `WEBHOOK_TOKEN` | Production | Shared secret for webhook authentication (must match GitHub secret) |
| `REGISTRY_OWNER` | Production | GHCR image namespace (default: `mgdrywall`) |
| `IMAGE_TAG` | Production | Docker image tag (default: `latest`) |

## Testing

```bash
# Backend only
cd backend && python -m pytest -v

# Frontend only
cd frontend && npm test

# E2E tests (requires running dev stack)
cd frontend && npx playwright test
```

## Project Structure

```text
.
├── backend/            # Django/Wagtail application
│   ├── core/           # Settings, URLs, shared utilities
│   ├── home/           # HomePage model + API
│   ├── portfolio/      # Portfolio items (CMS-managed)
│   ├── leads/          # Lead intake API
│   ├── site_settings/  # SiteSettings model + Wagtail hooks
│   └── tests/          # Backend test suite (pytest)
├── frontend/           # Next.js application
│   ├── src/app/        # App Router pages and API routes
│   ├── src/components/ # UI components
│   ├── src/features/   # Feature modules
│   ├── src/lib/        # Shared utilities
│   └── tests/          # Unit + e2e tests (Jest, Playwright)
├── nginx/              # Nginx reverse proxy config
├── scripts/            # Bootstrap, backup, restore, deploy
├── docker-compose.yml  # Dev stack orchestration
└── docker-compose.prod.yml  # Production stack (dual-mode)
```
