# Backlog — MGDrywall USA

Priority order. Items here were explicitly deferred by the 2026-09-29 sprint (Gate-Clear + Template-ization) or the 2026-09-20 status review.

| # | Item | Source | Notes |
|---|---|---|---|
| 0 | **Direction decision (restated by owner)** | Owner, 2026-10-04 | Placeholder — the owner's sprint-wrap-up direction is to be restated in one line; replace this row with the actual item. **Do not act on a guess.** |
| 1 | **US-005 owner walkthrough** (launch gate) | 2026-10-04, owner's direction at sprint close | Cut from the sprint by the owner. 3-step script (≈15 min, dev stack at `localhost:8101/admin/`): ① Edit Home → hero edit → Preview (unsaved) → Publish → live shows it → revert via revision history → Publish. ② Portfolio → add item → Publish → appears in "Our Work" + `/portfolio` + detail → Unpublish → gone, pages intact. ③ Edit Home → Brand tab → tagline edit **unsaved** → Preview shows it, live unchanged, discard. Note: portfolio pages intentionally have no Preview button (headless; fixed `14d8575`). Launch is declared only after this passes. |
| 2 | **US-011** — Cloudflare cache analytics implementation | ADR-0003, design locked 2026-09-27 | Next sprint after template-ization. Full design in `docs/stories/US-011-cloudflare-cache-analytics.md`. Its bootstrap cron line is deferred until this ships. |
| 3 | **Tier-1 ops parameterization sprint** | 2026-09-20 review §Tier 1 | Compose project names, GHCR/`REGISTRY_OWNER` unification, DB name/user defaults, `release.yml` host/user/port → repo vars/secrets, watchdog `DIR` full audit. Touches CI/CD — needs its own verification cycle against the live deploy pipeline. |
| 4 | **Tier-3 judgment calls** | 2026-09-20 review §Tier 3 | Trade icon vocabulary; `tests/core/test_smoke.py:57` hardcoded prod preview host; `seed_portfolio` demo-data gating decision. |
| 5 | **`CLOUDFLARE_ZT_TOKEN` revocation** | US-010 close-out | Deferred at the user's request (they are still optimizing Cloudflare across sites) — do not prompt. |
| 6 | **Origin API cache keyed by `page.cache_key`; Next `sitemap.ts` from Wagtail API** | US-008 backlog | Post-launch caching improvements. |
