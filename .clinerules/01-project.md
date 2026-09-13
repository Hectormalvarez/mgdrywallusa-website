# MGDrywall USA Website — Project Rules

Monorepo: `backend/` (Django 5.2 + Wagtail 7 + DRF, Python 3.12, PostgreSQL 16) and `frontend/` (Next.js 16 App Router, React 19, Tailwind 4, TypeScript 5.9). Runs in Docker Compose behind Nginx + Cloudflare Tunnel; production deploys are webhook-automated from GitHub Actions.

## Canonical Commands

| Purpose | Command |
| :--- | :--- |
| Full quality gate — run before declaring done | `make check` |
| Lint / format | `make lint` / `make format` |
| TypeScript check | `make typecheck` |
| All tests (backend + frontend) | `make test` |
| Backend tests only | `cd backend && python -m pytest -v` |
| Frontend unit tests only | `cd frontend && npm test` |
| E2E (requires dev stack up) | `cd frontend && npx playwright test` |
| Dev stack up / down | `make dev-up` / `make dev-down` |
| Seed CMS defaults | `make dev-seed` |

- Quality gates run **on the host** from `backend/`/`frontend/` subdirectories; the application stack runs **in Docker**. Do not mix the two (no `pytest` inside compose, no `docker` needed for `make check`).
- Toolchain is pinned: Node 22 (`.nvmrc`), Python 3.12 (`.python-version`).
- Backend tests use `--reuse-db` by default; first run after a model change may need `pytest --create-db`.

## Safety

- Never edit `.env` or `.env.prod`. Never echo, copy, or commit their contents (secrets: DB password, Django secret key, Cloudflare tunnel token, webhook token).
- Production deploys are automated: pushing to `main` triggers CI → GHCR image build → webhook deploy. Never push to `main`, run `make prod-*` targets, or trigger the Release workflow unless explicitly asked.
- `make dev-reset` and `docker compose down -v` destroy data volumes — confirm with the user before running.

## Conventions

- Conventional commits with scopes: `feat(portfolio): ...`, `fix(admin): ...`, `test(header): ...` (see global Commit Discipline rule).
- `.editorconfig` is authoritative: 2-space indent for TS/JS/JSON/CSS/HTML, 4-space for Python/YAML, tabs for Makefiles, LF, final newline, no trailing whitespace.