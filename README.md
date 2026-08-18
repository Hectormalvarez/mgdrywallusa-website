# MGDrywall USA Website

Mobile-first, single-page residential landing page for drywall & finishing contractors.

**Stack:** Next.js 16 · Django 5.x / Wagtail CMS · PostgreSQL 16 · Nginx reverse proxy

## Architecture

```text
┌─────────┐     ┌──────────┐     ┌─────────┐
│  Nginx  │────▶│ Frontend │     │  Django │
│  :8101  │     │ Next.js  │     │  :8000  │
│         │     │  :3000   │     │         │
│         │────▶│──────────│────▶│ Wagtail │
│         │     │  /api/*  │     │  CMS    │
└─────────┘     └──────────┘     └─────────┘
                                       │
                                       ▼
                                 ┌───────────┐
                                 │ PostgreSQL │
                                 │    16      │
                                 └───────────┘
```

- **Nginx** — Reverse proxy, single origin for all routes
- **Frontend** — Next.js 16 (App Router, React 19, Tailwind 4)
- **Backend** — Django 5.x + Wagtail CMS, REST API via DRF
- **Database** — PostgreSQL 16

## Prerequisites

- Docker & Docker Compose (v2+)
- Node.js 22 (`nvm use` picks this up automatically)
- Python 3.12 (`pyenv` picks this up automatically)
- [pre-commit](https://pre-commit.com/) (optional, for git hooks)

## Quick Start

```bash
# 1. Clone and configure
git clone <repo-url> && cd mgdrywallusa-website
cp .env.example .env
# Edit .env — set DJANGO_SECRET_KEY and DB_PASSWORD

# 2. Start the dev stack
make dev-up

# 3. Seed the CMS with default content
docker compose exec backend python manage.py seed_defaults

# 4. Open
#    Frontend: http://localhost:8101
#    Admin:    http://localhost:8101/admin/
```

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
| `make prod-seed` | Seed default content on production |
| `make prod-logs` | Tail production logs |
| `make prod-status` | Check production container status |
| `make prod-verify` | Health check all production endpoints |
| `make env-check` | Validate .env.prod before deploying |

### Git Hooks

```bash
# Install pre-commit hooks (one-time setup)
pip install pre-commit
pre-commit install
```

Hooks run automatically on `git commit` and check for:

- Trailing whitespace and missing final newlines
- Valid YAML/TOML syntax
- Ruff linting and formatting (backend)

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
│   ├── src/components/ # UI components (sections, layout, ui, forms)
│   ├── src/features/   # Feature modules (leads)
│   ├── src/lib/        # Shared utilities
│   ├── src/types/      # TypeScript types
│   └── tests/          # Unit + e2e tests (Jest, Playwright)
├── nginx/              # Nginx reverse proxy config
└── docker-compose.yml  # Dev stack orchestration
```

## Environment Variables

See `.env.example` for the full list. Key variables:

| Variable | Required | Description |
| --- | --- | --- |
| `DJANGO_SECRET_KEY` | ✅ | Django secret (64-char random string) |
| `DB_PASSWORD` | ✅ | PostgreSQL password |
| `DEBUG` | ❌ | `True` for dev, `False` for prod (default: `False`) |
| `NGINX_HOST_PORT` | ❌ | Port for Nginx (default: `8101`) |
| `POSTGRES_HOST_PORT` | ❌ | Port for PostgreSQL (default: `5432`) |

## Testing

```bash
# Backend only
cd backend && python -m pytest -v

# Frontend only
cd frontend && npm test

# E2E tests (requires running dev stack)
cd frontend && npx playwright test
```
