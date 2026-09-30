# Status Review — Launch Proximity & Reproducibility

*Review date: 2026-09-20 · Repo state at review: `main` == `origin/main` at `f38df35`, tree clean, 0 unpushed commits — everything on `main` is live in production.*

This review answers two questions: **how close is the project to launch**, and **can the way this project is built be reproduced for similar client projects**. It is a status snapshot, not a story or an ADR — decisions belong in `docs/stories/` and `docs/adr/` when the work happens.

---

## 1. Launch status

### Shipped and verified live

| Layer | Status |
|---|---|
| Visitor funnel (home → portfolio → detail → lead form) | ✅ MVP-complete; US-001/003/007/008 shipped, verified live (`cf-cache-status: HIT`) |
| Lead intake | ✅ Validated, photo attachments, honeypot, throttled, stable `{"errors": {field: [messages]}}` contract |
| Admin ("Operations Hub") | ✅ Machinery works; **end-to-end owner walkthrough (US-005) still pending** |
| CI/CD | ✅ US-010 cutover complete — Access-protected SSH deploys, truthful deploy signal, watchdog convergence, rollback |
| Edge caching | ✅ US-008 live per ADR-0002; baseline hit rate was 3.3% — **post-deploy proof not yet re-run** (`scripts/cf-cache-stats.sh`) |
| Testing | ✅ ~120 backend pytest, ~251 frontend jest (coverage well above thresholds), 128 e2e green in CI |
| Analytics | ⏳ US-011 (cache analytics collector) approved, not started — **not a launch blocker** |

### Launch gate (what actually remains)

1. **US-002** — sitewide phone visibility (SiteSettings-driven). Small, conversion-critical.
2. **US-004** — a human walking the whole funnel on a real phone.
3. **US-005** — the owner edit → preview → publish walkthrough. Treat as a **launch gate, not backlog**: it is the acceptance test for the entire headless-CMS premise (the owner running the site without a developer).
4. Re-run `scripts/cf-cache-stats.sh` for the post-US-008 hit-rate proof.

---

## 2. Reproducibility: this codebase as a template for similar projects

Full audit of every layer for project-specific coupling (brand strings, hostnames, business copy). **Verdict: the architecture is an excellent template; the identity layer is the problem.** The same business copy/identity exists in **six parallel code layers**, so a new-client clone today is a risky grep-and-pray rebrand across ~30 files.

### What is already template-grade (reusable as-is)

- **Infrastructure identity is fully env-parameterized.** `scripts/deploy.sh` derives `PUBLIC_HOST` from `.env.prod`'s `FRONTEND_URL`; `seed` syncs the Wagtail Site record from the same source; Cloudflare zone/token/tunnel values are all env-driven. A new client = new env vars, not new code.
- **Ops machinery is client-agnostic**: Access-SSH deploy wrapper + forced command, concurrency lock + rollback, watchdog, backup/restore, health contract enforced by a test (`tests/core/test_health_contract.py`).
- **Content architecture**: scaffolding (`home/bootstrap.py`, page tree, nav skeleton) is cleanly separated from business content — most rebranding is *data* in Wagtail, not code.
- `nginx/nginx.conf` (one comment aside), `.github/workflows/ci.yml` (DB names aside), `.env.sample` placeholder style, and the Make-based dev/quality workflow are template-grade.

### Gaps, ranked by effort to fix

**Tier 1 — mechanical find/replace (~1 day; should be scripted as a "rebrand checklist")**

1. Compose project names (`mgdrywall-dev`/`mgdrywall-prod`), GHCR image names + `REGISTRY_OWNER` (unify: `release.yml` reads it from a repo var, compose from one env).
2. DB name/user defaults: `docker-compose.yml` + `docker-compose.prod.yml`, `.env.sample`, `ci.yml`, `core/settings_test.py`, `scripts/backup.sh`/`restore.sh`.
3. `WAGTAIL_SITE_NAME` (`core/settings.py:157`), watchdog `DIR` (fully hardcoded — worst offender, zero parameterization), `bootstrap-host.sh` `APP_DIR=/opt/mgdrywallusa-website`, Makefile `DEPLOY_DIR` + `dev-health` URL, `cf-cache-rule.sh` `RULE_DESC`, `cf-cache-stats.sh` default host.
4. `release.yml`: `ssh.taylormadetech.net`, `hadev@localhost`, port `2222` → move into GitHub `vars:`/`secrets:`.
5. **Host state that never reaches git (found 2026-09-27):** `bootstrap-host.sh` installs Docker, sets up swap, and creates `/opt/mgdrywallusa-website` — but installs **no cron entries**. So the watchdog's `*/15` line (and, once US-011 Phase 1 lands, the collector's daily line) are manual, undocumented host setup: a clone that skips them silently has no watchdog and no analytics. Install both idempotently from `bootstrap-host.sh` (its swap block is the pattern to copy) and document them in the README alongside the `/opt` symlink requirement.

**Tier 2 — extract brand copy out of code (~2–3 days; the right fix)**

