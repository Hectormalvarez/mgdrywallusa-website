# Backlog — MGDrywall USA

Priority order. Items here were explicitly deferred by the 2026-09-29 sprint (Gate-Clear + Template-ization) or the 2026-09-20 status review.

| # | Item | Source | Notes |
|---|---|---|---|
| 0 | ~~Direction decision (restated by owner)~~ **Resolved 2026-10-04:** MVP scope is closed — walkthrough passed, launch declared. Any remaining functionality questions become regular backlog items; nothing else gates launch. | Owner, 2026-10-04 | — |
| 1 | ~~US-005 owner walkthrough~~ **Done 2026-10-04** — steps ①②③ passed; US-005 closed; **LAUNCH DECLARED**. Script preserved in sprint history (`tasks/sprint.md` T2). | 2026-10-04, owner's direction at sprint close | Closed |
| 2 | **US-011** — Cloudflare cache analytics implementation | ADR-0003, design locked 2026-09-27 | Next sprint after template-ization. Full design in `docs/stories/US-011-cloudflare-cache-analytics.md`. Its bootstrap cron line is deferred until this ships. |
| 3 | **Tier-1 ops parameterization sprint** | 2026-09-20 review §Tier 1 | Compose project names, GHCR/`REGISTRY_OWNER` unification, DB name/user defaults, `release.yml` host/user/port → repo vars/secrets, watchdog `DIR` full audit. Touches CI/CD — needs its own verification cycle against the live deploy pipeline. |
| 4 | **Tier-3 judgment calls** | 2026-09-20 review §Tier 3 | Trade icon vocabulary; `tests/core/test_smoke.py:57` hardcoded prod preview host; `seed_portfolio` demo-data gating decision. |
| 5 | **`CLOUDFLARE_ZT_TOKEN` revocation** | US-010 close-out | Deferred at the user's request (they are still optimizing Cloudflare across sites) — do not prompt. |
| 6 | **Origin API cache keyed by `page.cache_key`; Next `sitemap.ts` from Wagtail API** | US-008 backlog | Post-launch caching improvements. |
