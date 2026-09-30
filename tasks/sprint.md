# Sprint — Gate-Clear + Template-ization (ADR-0004)

**Stories:** US-005 (Owner can run the site — close the launch gate) + Template-ization Tier 2 (ADR-0004)  
**Pipeline:** PO ✓ · SDM ✓ (amended F1–F6) · Architect ✓ (Adjust verdict, V1–V6 folded in) · Human gate ✓ (approved 2026-09-29: plan, rootbak deletion, bundle-push policy, walkthrough) · Developer — · QA —  
**Push policy:** the 6 stray docs commits bundle with the first sprint push.

## Tasks

| ID | Task | Story | Status |
|---|---|---|---|
| T1 | US-005 prep: `make dev-up` + pre-flight + walkthrough script for the owner | US-005 | ✓ |
| T2 | US-005 owner walkthrough (user, critical path): homepage draft→preview→publish; portfolio publish/unpublish; settings "Preview site" button | US-005 | ⏳ awaiting user |
| T3 | Record results, close US-005, declare launch | US-005 | ☐ |
| T4 | ADR-0004 + review-doc pointer (records additive-migration decision, squash rejected) | Tmpl | ✓ `2d656b2` |
| T5 | Frontend `src/lib/defaults.ts` extraction (api.ts fallback, HeroSection FALLBACK, ServicesSection DEFAULT_SERVICES); client-safe; mocks/handlers import from it | Tmpl Tier2 | ✓ `caeaf3e` |
| T6 | Backend neutral defaults (home/models.py, site_settings/models.py, wagtail_hooks.py:65) + additive AlterField migrations only | Tmpl Tier2 | ✓ `3210980` |
| T7 | Env-driven seed (services, notification email, auto-responder demo string); no new dependencies | Tmpl Tier2 | ✓ `cb878d0` |
| T8 | `business_schema_type` cross-stack: HomePage SEO tab + APIField + TS type + `fields=` + layout.tsx; empty → current JSON-LD default; tests both sides | Tmpl Tier2 | ✓ `74c33b4` |
| T9 | Hero rename (`hero-drywall.png`→`hero.png`, 3 refs) + portfolio meta description; isolated commit; baselines only from CI artifact | Tmpl Tier2 | ✓ `0f6270f` — baseline refresh pending next push |
| T10 | watchdog.sh DIR env-driven (default: script dir); bootstrap-host.sh idempotent watchdog cron; README docs; US-011 cron line deferred | Tmpl Tier1 | ✓ `d63a55b` |
| T11 | `docs/rebrand-checklist.md` + safe parameterizations (WAGTAIL_SITE_NAME, cf-script defaults, Makefile strings); checklist includes wagtail_hooks site_name | Tmpl Tier1 | ✓ `b02d090` |
| T12 | Memory bank update + close-out | housekeeping | ☐ after T2 |

## QA gate

- Every commit: relevant tests then `make check` before declaring done.
- Model changes: `pytest --create-db` on first run after migrations land.
- T9: baselines refreshed **only** from the CI artifact — never local regen.

## Exit criteria

US-005 closed → launch declared · Tier-2 extraction merged, all gates green · rebrand checklist exists · backlog reflects all deferrals · memory bank updated.

