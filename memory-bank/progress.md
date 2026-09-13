# Progress — MGDrywall USA

*Status: visitor flow MVP-complete pending sign-off stories US-001…US-006; 44 unpushed commits on `main`; US-001+US-003 pipeline paused at the Developer gate (plan approved).*

## What works (verified)

### Visitor
- Home: hero (CMS copy), services grid, portfolio section with two multi-select filters + Clear, lead form.
- Navigation: logo → home from anywhere; `#section` anchors resolve to `/#section` off the home page (Header + Footer); no dead ends on listing page.
- `/portfolio`: filter toolbar (same component), back-to-home link, project cards → detail.
- Lightbox: obvious enlarged controls, keyboard nav, focus trap/restore, per-photo context (project link, scope, finish tags, captions).
- Project detail page: full project info, back to portfolio.
- Lead form API: validated, photo attachments, honeypot, throttled; `{"errors": {field: [messages]}}` contract.

### Admin (owner)
- Operations Hub: Leads queue, Portfolio management, Site Settings, Edit Home — sidebar "Edit Home" links to the real edit page (was a dead `#` link without a HomePage; now falls back to "Create Home" and never dead).
- Fresh-DB bootstrap: post_migrate hook + `seed` guarantee a HomePage site root with services seeded (local DB fixed: Home → Portfolio → 6 items).

### Tests
- Backend 120 passed; frontend ~230 passed (coverage 96.73/86.73/95.03/98.67 vs thresholds 85/80/80/85); e2e Desktop Chrome green (see known issues for WebKit).

## What's left (priority order — see `activeContext.md`)

1. **US-001 (+US-003)** sitewide quote/call CTA + detail-page home links — **in flight** (SDM + Architect approved; Developer gate next; approved plan recorded in `activeContext.md`).
2. **US-002** sitewide phone visibility (SiteSettings-driven).
3. **US-006** settings live preview — **drafted** from the owner (see `docs/stories/US-006-…`); pages preview via Draft Mode, settings saves are instantly live with no preview.
4. **US-004** human mobile walkthrough.
5. **US-005** owner edit→preview→publish walkthrough (covers settings preview via US-006).
6. Regenerate visual baseline against real backend data.
7. ~~Correct README's stale "single-page" intent~~ — **done 2026-09-13** (`119ae86`).

## Known issues (pre-existing / environmental)

- **Visual baseline stale** — `tests/e2e/visual/` homepage screenshot predates filter/lightbox changes; regenerate with `--update-snapshots` once portfolio data renders through real wiring (never against the broken mock path).
- **Portfolio e2e requires free ports** — Playwright reuses whatever listens on configured ports; with unrelated server on 8000, use `MOCK_PORT=8010 HOST_FRONTEND_PORT=3100`.
- **WebKit broken in sandbox** — all Mobile Safari e2e errors are environmental ("WebKit encountered an internal error").
- **`npm run lint` noise** — ~243 errors all from stale `frontend/.next.rootbak/`.
- **43 commits unpushed** — production deploys on push; needs explicit approval.
- `mock-backend.mjs` uses *global* scenario state — spec files running in parallel can leak scenarios (one portfolio e2e flake; passes in isolation).

## Milestones

| Date | Milestone |
|---|---|
| 2026-09-12 | Visitor nav + portfolio filter + lightbox UX overhaul (micro-committed, fully gated) |
| 2026-09-13 | Admin "Edit Home" root cause fixed; local DB parity with production |
| 2026-09-13 | PO flow scrutiny; memory bank initialized; US-001…US-005 drafted |
| 2026-09-13 | Feature pipeline for US-001+US-003: SDM + Architect gates approved; US-006 (settings live preview) drafted |
