# Active Context — MGDrywall USA

*Updated: 2026-10-04. Read this file first when resuming. Sprint/task detail lives in `tasks/`; milestone history in `progress.md`.*

## Current focus

**Sprint "Gate-Clear + Template-ization" FULLY CLOSED 2026-10-04. US-005 owner walkthrough PASSED (steps ①②③) → US-005 Done → LAUNCH DECLARED 2026-10-04.** MVP scope is closed. Owner direction (backlog #0 resolved): any remaining functionality questions become regular backlog items — nothing else gates launch.

- **Template-ization (ADR-0004) complete:** single frontend fallback module `frontend/src/lib/defaults.ts` (client-safe; MSW handlers import it; `tests/e2e/mock-backend.mjs` is a hand-synced annotated copy — plain Node ESM cannot import TS); neutral backend model defaults via **additive AlterField migrations only** (home.0013/0014, site_settings.0006 — squash rejected, prod has replayed the history); env-driven seed (`SEED_NOTIFICATION_EMAILS`, `SEED_AUTO_RESPONDER_SUBJECT`, `SEED_SERVICES_JSON`); `business_schema_type` cross-stack field (HomePage SEO tab → nested `seo` payload → layout JSON-LD, empty = default pair); `hero-drywall.png`→`hero.png`; watchdog/bootstrap parameterization + cron; `docs/rebrand-checklist.md`. Gates green per commit: backend pytest 131 (in container), frontend tsc/eslint/jest 259.
- Walkthrough findings fixed en route: portfolio pages lacked headless preview → classic preview 500'd (`TemplateDoesNotExist`); fixed with `preview_modes=[]` + regression test (`14d8575`). Homepage preview (Next.js draft mode) unaffected.
- Housekeeping 2026-10-04: stale local branches `feat/edge-caching` + `test/e2e-scenario-isolation` deleted (both merged into main).

## Next steps (in order)

1. **Open the next sprint: US-011 cache analytics** (design locked, ADR-0003, `docs/stories/US-011-cloudflare-cache-analytics.md`). When it ships, add the collector cron line to `bootstrap-host.sh` (deliberately deferred until then).
2. Then backlog #3 (Tier-1 ops parameterization — own verification cycle against live deploys) and #4 (Tier-3 judgment calls).
3. Post-launch caching items (backlog #6: origin API keyed by `page.cache_key`, Next `sitemap.ts`) are now unlocked — slot per owner priority.
4. Future functionality questions: add as backlog rows; scope into sprints only with owner approval.

## Environment lessons (stable ones live in `techContext.md`)

- `FRONTEND_URL` exported in the host shell makes jest preview-route tests fail (the route prefers the env over the Host header **by design**) — run `env -u FRONTEND_URL npm test`.
- New migrations do NOT auto-apply to the running dev stack — the walkthrough's first admin hit hit `ProgrammingError`; always `manage.py migrate` after pulling migration changes (prod gets it via deploy.sh).
- `frontend/.next.rootbak` (root-owned, ~243 phantom lint errors) was removed via `docker compose exec frontend rm -rf .next.rootbak` — host sudo could not touch container-owned files. Lint is clean now.
- Background long commands (dev-up, jest): `nohup … > /tmp/x.log 2>&1 &` then poll — the tool times out at 30s.
