# Rebrand Checklist — cloning this template for a new client

*Created 2026-09-29 (ADR-0004, Tier-1 output). A new client = clone + env + seed + this checklist. 
Items marked ✅ are already parameterized in-repo; items marked ⛯ are deferred to the dedicated ops sprint (see `tasks/backlog.md`).*

## Done — already parameterized (ADR-0004, 2026-09-29)

- ✅ **Frontend fallbacks:** all demo copy lives in one module, `frontend/src/lib/defaults.ts`.
- ✅ **Backend model defaults:** neutral placeholders (`home/models.py`, `site_settings/models.py`, `site_settings/wagtail_hooks.py` operations-panel fallback — the site the 2026-09-20 audit missed).
- ✅ **`WAGTAIL_SITE_NAME`** (`backend/core/settings.py`) — env-driven, neutral default.
- ✅ **Seed:** env-driven (`SEED_NOTIFICATION_EMAILS`, `SEED_AUTO_RESPONDER_SUBJECT`, `SEED_SERVICES_JSON` — see `.env.sample`); demo services labeled replace-me.
- ✅ **JSON-LD `@type`:** `business_schema_type` field on the HomePage SEO tab; empty → generic default pair.
- ✅ **Hero image:** `public/images/hero.png` via `HERO_IMAGE_FALLBACK`.
- ✅ **Portfolio meta description:** from the CMS tagline.
- ✅ **watchdog.sh:** `WATCHDOG_DIR` (default: script's checkout); cron installed by `bootstrap-host.sh` (`APP_DIR` overridable).
- ✅ **Makefile `DEPLOY_DIR`** (already `?=`); **`dev-health`** default now localhost.
- ✅ **cf-cache-rule.sh `RULE_DESC`** overridable; **cf-cache-stats.sh** requires `CF_STATS_HOST` (no brand default).

## Deferred to the ops sprint (needs live-pipeline verification — do not bundle with content work)

- ⛯ Compose project names (`mgdrywall-dev` / `mgdrywall-prod`) in `docker-compose*.yml`.
- ⛯ GHCR image names + `REGISTRY_OWNER` unification (Makefile/env vs `release.yml` repo var).
- ⛯ DB name/user defaults across `docker-compose.yml`, `docker-compose.prod.yml`, `.env.sample`, `ci.yml`, `core/settings_test.py`, `scripts/backup.sh`/`restore.sh`.
- ⛯ `release.yml` deploy target: `DEPLOY_SSH_HOSTNAME`, user, port → GitHub `vars:`/`secrets:` only.
- ⛯ `bootstrap-host.sh` script title still says "MG Drywall USA stack" (cosmetic; safe to fix in the ops pass).

## Known sync points (hand-maintained — check on every rebrand)

1. `frontend/tests/e2e/mock-backend.mjs` — plain Node ESM, **cannot import** `defaults.ts`; its demo settings block is annotated and must be kept in sync by hand (search: `ADR-0004` comment).
2. `scripts/deploy.sh` / release plumbing strings (ops sprint).
3. `README.md` "Webhook Deployments" section is stale (webhook retired in US-010; deploys run over Access-protected SSH) — refresh during the ops sprint.
4. `backend/tests/core/test_smoke.py:57` hardcodes the prod preview host (Tier-3 judgment call).
5. Trade-specific icon vocabulary in `ServicesSection` (`paint`/`patch`/`wall` switch) — Tier-3 judgment call.
6. `seed_portfolio`'s six LA sample projects are demo-labeled — decide per client: keep, edit, or delete via the admin.
