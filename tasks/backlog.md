# Backlog — MGDrywall USA

Priority order. Items here were explicitly deferred by the 2026-09-29 sprint (Gate-Clear + Template-ization) or the 2026-09-20 status review.

| # | Item | Source | Notes |
|---|---|---|---|
| 1 | **US-011** — Cloudflare cache analytics implementation | ADR-0003, design locked 2026-09-27 | Next sprint after template-ization. Full design in `docs/stories/US-011-cloudflare-cache-analytics.md`. Its bootstrap cron line is deferred until this ships. |
| 2 | **Tier-1 ops parameterization sprint** | 2026-09-20 review §Tier 1 | Compose project names, GHCR/`REGISTRY_OWNER` unification, DB name/user defaults, `release.yml` host/user/port → repo vars/secrets, watchdog `DIR` full audit. Touches CI/CD — needs its own verification cycle against the live deploy pipeline. |
| 3 | **Tier-3 judgment calls** | 2026-09-20 review §Tier 3 | Trade icon vocabulary; `tests/core/test_smoke.py:57` hardcoded prod preview host; `seed_portfolio` demo-data gating decision. |
| 4 | **`CLOUDFLARE_ZT_TOKEN` revocation** | US-010 close-out | Deferred at the user's request (they are still optimizing Cloudflare across sites) — do not prompt. |
| 5 | **Origin API cache keyed by `page.cache_key`; Next `sitemap.ts` from Wagtail API** | US-008 backlog | Post-launch caching improvements. |
