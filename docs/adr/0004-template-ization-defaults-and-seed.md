# ADR 0004 — Template-ization: one frontend defaults module, neutral backend defaults, env-driven seed

Date: 2026-09-29 · Status: Accepted
Relates to: the 2026-09-20 status review (`docs/reviews/2026-09-20-launch-status-and-reproducibility.md`), whose reproducibility audit produced this sprint · ADR-0001 (chrome lives on the homepage — this ADR adds a field there, not to SiteSettings).

## Context

### Problem

The 2026-09-20 audit found the brand identity (name, phone, email, address, trade copy) duplicated across **six parallel code layers** (~30 files): Django model defaults, migrations, `seed.py`, the frontend `SITE_SETTINGS_FALLBACK`, `HeroSection`/`ServicesSection` prop defaults, and portfolio page copy. Cloning the template for a new client today is a risky grep-and-pray rebrand. The review's sequencing decision — launch first, then template-ize, then custom features — is now being executed (launch gate reduced to US-005's owner walkthrough).

### Verified coupling facts (2026-09-29 code sweep)

- Frontend fallback duplication is confirmed in `src/lib/api.ts` (`SITE_SETTINGS_FALLBACK`, incl. the Austin/TX address), `src/components/sections/HeroSection.tsx` (`FALLBACK`, hero copy), and `src/components/sections/ServicesSection.tsx` (`DEFAULT_SERVICES`, trade copy) — plus a **fourth, previously uncounted layer**: the test fixtures `tests/e2e/mock-backend.mjs` and `tests/mocks/handlers.ts` re-declare the settings fallback verbatim.
- Backend brand defaults live in `home/models.py` (site name, tagline, phone, email, postal code), `site_settings/models.py` (notification email, auto-responder subject/body), **and `site_settings/wagtail_hooks.py` (`site_name` — a site the 2026-09-20 audit missed)**.
- The brand strings also exist inside 8 historical migrations. The production database has already replayed this history.
- `scripts/watchdog.sh` hardcodes `DIR` to a development-sandbox path; `bootstrap-host.sh` installs no cron entries, so the watchdog's `*/15` line is undocumented manual host setup.
- Backend test coupling to the brand is low: only `tests/core/test_smoke.py` references the prod hostname (Tier-3 item, out of scope).

## Decision

1. **Frontend: one client-safe defaults module.** `src/lib/defaults.ts` becomes the single source for the site-settings fallback, homepage-chrome fallback, and default services. `api.ts`, `HeroSection.tsx`, and `ServicesSection.tsx` import from it; the test mocks/handlers import it too instead of hand-copying. The module must not import server-only machinery (`next/headers`) — `LeadIntakeForm` depends on the client-safety of this import chain. Fallbacks remain fallbacks: CMS data always wins.
2. **Backend: neutral model defaults via additive `AlterField` migrations only. Squashing migration history is rejected.** The history has already replayed on production; squashing would invalidate every existing database's migration state and risk divergence for zero functional gain. Brand strings inside past migrations become inert, not load-bearing. Changing a field default touches no rows.
3. **Seed configuration is env-driven only** (`SEED_*`-style env vars) with clearly-labeled "replace-me demo" defaults. **No new parsing dependency** — YAML/JSON file loading was considered and rejected; env vars suffice at this scale and keep the image dependency set untouched.
4. **JSON-LD `@type` becomes CMS-editable:** a `business_schema_type` field on the HomePage chrome (SEO tab, per ADR-0001), optional, `APIField`-declared, with the matching TS type and `fields=` query (cross-stack sync rule). When empty, the frontend renders the current default pair `["DrywallContractor", "HomeAndConstructionBusiness"]` — zero live behavior change at deploy.
5. **Tier-1 becomes a scripted contract, not in-sprint surgery:** `docs/rebrand-checklist.md` enumerates every remaining identity touchpoint. Only zero-risk in-repo parameterizations happen in this sprint (`WAGTAIL_SITE_NAME`, cf-script host/description defaults, Makefile strings). Everything touching compose files, GHCR naming, or `release.yml` deploy plumbing is **deferred to a dedicated ops sprint** — it needs its own verification cycle against the live deploy pipeline.
6. **Ops scripts:** `watchdog.sh` `DIR` becomes env-driven with a script-directory default (zero-config correct on the host); `bootstrap-host.sh` installs the watchdog cron idempotently (`crontab -l` merge, swap-block pattern) and documents the `/opt` symlink requirement in the README. The US-011 collector's cron line is **deferred to the US-011 sprint** — its management command does not exist yet.

## Consequences

- A new-client clone becomes: clone + env + seed + rebrand checklist, with brand copy living only as CMS data plus one frontend fallback module.
- Brand strings remain in git history and in past migrations — accepted as inert.
- The homepage render changes once (hero image rename `hero-drywall.png` → `hero.png`); visual baselines are refreshed **only from a CI artifact**, never locally.
- Tier-3 judgment calls stay open questions: trade-specific icon vocabulary, `test_smoke.py`'s hardcoded prod preview host, and whether `seed_portfolio`'s LA sample projects get gated behind a flag or stay as labeled demo data.
- US-011 (next sprint) inherits a codebase where the admin report UI is built on post-extraction code, avoiding the rework the review warned about.

## Update 2026-09-29 — sprint execution

This ADR was written at the start of the Gate-Clear + Template-ization sprint (see `tasks/sprint.md`); decisions 1–6 were reviewed and accepted by the SDM and Architect gates before implementation. Decision 2 explicitly overturns the review doc's "regenerate/squash migrations" suggestion.