6. **Brand copy is frozen into 8 migrations (29 hits) and model defaults** — `home/models.py` has `+1-555-DRYWALL`, `info@mgdrywallusa.com`, trade copy as field defaults; same in `site_settings/models.py` (auto-responder) and `WAGTAIL_SITE_NAME`. Replace with neutral placeholders; regenerate/squash migrations so the migration history stops carrying the brand.
7. `core/management/commands/seed.py` hardcodes 3 drywall services + notification email/subject → make env- or YAML-driven, or mark seed content as "replace-me demo".
8. **Frontend fallback duplication**: the same brand defaults exist verbatim in `lib/api.ts` (`SITE_SETTINGS_FALLBACK` incl. Austin/TX 78701 address), `HeroSection.tsx:37–42`, and `ServicesSection.tsx:10–30`. Collapse into a single `defaults.ts` module. Also: make the `DrywallContractor` JSON-LD type (`app/layout.tsx:66`) a SiteSettings field (e.g. `business_schema_type`); rename `hero-drywall.png` → `hero.png`; un-hardcode the `portfolio/page.tsx:15` meta description.
9. Parameterize `watchdog.sh` (reuse the deploy env conventions); document the `/opt` symlink requirement in the README (it currently lives only in memory-bank).

**Tier 3 — judgment calls**

10. `seed_portfolio`'s 6 LA sample projects (Santa Monica, Venice, Malibu…) — keep as clearly-labeled demo data or gate behind `--demo`.
11. Trade-specific icon vocabulary; hardcoded prod preview host in `tests/core/test_smoke.py:57`.

**Key structural finding:** the same business copy lives in six parallel layers — Django model defaults, migrations, `seed.py`, `SITE_SETTINGS_FALLBACK` (`api.ts`), `HeroSection`/`ServicesSection` prop defaults, and portfolio page copy. Changing a client's tagline today means touching all six or living with drift. Tier 2 collapses this to: CMS data + one `defaults.ts` + env.

---

## 3. Recommended sequencing

**Launch first, then template-ize, then custom features.** Custom features built *before* the Tier-2 extraction will add more brand-coupled code and make the extraction more expensive later.

1. **Launch gate**: US-002, US-004, US-005 (+ CF cache-stats proof). No template work during this — don't mix concerns.
2. **Template-ization sprint**: Tier 2 first; Tier 1 as its scripted checklist output (e.g. `docs/rebrand-checklist.md` or a `make rebrand NAME=…` scaffolding command). Record the decisions as **ADR-0004** — this was planned as "ADR-0003", but that number was taken on 2026-09-27 by the cache-stats storage ADR (`docs/adr/0003-store-cloudflare-cache-stats-in-postgres.md`). **Update 2026-09-29:** ADR-0004 written (`docs/adr/0004-template-ization-defaults-and-seed.md`) and this review's "regenerate/squash migrations" suggestion is **overturned** there — model defaults are neutralized via additive `AlterField` migrations only, because the production database has already replayed this migration history.
3. **Then** user-facing custom features, on a codebase where "new client" = clone + env + seed + checklist.
4. **US-011** (cache analytics): design locked 2026-09-27 with ADR-0003 and queued **after the launch gate**, running the complete flow (see the story). **Its ordering against the template-ization sprint is still open** — the collector is brand-independent, but the admin report adds a UI surface, so building it after Tier 2 would avoid reworking UI on code that is about to move.

---

## Update 2026-09-21 — CD coupling resolved (US-012)

Tier 1 item 4 from the audit is done: `release.yml` no longer hardcodes a
host-zone tunnel hostname. Deploys now travel over the **project's own
tunnel** (`mgdrywall-ssh.taylormadetech.net` → `ssh://host-gateway:22`),
gated by a project-scoped Access app + service token, with the hostname read
from the repo variable `DEPLOY_SSH_HOSTNAME`. Verified live (Release
`35668628234`, deploy job 38 s, `.last-deploy.json` ok, images `sha-06421ba`).

**Hardened 2026-09-26:** the app's policy was `include: everyone` — which
Cloudflare documents as a *misconfiguration that lets anyone in*. It is now
scoped to the service token (`include: [{service_token: {token_id: …}}]`);
anonymous clients are refused at the edge (verified), CI still deploys.

Template-ization lessons (also in `docs/stories/US-012-cd-route-enclosure.md`):

- **Cloudflared config changes are a deliberate step.** `deploy.sh` never
  recreates the tunnel service; the cron watchdog used to apply such changes
  silently within ≤15 minutes via a blanket `compose up -d` (the US-009
  outage class). Now: watchdog converges **start-only**, and `deploy.sh`
  Step 7b **warns** with the exact remediation command when a never-recreated
  service drifts from the compose file.
- **The prod checkout must stay clean**: `git pull --ff-only` is non-fatal in
  `deploy.sh`, so a dirty host checkout silently skips the update.
- **Never delete the host-level `ssh.` route in a clone-based project**: it
  may be shared with other projects' deploy keys (as it is here).


