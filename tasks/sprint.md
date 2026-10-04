# Sprint — Gate-Clear + Template-ization (ADR-0004)

**Stories:** US-005 (Owner can run the site — close the launch gate) + Template-ization Tier 2 (ADR-0004)  
**Pipeline:** PO ✓ · SDM ✓ (amended F1–F6) · Architect ✓ (Adjust verdict, V1–V6 folded in) · Human gate ✓ (approved 2026-09-29: plan, rootbak deletion, bundle-push policy, walkthrough) · Developer ✓ · QA ✓ (gates per commit) · **CLOSED-WITH-DEFERRALS 2026-10-04**  
**Push policy:** the 6 stray docs commits bundle with the first sprint push.  
**Status:** Template-ization complete. **US-005 owner walkthrough PASSED 2026-10-04 (steps ①②③) → US-005 closed → LAUNCH DECLARED 2026-10-04.** Sprint fully closed, no deferrals remaining on the gate.

## Tasks

| ID | Task | Story | Status |
|---|---|---|---|
| T1 | US-005 prep: `make dev-up` + pre-flight + walkthrough script for the owner | US-005 | ✓ |
| T2 | US-005 owner walkthrough (user, critical path): homepage draft→preview→publish; portfolio publish/unpublish; tagline preview (chrome moved to the homepage in US-007) | US-005 | ✓ **passed 2026-10-04** (run from backlog #1 script; portfolio Preview button intentionally absent per `preview_modes=[]`) |
| T3 | Record results, close US-005, declare launch | US-005 | ✓ **2026-10-04 — LAUNCH DECLARED** |
| T4 | ADR-0004 + review-doc pointer (records additive-migration decision, squash rejected) | Tmpl | ✓ `2d656b2` |
| T5 | Frontend `src/lib/defaults.ts` extraction (api.ts fallback, HeroSection FALLBACK, ServicesSection DEFAULT_SERVICES); client-safe; mocks/handlers import from it | Tmpl Tier2 | ✓ `caeaf3e` |
| T6 | Backend neutral defaults (home/models.py, site_settings/models.py, wagtail_hooks.py:65) + additive AlterField migrations only | Tmpl Tier2 | ✓ `3210980` |
| T7 | Env-driven seed (services, notification email, auto-responder demo string); no new dependencies | Tmpl Tier2 | ✓ `cb878d0` |
| T8 | `business_schema_type` cross-stack: HomePage SEO tab + APIField + TS type + `fields=` + layout.tsx; empty → current JSON-LD default; tests both sides | Tmpl Tier2 | ✓ `74c33b4` |
| T9 | Hero rename (`hero-drywall.png`→`hero.png`, 3 refs) + portfolio meta description; isolated commit; baselines only from CI artifact | Tmpl Tier2 | ✓ `0f6270f` — pure `git mv`, pixel-identical: baselines remain valid, no refresh needed (CI visual green on `2edbd1a`) |
| T10 | watchdog.sh DIR env-driven (default: script dir); bootstrap-host.sh idempotent watchdog cron; README docs; US-011 cron line deferred | Tmpl Tier1 | ✓ `d63a55b` |
| T11 | `docs/rebrand-checklist.md` + safe parameterizations (WAGTAIL_SITE_NAME, cf-script defaults, Makefile strings); checklist includes wagtail_hooks site_name | Tmpl Tier1 | ✓ `b02d090` |
| T12 | Memory bank update + close-out | housekeeping | ✓ 2026-10-04 |

## Walkthrough findings fixed during T2 (before the owner cut it short)

- Portfolio pages had no headless preview → classic Wagtail preview 500'd with `TemplateDoesNotExist` (`portfolio/portfolio_item.html`). Fixed by `preview_modes=[]` on PortfolioPage/PortfolioItem + regression test (`14d8575`). Homepage preview (Next.js draft mode) unaffected.
- Dev DB needed `manage.py migrate` after the new migrations landed (the walkthrough's first admin hit predated it) — applied live 2026-10-01; prod gets it automatically on the next deploy.

## QA gate

- Every commit: relevant tests then `make check` before declaring done.
- Model changes: `pytest --create-db` on first run after migrations land.
- T9: baselines refreshed **only** from the CI artifact — never local regen.

## Exit criteria (final)

Template-ization merged, all gates green ✓ · rebrand checklist exists ✓ · backlog reflects all deferrals ✓ · memory bank updated ✓ · **owner walkthrough passed + LAUNCH DECLARED 2026-10-04 ✓ — sprint fully closed.**

