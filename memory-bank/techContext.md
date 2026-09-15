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
| Backend tests | `cd backend && python -m pytest -v` (needs `.venv`; `--reuse-db`, `--create-db` after model changes) — **2026-09-15: host pyenv 3.12 broken; run in the container instead: `docker compose exec -T backend sh -c 'python -m pytest -q'`** |
| Backend lint/format | `cd backend && ruff check . && ruff format --check .` (container if host toolchain broken) |
| Frontend unit tests (coverage-gated) | `cd frontend && npm test` |
| TypeScript check | `cd frontend && npx tsc --noEmit` |
| E2E (dev stack up) | `cd frontend && npx playwright test` (projects: "Desktop Chrome", "Mobile Chrome", "Mobile Safari" — no `chromium` project) |
| Dev stack up/down/seed | `make dev-up` / `make dev-down` / `make dev-seed` |
| Cloudflare cache stats | `scripts/cf-cache-stats.sh [--days N]` (env/`.env`: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ZONE_ID`) |
| Cloudflare cache rule (idempotent) | `CLOUDFLARE_*` set + `scripts/cf-cache-rule.sh host1 [host2 ...]` |
| Frontend prod build | **On the host** (`cd frontend && npx next build`) — in-container builds leave root-owned `.next` files that break host e2e; if done in-container, `chown -R $(id -u):$(id -g) frontend/.next` after |

## Environment map (verified 2026-09-13)

- Compose project `mgdrywall-dev-*`: `backend` (NOT exposed to host), `frontend` (3000 internal), `nginx` (**host port 8101** — the local entry point), `db` (**host port 5433**), `cloudflared`.
- Backend access from host: `docker compose exec -T backend …` or via Nginx `http://localhost:8101`. **Host port 8000 is occupied by an unrelated project's container (`retail_api`)** — do not assume `localhost:8000` is this backend.
- Settings: `core/settings.py` reads all config from env (`.env` at repo root; **never edit, echo, or commit it**). Test settings `core.settings_test` set safe defaults (SQLite in-memory locally, Postgres in CI).

## Hard-won environment quirks (QA notes)

1. **E2E needs free ports**: Playwright's `reuseExistingServer` happily reuses whatever listens on the configured ports. With port 8000 occupied, the mock backend never starts and every data-dependent test fails with "Failed to load portfolio". Run e2e as:
   `MOCK_PORT=8010 HOST_FRONTEND_PORT=3100 npx playwright test …`
2. **Mobile Safari (WebKit) project is broken in this sandbox** — every WebKit test errors with "WebKit encountered an internal error" locally, but the **same project passes in GitHub Actions CI** (verified 2026-09-14: only the visual baseline failed there, and only because it was stale). Treat WebKit failures as *local-sandbox* environmental issues, not regressions.
3. **`npm run lint` reports ~243 errors, all from stale `frontend/.next.rootbak/`** (pre-existing artifact). Lint specific files instead.
4. **Visual baselines** are per-project (`tests/e2e/__screenshots__/visual/homepage.spec.ts/homepage/{Desktop-Chrome,Mobile-Safari,Mobile-Chrome}.png`), refreshed 2026-09-14 from CI-rendered actuals (the one environment where mock data flows correctly). Do NOT regenerate locally — the sandbox's homepage renders with an empty portfolio section and would bake in a broken baseline. Mobile-funnel spec runs only on touch projects (Desktop Chrome has `testIgnore: [/mobile-funnel/]`).
5. Backend tests are fast (~15s, 120 tests); frontend jest suite ~230 tests.

## Safety

- Never edit/echo `.env` or `.env.prod` (DB password, Django secret, Cloudflare tunnel token, webhook token).
- `make dev-reset` / `docker compose down -v` destroy data volumes — confirm with the user first.
- Push to `main` = automated production deploy. Never push without explicit approval.
- Production ops: `make prod-*` targets exist; don't touch unless asked.
