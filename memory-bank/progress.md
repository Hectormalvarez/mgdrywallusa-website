# Progress — MGDrywall USA

*Status: visitor flow + admin + CD + edge caching all shipped and live; template-ization (ADR-0004) complete 2026-10-01. **Launch NOT declared** — gated solely on the US-005 owner walkthrough (backlog #1, script included). Sprint history: `tasks/sprint*.md`.*

## What works (verified)

### Visitor
- Home: hero (CMS copy), services grid, portfolio section with two multi-select filters + Clear, lead form.
- Navigation: logo → home from anywhere; `#section` anchors resolve off-home; no dead ends (US-001/US-003).
- `/portfolio`: filter toolbar, back-to-home link, project cards → detail; global 404 escape hatches.
- Lightbox: keyboard nav, focus trap/restore, per-photo context.
- Lead form API: validated, photo attachments, honeypot, throttled; `{"errors": {field: [messages]}}` contract.
- Phone number sitewide (US-002): header `tel:` link, drawer, footer; empty-number guards.

### Admin (owner)
- Operations Hub: Leads queue, Portfolio management, Edit Home (chrome on the homepage per ADR-0001), Site Settings (operational only).
- Homepage draft preview via Next.js draft mode; portfolio pages intentionally have no Django-side preview (`preview_modes=[]`, `14d8575`).
- Fresh-DB bootstrap: post_migrate hook + env-driven `seed` (HomePage root, demo-labeled services).

### Platform
- Edge caching per ADR-0002 (max-age=0 + SWR, TTL pinned 300s, purge-on-publish); stale-serving proven live.
- CD per US-010/US-012: Access-protected SSH over the project tunnel, watchdog start-only convergence, drift warnings.
- Template-ization per ADR-0004: brand copy out of code (one defaults module + neutral backend defaults + env-driven seed), rebrand checklist (`docs/rebrand-checklist.md`).

### Tests (as of 2026-10-01)
- Backend 131 pytest passed (container); frontend 259 jest, tsc/eslint clean; e2e 128/128 in CI (Mobile Safari: CI only).

## What's left (priority order — see `tasks/backlog.md`)

1. **US-005 owner walkthrough** (backlog #1, script included) → then declare launch.
2. **Direction decision placeholder** (backlog #0) — owner to restate.
3. **US-011** cache analytics implementation (backlog #2, design locked).
4. Tier-1 ops parameterization sprint (backlog #3); Tier-3 judgment calls (backlog #4).
5. Visual baselines: refresh from the wrap-up push's CI artifact (hero rename landed).

## Known issues

- ~~Visual baselines stale post-hero-rename~~ — resolved: the rename was a `git mv` of the identical file (pixel-identical render); CI visual green on `2edbd1a`. Refresh-from-artifact procedure stands for future real visual changes.
- **`FRONTEND_URL` in the host shell** breaks two jest preview-route tests (env correctly wins over Host header) — run `env -u FRONTEND_URL npm test`.
- **WebKit broken in sandbox** — environmental; passes in CI.
- **e2e needs free ports** — `MOCK_PORT=8010 HOST_FRONTEND_PORT=3100`.
- ~~`npm run lint` noise from `.next.rootbak`~~ — resolved 2026-10-01 (artifact deleted via the frontend container; lint clean).

## Milestones

| Date | Milestone |
|---|---|
| 2026-09-12 | Visitor nav + portfolio filter + lightbox UX overhaul |
| 2026-09-13 | US-001+US-003 shipped & closed; memory bank initialized; US-001…US-006 drafted; US-002 shipped |
| 2026-09-14 | US-006/US-007 shipped (chrome → homepage, ADR-0001); US-004 owner on-device pass; e2e isolation sprint |
| 2026-09-15 | US-008 edge caching live (ADR-0002) |
| 2026-09-16/21 | US-010 Access-SSH deploys; US-012 project-tunnel route enclosure |
| 2026-09-20 | Status review: launch gate = US-002/004/005; reproducibility audit → template-ization planned |
| 2026-09-26/27 | Cache analytics review; stale-serving fixed; US-011 design locked (ADR-0003) |
| 2026-09-29 | Gate-Clear + Template-ization sprint opened (ADR-0004; SDM/Architect gates; human approval) |
| 2026-10-01 | Template-ization executed (T4–T11, 8 commits); portfolio preview 500 found via walkthrough and fixed |
| 2026-10-04 | Sprint CLOSED-WITH-DEFERRALS: walkthrough + launch deferred to backlog; memory bank pruned |
