# Active Context — MGDrywall USA

*Updated: 2026-10-04. Read this file first when resuming. Sprint/task detail lives in `tasks/`; milestone history in `progress.md`.*

## Current focus

**Sprint "Gate-Clear + Template-ization" CLOSED-WITH-DEFERRALS 2026-10-04** (`tasks/sprint.md`).

- **Template-ization (ADR-0004) complete:** single frontend fallback module `frontend/src/lib/defaults.ts` (client-safe; MSW handlers import it; `tests/e2e/mock-backend.mjs` is a hand-synced annotated copy — plain Node ESM cannot import TS); neutral backend model defaults via **additive AlterField migrations only** (home.0013/0014, site_settings.0006 — squash rejected, prod has replayed the history); env-driven seed (`SEED_NOTIFICATION_EMAILS`, `SEED_AUTO_RESPONDER_SUBJECT`, `SEED_SERVICES_JSON`); `business_schema_type` cross-stack field (HomePage SEO tab → nested `seo` payload → layout JSON-LD, empty = default pair); `hero-drywall.png`→`hero.png`; watchdog/bootstrap parameterization + cron; `docs/rebrand-checklist.md`. Gates green per commit: backend pytest 131 (in container), frontend tsc/eslint/jest 259.
- **Launch NOT declared.** Launch gate = US-005 owner walkthrough ONLY (US-002/US-004 verified Done — the 2026-09-20 review's gate list was stale on those two; code+tests verified 2026-09-29). The owner cut the walkthrough from the sprint → **backlog #1 holds the full 3-step script**. US-005 story stays In Progress.
- **Backlog row #0 is a placeholder: "Direction decision (restated by owner)."** The owner's one-line direction was lost to session compaction on 2026-10-04. **Do not act on a guess** — when the owner restates it, replace the row.
- Walkthrough findings fixed en route: portfolio pages lacked headless preview → classic preview 500'd (`TemplateDoesNotExist`); fixed with `preview_modes=[]` + regression test (`14d8575`). Homepage preview (Next.js draft mode) unaffected.

## Next steps (in order)

1. **Owner:** run backlog #1 walkthrough (~15 min) → then declare launch (close US-005, update story + review doc).
2. **Owner:** restate the direction decision → replace backlog row #0.
3. **Next sprint:** US-011 cache analytics (design locked, ADR-0003). When it ships, add the collector cron line to `bootstrap-host.sh` (deliberately deferred until then).
4. Post-push: refresh visual baselines from the CI artifact only (procedure in `progress.md` known-issues).

## Environment lessons (stable ones live in `techContext.md`)

- `FRONTEND_URL` exported in the host shell makes jest preview-route tests fail (the route prefers the env over the Host header **by design**) — run `env -u FRONTEND_URL npm test`.
- New migrations do NOT auto-apply to the running dev stack — the walkthrough's first admin hit hit `ProgrammingError`; always `manage.py migrate` after pulling migration changes (prod gets it via deploy.sh).
- `frontend/.next.rootbak` (root-owned, ~243 phantom lint errors) was removed via `docker compose exec frontend rm -rf .next.rootbak` — host sudo could not touch container-owned files. Lint is clean now.
- Background long commands (dev-up, jest): `nohup … > /tmp/x.log 2>&1 &` then poll — the tool times out at 30s.
