# Tech Context — MGDrywall USA

## Toolchain (pinned)

- Node 22 (`.nvmrc`) · Python 3.12 (`.python-version`) · PostgreSQL 16
- Backend: Django 5.2, Wagtail 7, DRF, wagtail-headless-preview, factory-boy, pytest, ruff (line-length 120)
- Frontend: Next.js 16 (App Router), React 19, Tailwind 4 (only), TypeScript 5.9, cva + `cn()` from `@/lib/cn`, jest + ts-jest + MSW, Playwright

## Commands (host — the app stack runs in Docker; never mix)

| Purpose | Command |
|---|---|
| Full quality gate (before declaring done) | `make check` |
| All tests | `make test` |
| Backend tests | `cd backend && python -m pytest -v` (needs `.venv`; `--reuse-db`, `--create-db` after model changes) |
| Backend lint/format | `cd backend && ruff check . && ruff format --check .` |
| Frontend unit tests (coverage-gated) | `cd frontend && npm test` |
| TypeScript check | `cd frontend && npx tsc --noEmit` |
| E2E (dev stack up) | `cd frontend && npx playwright test` |
| Dev stack up/down/seed | `make dev-up` / `make dev-down` / `make dev-seed` |

## Environment map (verified 2026-09-13)

- Compose project `mgdrywall-dev-*`: `backend` (NOT exposed to host), `frontend` (3000 internal), `nginx` (**host port 8101** — the local entry point), `db` (**host port 5433**), `cloudflared`.
- Backend access from host: `docker compose exec -T backend …` or via Nginx `http://localhost:8101`. **Host port 8000 is occupied by an unrelated project's container (`retail_api`)** — do not assume `localhost:8000` is this backend.
- Settings: `core/settings.py` reads all config from env (`.env` at repo root; **never edit, echo, or commit it**). Test settings `core.settings_test` set safe defaults (SQLite in-memory locally, Postgres in CI).

## Hard-won environment quirks (QA notes)

1. **E2E needs free ports**: Playwright's `reuseExistingServer` happily reuses whatever listens on the configured ports. With port 8000 occupied, the mock backend never starts and every data-dependent test fails with "Failed to load portfolio". Run e2e as:
   `MOCK_PORT=8010 HOST_FRONTEND_PORT=3100 npx playwright test …`
2. **Mobile Safari (WebKit) project is broken in this sandbox** — every WebKit test errors with "WebKit encountered an internal error", including untouched specs. Desktop Chrome/Edge are fine. Treat WebKit failures as environmental, not regressions.
3. **`npm run lint` reports ~243 errors, all from stale `frontend/.next.rootbak/`** (pre-existing artifact). Lint specific files instead.
4. **Visual baseline** `tests/e2e/visual/__screenshots__/homepage.png` is stale (portfolio section changes). Regenerate (`--update-snapshots`) only once portfolio data renders through the real backend wiring.
5. Backend tests are fast (~15s, 120 tests); frontend jest suite ~230 tests.

## Safety

- Never edit/echo `.env` or `.env.prod` (DB password, Django secret, Cloudflare tunnel token, webhook token).
- `make dev-reset` / `docker compose down -v` destroy data volumes — confirm with the user first.
- Push to `main` = automated production deploy. Never push without explicit approval.
- Production ops: `make prod-*` targets exist; don't touch unless asked.
